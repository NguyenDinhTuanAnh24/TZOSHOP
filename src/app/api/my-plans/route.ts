import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getAiLineFromProductSlug, getAiLineLabelFromSlug } from "@/lib/ai-line";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const buckets = await prisma.creditBucket.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            apiFamily: true,
            tier: true,
            credits: true,
            durationDays: true,
            priceVnd: true,
            apiKeyLimit: true,
            allowedModels: true,
            allowedReasoning: true,
          },
        },
        apiKeys: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            encryptedKey: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    const { decryptText } = await import("@/lib/crypto");

    const activeModels = await prisma.aiModel.findMany({
      where: { isActive: true },
      select: {
        publicName: true,
        upstreamModel: true,
        apiFamily: true,
        inputCreditRate: true,
        outputCreditRate: true,
        isActive: true,
      },
    });
    
    const activeModelsMap = new Map(activeModels.map(m => [m.publicName, m]));

    const data = await Promise.all(buckets.map(async (bucket) => {
      const usedCredits = bucket.creditsTotal - bucket.creditsRemaining;

      // Determine allowedModels list with fallback & automatic database self-healing backfill
      let baseAllowedModels = bucket.allowedModels;
      if ((!baseAllowedModels || baseAllowedModels.length === 0) && bucket.product?.allowedModels) {
        baseAllowedModels = bucket.product.allowedModels;
        
        // Trigger asynchronous backfill in the database
        prisma.creditBucket.update({
          where: { id: bucket.id },
          data: {
            allowedModels: bucket.product.allowedModels,
            allowedReasoning: bucket.product.allowedReasoning || [],
          }
        }).catch(err => console.error(`[backfill] Failed to update CreditBucket ${bucket.id}:`, err));
      } else if (!baseAllowedModels || baseAllowedModels.length === 0) {
        baseAllowedModels = bucket.product?.allowedModels || [];
      }

      // Filter and map active models for the bucket
      const activeAllowedModels = baseAllowedModels
        .map(name => {
          const model = activeModelsMap.get(name);
          if (!model) {
            // Fallback: If AiModel is not registered in the database, return a default presentation object
            const parts = name.split("/");
            const publicNameOnly = parts[parts.length - 1] || name;
            return {
              publicName: name,
              upstreamModel: publicNameOnly,
              apiFamily: bucket.apiFamily,
              inputCreditRate: 1,
              outputCreditRate: 1,
              isActive: true,
            };
          }
          return {
            ...model,
            inputCreditRate: model.inputCreditRate.toNumber(),
            outputCreditRate: model.outputCreditRate.toNumber(),
          };
        })
        .filter((m): m is NonNullable<typeof m> => !!m);

      const apiKeys = bucket.apiKeys.map((ak) => {
        let key = null;
        if (ak.encryptedKey) {
          try {
            key = decryptText(ak.encryptedKey);
          } catch (e) {
            console.error("Failed to decrypt key in my-plans:", e);
          }
        }
        return {
          id: ak.id,
          name: ak.name,
          keyPrefix: ak.keyPrefix,
          key: key,
          maskedKey: key ? `${key.slice(0, 12)}...${key.slice(-6)}` : ak.keyPrefix,
          isActive: ak.isActive,
          createdAt: ak.createdAt
        };
      });

      let newApiQuotaRemaining = null;
      let newApiQuotaTotal = null;
      let newApiQuotaUsed = null;
      let quotaSource = "DB";

      if (apiKeys.length > 0) {
        let totalRemain = 0;
        let totalUsed = 0;
        let successFetchCount = 0;

        for (const ak of apiKeys) {
          if (ak.key && ak.isActive) {
            try {
              const { getNewApiTokenByKey } = await import("@/lib/newapi");
              const tokenDetails = await getNewApiTokenByKey(ak.key);
              if (tokenDetails) {
                totalRemain += tokenDetails.remainQuota;
                totalUsed += tokenDetails.usedQuota;
                successFetchCount++;
              }
            } catch (e) {
              console.error(`Failed to fetch NewAPI token for keyPrefix ${ak.keyPrefix}:`, e);
            }
          }
        }

        if (successFetchCount > 0) {
          newApiQuotaRemaining = totalRemain.toString();
          newApiQuotaUsed = totalUsed.toString();
          newApiQuotaTotal = (totalRemain + totalUsed).toString();
          quotaSource = "NEWAPI";
        }
      }

      return {
        id: bucket.id,
        apiFamily: bucket.apiFamily,
        aiLine: bucket.product?.slug ? getAiLineFromProductSlug(bucket.product.slug) : null,
        aiLineLabel: bucket.product?.slug ? getAiLineLabelFromSlug(bucket.product.slug) : null,
        creditsTotal: bucket.creditsTotal.toString(),
        creditsRemaining: bucket.creditsRemaining.toString(),
        usedCredits: usedCredits.toString(),
        newApiQuotaRemaining,
        newApiQuotaTotal,
        newApiQuotaUsed,
        quotaSource,
        apiKeyLimit: bucket.apiKeyLimit,
        activeApiKeys: apiKeys.length,
        apiKeys: apiKeys,
        allowedModels: activeAllowedModels, // Detailed objects now
        allowedReasoning: bucket.allowedReasoning,
        startsAt: bucket.startsAt,
        expiresAt: bucket.expiresAt,
        isActive: bucket.isActive,
        createdAt: bucket.createdAt,
        product: bucket.product
          ? {
              ...bucket.product,
              credits: bucket.product.credits.toString(),
              allowedModels: bucket.product.allowedModels,
            }
          : null,
      };
    }));

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
    console.error("GET /api/my-plans failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể tải gói credits của bạn.",
        },
      },
      {
        status: 500,
      },
    );
  }
}
