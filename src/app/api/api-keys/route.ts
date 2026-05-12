import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { prisma } from "@/lib/prisma";
import { encryptText, decryptText } from "@/lib/crypto";
import { requireCurrentUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

function createApiKeyValue() {
  return `tz_live_${nanoid(40)}`;
}

function getKeyPrefix(apiKey: string) {
  return `${apiKey.slice(0, 12)}...${apiKey.slice(-6)}`;
}

function getFamilyLabel(apiFamily: string) {
  const familyMap: Record<string, string> = {
    CODEXAI: "CodexAI",
    CLAUDE: "Claude",
    GEMINI: "Gemini",
    DEEPSEEK: "DeepSeek",
  };
  return familyMap[apiFamily] || apiFamily;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creditBucket: {
          select: {
            id: true,
            apiFamily: true,
            apiKeyLimit: true,
            creditsTotal: true,
            creditsRemaining: true,
            expiresAt: true,
            allowedModels: true,
            allowedReasoning: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                tier: true,
              },
            },
          },
        },
      },
    });

    type ApiKeyItem = (typeof apiKeys)[number];

    const data = apiKeys.map((apiKey: ApiKeyItem) => {
      let key = null;
      let maskedKey = apiKey.keyPrefix;

      if (apiKey.encryptedKey) {
        try {
          key = decryptText(apiKey.encryptedKey);
          maskedKey = `${key.slice(0, 12)}...${key.slice(-6)}`;
        } catch {
          maskedKey = apiKey.keyPrefix;
        }
      }

      return {
        id: apiKey.id,
        name: apiKey.name,
        apiFamily: apiKey.apiFamily,
        keyPrefix: apiKey.keyPrefix,
        key,
        maskedKey,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt,
        revokedAt: apiKey.revokedAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        creditBucket: apiKey.creditBucket
          ? {
              id: apiKey.creditBucket.id,
              productName: apiKey.creditBucket.product?.name ?? getFamilyLabel(apiKey.apiFamily),
              creditsTotal: apiKey.creditBucket.creditsTotal.toString(),
              creditsRemaining: apiKey.creditBucket.creditsRemaining.toString(),
            }
          : null,
      };
    });

    return NextResponse.json({
      data,
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
    console.error("GET /api/api-keys failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể tải danh sách API key.",
        },
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const name = body?.name;
    const creditBucketId = body?.creditBucketId;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          error: {
            message: "Vui lòng nhập tên API key.",
          },
        },
        {
          status: 400,
        },
      );
    }

    if (!creditBucketId || typeof creditBucketId !== "string") {
      return NextResponse.json(
        {
          error: {
            message: "Thiếu creditBucketId.",
          },
        },
        {
          status: 400,
        },
      );
    }

    const creditBucket = await prisma.creditBucket.findFirst({
      where: {
        id: creditBucketId,
        userId: user.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        product: true,
      },
    });

    if (!creditBucket) {
      // Debug logging
      const allUserBuckets = await prisma.creditBucket.findMany({
        where: { userId: user.id },
        select: { id: true, isActive: true, expiresAt: true }
      });
      console.log("[API Key Create Debug]", {
        userId: user.id,
        requestedBucketId: creditBucketId,
        foundActiveBucketsCount: allUserBuckets.filter(b => b.isActive).length,
        allBuckets: allUserBuckets,
        now: new Date().toISOString()
      });

      return NextResponse.json(
        {
          error: {
            message: "Gói credits không tồn tại, đã hết hạn hoặc không còn hoạt động.",
          },
        },
        {
          status: 404,
        },
      );
    }

    const activeKeyCount = await prisma.apiKey.count({
      where: {
        userId: user.id,
        creditBucketId: creditBucket.id,
        isActive: true,
      },
    });

    if (activeKeyCount >= creditBucket.apiKeyLimit) {
      return NextResponse.json(
        {
          error: {
            message: `Gói này đã đạt giới hạn ${creditBucket.apiKeyLimit} API key.`,
          },
        },
        {
          status: 400,
        },
      );
    }

    const fullKey = createApiKeyValue();
    const keyHash = createHash("sha256").update(fullKey).digest("hex");
    const keyPrefix = getKeyPrefix(fullKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        creditBucketId: creditBucket.id,
        name: name.trim(),
        apiFamily: creditBucket.apiFamily,
        keyHash,
        keyPrefix,
        encryptedKey: encryptText(fullKey),
        isActive: true,
      },
    });

    // Thông báo cho user
    try {
      const { createNotificationOnce } = await import("@/lib/server/notifications");
      await createNotificationOnce({
        userId: user.id,
        type: "API_KEY_CREATED",
        title: "API key đã được tạo",
        message: `API key cho gói ${creditBucket.product?.name || creditBucket.apiFamily} đã sẵn sàng.`,
        href: "/api-keys",
        dedupeKey: `api-key-created:${apiKey.id}`,
        metadata: { apiKeyId: apiKey.id }
      });
    } catch (e) {
      console.error("API Key notification failed:", e);
    }

    return NextResponse.json(
      {
        data: {
          id: apiKey.id,
          name: apiKey.name,
          apiFamily: apiKey.apiFamily,
          keyPrefix: apiKey.keyPrefix,
          fullKey,
          isActive: apiKey.isActive,
          createdAt: apiKey.createdAt,
          creditBucket: {
            id: creditBucket.id,
            apiFamily: creditBucket.apiFamily,
            apiKeyLimit: creditBucket.apiKeyLimit,
            product: creditBucket.product
              ? {
                  id: creditBucket.product.id,
                  name: creditBucket.product.name,
                  slug: creditBucket.product.slug,
                  tier: creditBucket.product.tier,
                }
              : null,
          },
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }
    console.error("POST /api/api-keys failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể tạo API key.",
        },
      },
      {
        status: 500,
      },
    );
  }
}
