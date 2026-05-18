import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

type UsageRow = {
  id: string;
  apiFamily: "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditsCharged: string;
  status: "SUCCESS" | "FAILED";
  errorCode: string | null;
  errorMessage: string | null;
  httpStatus: number | null;
  creditsUsed: number;
  createdAt: string;
  apiKey: { id: string; name: string; keyPrefix: string } | null;
};

function inferFamilyFromName(tokenName: string): UsageRow["apiFamily"] {
  const lower = tokenName.toLowerCase();
  if (lower.startsWith("codex")) return "CODEXAI";
  if (lower.startsWith("claude")) return "CLAUDE";
  if (lower.startsWith("gemini")) return "GEMINI";
  return "DEEPSEEK";
}

async function getLocalUsageLogs(userId: string): Promise<UsageRow[]> {
  const localLogs = await prisma.usageLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      apiKey: {
        select: {
          id: true,
          name: true,
          keyPrefix: true,
        },
      },
    },
  });

  return localLogs.map((log) => ({
    id: log.id,
    apiFamily: log.apiFamily,
    model: log.model,
    endpoint: log.endpoint,
    inputTokens: log.inputTokens,
    outputTokens: log.outputTokens,
    totalTokens: log.totalTokens,
    creditsCharged: log.creditsCharged.toString(),
    status: log.status === "SUCCESS" ? "SUCCESS" : "FAILED",
    errorCode: log.errorCode,
    errorMessage: log.errorMessage,
    httpStatus: log.httpStatus,
    creditsUsed: log.creditsUsed,
    createdAt: log.createdAt.toISOString(),
    apiKey: log.apiKey
      ? {
          id: log.apiKey.id,
          name: log.apiKey.name,
          keyPrefix: log.apiKey.keyPrefix,
        }
      : null,
  }));
}

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        encryptedKey: true,
        apiFamily: true,
      },
    });

    if (apiKeys.length === 0) {
      const localRows = await getLocalUsageLogs(user.id);
      return NextResponse.json({
        data: localRows,
        sync: {
          ok: localRows.length > 0,
          message: localRows.length > 0 ? "Đang hiển thị lịch sử sử dụng cục bộ." : "Chưa có API key để đồng bộ lịch sử sử dụng.",
        },
      });
    }

    const { decryptText } = await import("@/lib/crypto");
    const { getNewApiTokenByKey, getNewApiUsageLogs } = await import("@/lib/newapi");

    const keyMap = new Map<string, (typeof apiKeys)[number]>();

    await Promise.all(
      apiKeys.map(async (apiKey) => {
        if (!apiKey.encryptedKey) return;
        try {
          const fullKey = decryptText(apiKey.encryptedKey);
          const token = await getNewApiTokenByKey(fullKey);
          if (token?.name) {
            keyMap.set(token.name, apiKey);
          }
        } catch (error) {
          console.error(`Cannot resolve token name for ${apiKey.keyPrefix}:`, error);
        }
      }),
    );

    const tokenNames = Array.from(keyMap.keys());
    if (tokenNames.length === 0) {
      const localRows = await getLocalUsageLogs(user.id);
      return NextResponse.json({
        data: localRows,
        sync: {
          ok: false,
          message: localRows.length > 0 ? "Chưa đồng bộ được lịch sử sử dụng, đang hiển thị dữ liệu cục bộ." : "Chưa đồng bộ được lịch sử sử dụng",
        },
      });
    }

    const results = await Promise.all(
      tokenNames.map(async (tokenName) => {
        try {
          const logs = await getNewApiUsageLogs(tokenName);
          return { tokenName, ok: true, logs };
        } catch (error) {
          console.error(`Cannot fetch usage logs for ${tokenName}:`, error);
          return { tokenName, ok: false, logs: [] as Array<Record<string, unknown>> };
        }
      }),
    );

    const syncOk = results.some((item) => item.ok);
    const rows: UsageRow[] = results
      .flatMap((item) => item.logs)
      .map((log: any) => {
        const mappedKey = keyMap.get(log.tokenName);
        const apiFamily = mappedKey?.apiFamily ?? inferFamilyFromName(log.tokenName);
        const creditsUsed = Number(log.quota || 0) / 500000;

        const status: UsageRow["status"] = log.status === "SUCCESS" ? "SUCCESS" : "FAILED";

        return {
          id: String(log.id),
          apiFamily,
          model: log.modelName,
          endpoint: "/v1/chat/completions",
          inputTokens: Number(log.promptTokens || 0),
          outputTokens: Number(log.completionTokens || 0),
          totalTokens: Number(log.totalTokens || 0),
          creditsCharged: String(creditsUsed),
          status,
          errorCode: null,
          errorMessage: null,
          httpStatus: log.status === "SUCCESS" ? 200 : 500,
          creditsUsed,
          createdAt: new Date(Number(log.createdAt) * 1000).toISOString(),
          apiKey: mappedKey
            ? { id: mappedKey.id, name: mappedKey.name, keyPrefix: mappedKey.keyPrefix }
            : { id: "unknown", name: log.tokenName, keyPrefix: "N/A" },
        };
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    if (!syncOk || rows.length === 0) {
      const localRows = await getLocalUsageLogs(user.id);
      if (localRows.length > 0) {
        return NextResponse.json({
          data: localRows,
          sync: {
            ok: false,
            message: "Chưa đồng bộ được lịch sử sử dụng, đang hiển thị dữ liệu cục bộ.",
          },
        });
      }
    }

    return NextResponse.json({
      data: rows,
      sync: {
        ok: syncOk,
        message: syncOk ? "Đồng bộ lịch sử sử dụng thành công." : "Chưa đồng bộ được lịch sử sử dụng",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }

    console.error("GET /api/usage failed:", error);
    return NextResponse.json({ error: { message: "Không thể tải lịch sử sử dụng." } }, { status: 500 });
  }
}
