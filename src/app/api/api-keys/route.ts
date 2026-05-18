import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { prisma } from "@/lib/prisma";
import { encryptText, decryptText } from "@/lib/crypto";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getAiLineLabelFromApiFamily, getNewApiGroupFromProductSlug, getTokenNamePrefixFromProductSlug } from "@/lib/ai-line";

export const runtime = "nodejs";

function createApiKeyValue() {
  return `tz_live_${nanoid(40)}`;
}

function getKeyPrefix(apiKey: string) {
  return `${apiKey.slice(0, 12)}...${apiKey.slice(-6)}`;
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
      let maskedKey = apiKey.keyPrefix;

      if (apiKey.encryptedKey) {
        try {
          const key = decryptText(apiKey.encryptedKey);
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
        key: null, // Báº£o máº­t: KhĂ´ng tráº£ full key trong GET list
        maskedKey,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt,
        revokedAt: apiKey.revokedAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        creditBucket: apiKey.creditBucket
          ? {
              id: apiKey.creditBucket.id,
              productName: apiKey.creditBucket.product?.name ?? getAiLineLabelFromApiFamily(apiKey.apiFamily),
              productSlug: apiKey.creditBucket.product?.slug ?? null,
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
        return NextResponse.json({ error: { message: "Vui lĂ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ tiáº¿p tá»¥c." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "KhĂ´ng cĂ³ quyá»n truy cáº­p." } }, { status: 403 });
      }
    }
    console.error("GET /api/api-keys failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "KhĂ´ng thá»ƒ táº£i danh sĂ¡ch API key.",
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
            message: "Vui lĂ²ng nháº­p tĂªn API key.",
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
            message: "Thiáº¿u creditBucketId.",
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
            message: "GĂ³i credits khĂ´ng tá»“n táº¡i, Ä‘Ă£ háº¿t háº¡n hoáº·c khĂ´ng cĂ²n hoáº¡t Ä‘á»™ng.",
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
            message: `GĂ³i nĂ y Ä‘Ă£ Ä‘áº¡t giá»›i háº¡n ${creditBucket.apiKeyLimit} API key.`,
          },
        },
        {
          status: 400,
        },
      );
    }

    const product = creditBucket.product;
    if (!product) {
      return NextResponse.json(
        {
          error: {
            message: "KhĂ´ng tĂ¬m tháº¥y thĂ´ng tin sáº£n pháº©m cho gĂ³i nĂ y.",
          },
        },
        {
          status: 400,
        },
      );
    }

    const newApiGroup = getNewApiGroupFromProductSlug(product.slug);
    const tokenPrefix = getTokenNamePrefixFromProductSlug(product.slug);

    // Log debug an toĂ n (khĂ´ng log token, khĂ´ng log admin key)
    console.log("[NewAPI Group Debug]", {
      productSlug: product.slug,
      newApiGroup,
      allowedModelsCount: product.allowedModels.length,
    });

    // TĂ­nh háº¡n dĂ¹ng tá»« product.durationDays
    let expiredAt: Date | null = null;
    if (product.durationDays) {
      expiredAt = new Date(Date.now() + product.durationDays * 24 * 60 * 60 * 1000);
    }

    // Gá»i NewAPI Gateway Ä‘á»ƒ táº¡o token tháº­t
    const { createNewApiToken } = await import("@/lib/newapi");
    const newApiResult = await createNewApiToken({
      name: `${tokenPrefix}_${nanoid(6)}_${name.trim().replace(/\s+/g, "_")}`,
      group: newApiGroup,
      expiredAt: expiredAt,
      creditsRemaining: Number(product.credits),
      allowedModels: product.allowedModels,
    });

    const rawKey = newApiResult.key;
    const fullKey = rawKey.startsWith("sk-") ? rawKey : `sk-${rawKey}`;
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

    try {
      await prisma.auditLog.create({
        data: {
          adminUserId: user.id,
          action: "CREATE_API_KEY",
          entityType: "API Keys",
          entityId: apiKey.id,
          metadata: {
            actorName: user.name || user.email,
            actorEmail: user.email,
            description: `Táº¡o API key: ${apiKey.name}`,
            module: "API Keys",
            status: "success",
          },
        },
      });
    } catch (error) {
      console.error("Create audit log for API key create failed:", error);
    }

    // ThĂ´ng bĂ¡o cho user
    try {
      const { createNotificationOnce } = await import("@/lib/server/notifications");
      await createNotificationOnce({
        userId: user.id,
        type: "API_KEY_CREATED",
        title: "API key Ä‘Ă£ Ä‘Æ°á»£c táº¡o",
        message: `API key cho gĂ³i ${creditBucket.product?.name || creditBucket.apiFamily} Ä‘Ă£ sáºµn sĂ ng.`,
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
        return NextResponse.json({ error: { message: "Vui lĂ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ tiáº¿p tá»¥c." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "KhĂ´ng cĂ³ quyá»n truy cáº­p." } }, { status: 403 });
      }
    }
    console.error("POST /api/api-keys failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "KhĂ´ng thá»ƒ táº¡o API key.",
        },
      },
      {
        status: 500,
      },
    );
  }
}

