import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCurrentUser();

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            message: "Không tìm thấy API key.",
          },
        },
        {
          status: 404,
        },
      );
    }

    if (!apiKey.isActive) {
      return NextResponse.json({
        data: {
          id: apiKey.id,
          name: apiKey.name,
          apiFamily: apiKey.apiFamily,
          keyPrefix: apiKey.keyPrefix,
          isActive: apiKey.isActive,
          revokedAt: apiKey.revokedAt,
          message: "API key đã được thu hồi trước đó.",
        },
      });
    }

    // Giải mã key để gọi thu hồi từ xa trên NewAPI
    if (apiKey.encryptedKey) {
      try {
        const { decryptText } = await import("@/lib/crypto");
        const fullKey = decryptText(apiKey.encryptedKey);
        const { revokeNewApiTokenByKey } = await import("@/lib/newapi");
        await revokeNewApiTokenByKey(fullKey);
      } catch (e) {
        console.error("Failed to revoke token on NewAPI during local key revocation:", e);
      }
    }

    const revokedKey = await prisma.apiKey.update({
      where: {
        id: apiKey.id,
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          adminUserId: user.id,
          action: "REVOKE_API_KEY",
          entityType: "API Keys",
          entityId: revokedKey.id,
          metadata: {
            actorName: user.name || user.email,
            actorEmail: user.email,
            description: `Thu hồi API key: ${revokedKey.name}`,
            module: "API Keys",
            status: "success",
          },
        },
      });
    } catch (error) {
      console.error("Create audit log for API key revoke failed:", error);
    }

    return NextResponse.json({
      data: {
        id: revokedKey.id,
        name: revokedKey.name,
        apiFamily: revokedKey.apiFamily,
        keyPrefix: revokedKey.keyPrefix,
        isActive: revokedKey.isActive,
        revokedAt: revokedKey.revokedAt,
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
    console.error("PATCH /api/api-keys/[id]/revoke failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể thu hồi API key.",
        },
      },
      {
        status: 500,
      },
    );
  }
}
