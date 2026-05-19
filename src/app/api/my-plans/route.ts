import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getAiLineFromProductSlug, getAiLineLabelFromSlug } from "@/lib/ai-line";
import { normalizeModelId, normalizeModelIds } from "@/lib/model-id";
import { syncCreditsFromNewApi } from "@/lib/server/credit-sync";
import { tokensToCredits } from "@/lib/credits";

export const runtime = "nodejs";
const roundCredits = (value: number) => Math.round(value * 1000) / 1000;

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const buckets = await prisma.creditBucket.findMany({
      where: {
        userId: user.id,
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
      let baseAllowedModels = normalizeModelIds(bucket.allowedModels);
      if ((!baseAllowedModels || baseAllowedModels.length === 0) && bucket.product?.allowedModels) {
        baseAllowedModels = normalizeModelIds(bucket.product.allowedModels);
        
        // Trigger asynchronous backfill in the database
        prisma.creditBucket.update({
          where: { id: bucket.id },
          data: {
            allowedModels: normalizeModelIds(bucket.product.allowedModels),
            allowedReasoning: bucket.product.allowedReasoning || [],
          }
        }).catch(err => console.error(`[backfill] Failed to update CreditBucket ${bucket.id}:`, err));
      } else if (!baseAllowedModels || baseAllowedModels.length === 0) {
        baseAllowedModels = normalizeModelIds(bucket.product?.allowedModels || []);
      }

      // Filter and map active models for the bucket
      const activeAllowedModels = baseAllowedModels
        .map((name) => {
          const normalizedName = normalizeModelId(name);
          const model = activeModelsMap.get(normalizedName);
          if (!model) {
            // Fallback: If AiModel is not registered in DB, still return normalized model id.
            return {
              publicName: normalizedName,
              upstreamModel: normalizedName,
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

      const usageAgg = await prisma.usageLog.aggregate({
        where: {
          OR: [
            { creditBucketId: bucket.id },
            {
              apiKey: {
                creditBucketId: bucket.id,
              },
            },
          ],
        },
        _sum: {
          inputTokens: true,
          outputTokens: true,
        },
      });

      const totalTokens =
        Number(usageAgg._sum.inputTokens ?? 0) +
        Number(usageAgg._sum.outputTokens ?? 0);

      const creditsUsed = tokensToCredits(totalTokens);
      const creditsTotal = Number(bucket.creditsTotal);
      const creditsRemaining = Math.max(creditsTotal - creditsUsed, 0);
      const synced = await syncCreditsFromNewApi({
        activeKeys: bucket.apiKeys.map((k) => ({
          encryptedKey: k.encryptedKey,
          isActive: k.isActive,
        })),
        dbCreditsTotal: creditsTotal,
        dbCreditsRemaining: creditsRemaining,
      });
      const hasSyncedQuota = synced.creditsSource === "NEWAPI" && synced.creditsTotalSynced > 0;
      const remainingRatio = hasSyncedQuota
        ? synced.creditsRemainingSynced / synced.creditsTotalSynced
        : creditsRemaining / Math.max(creditsTotal, 1);
      const normalizedRemaining = roundCredits(Math.max(0, Math.min(creditsTotal, creditsTotal * remainingRatio)));
      const normalizedUsed = roundCredits(Math.max(creditsTotal - normalizedRemaining, 0));

      return {
        id: bucket.id,
        apiFamily: bucket.apiFamily,
        aiLine: bucket.product?.slug ? getAiLineFromProductSlug(bucket.product.slug) : null,
        aiLineLabel: bucket.product?.slug ? getAiLineLabelFromSlug(bucket.product.slug) : null,
        creditsTotal: creditsTotal.toString(),
        creditsRemaining: normalizedRemaining.toString(),
        usedCredits: normalizedUsed.toString(),
        newApiQuotaRemaining: normalizedRemaining.toString(),
        newApiQuotaTotal: creditsTotal.toString(),
        newApiQuotaUsed: normalizedUsed.toString(),
        quotaSource: synced.creditsSource,
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
              allowedModels: normalizeModelIds(bucket.product.allowedModels),
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
