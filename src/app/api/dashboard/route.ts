import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { syncCreditsFromNewApi } from "@/lib/server/credit-sync";
import { getAiLineLabelFromSlug } from "@/lib/ai-line";
import { tokensToCredits } from "@/lib/credits";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const [creditBuckets, apiKeys, usageLogs, orders, recentUsageLogs] =
      await Promise.all([
        prisma.creditBucket.findMany({
          where: {
            userId: user.id,
            isActive: true,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                apiFamily: true,
                tier: true,
              },
            },
            apiKeys: {
              where: { isActive: true },
              select: {
                encryptedKey: true,
                isActive: true,
              },
            },
          },
        }),

        prisma.apiKey.findMany({
          where: {
            userId: user.id,
          },
        }),

        prisma.usageLog.findMany({
          where: {
            userId: user.id,
          },
        }),

        prisma.order.findMany({
          where: {
            userId: user.id,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                apiFamily: true,
                tier: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),

        prisma.usageLog.findMany({
          where: {
            userId: user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          include: {
            apiKey: {
              select: {
                id: true,
                name: true,
                keyPrefix: true,
              },
            },
          },
        }),
      ]);

    type CreditBucketItem = (typeof creditBuckets)[number];
    type ApiKeyItem = (typeof apiKeys)[number];
    type UsageLogItem = (typeof usageLogs)[number];
    type OrderItem = (typeof orders)[number];
    type RecentUsageLogItem = (typeof recentUsageLogs)[number];

    const syncedPlans = await Promise.all(
      creditBuckets.map(async (bucket: CreditBucketItem) => {
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

        return {
          id: bucket.id,
          apiFamily: bucket.apiFamily,
          aiLineLabel: bucket.product?.slug ? getAiLineLabelFromSlug(bucket.product.slug) : bucket.apiFamily,
          creditsTotal: creditsTotal.toString(),
          creditsRemaining: creditsRemaining.toString(),
          creditsUsed: creditsUsed.toString(),
          creditsSource: "USAGE_LOG",
          startsAt: bucket.startsAt,
          expiresAt: bucket.expiresAt,
          product: bucket.product,
        };
      }),
    );

    const totalCredits = syncedPlans.reduce((sum, p) => sum + Number(p.creditsTotal), 0);
    const remainingCredits = syncedPlans.reduce((sum, p) => sum + Number(p.creditsRemaining), 0);
    const usedCredits = Math.max(totalCredits - remainingCredits, 0);

    const activeApiKeys = apiKeys.filter((key: ApiKeyItem) => key.isActive);
    const revokedApiKeys = apiKeys.filter((key: ApiKeyItem) => !key.isActive);

    const successfulUsageLogs = usageLogs.filter(
      (log: UsageLogItem) => log.status === "SUCCESS",
    );

    const failedUsageLogs = usageLogs.filter(
      (log: UsageLogItem) => log.status !== "SUCCESS",
    );

    const totalCreditsCharged = usageLogs.reduce(
      (total: bigint, log: UsageLogItem) => total + log.creditsCharged,
      BigInt(0),
    );

    const pendingOrders = orders.filter(
      (order: OrderItem) => order.status === "PENDING",
    );
    const paidOrders = orders.filter(
      (order: OrderItem) => order.status === "PAID",
    );

    const totalPaidAmount = paidOrders.reduce(
      (total: number, order: OrderItem) => total + order.amountVnd,
      0,
    );

    return NextResponse.json({
      data: {
        credits: {
          total: totalCredits.toString(),
          remaining: remainingCredits.toString(),
          used: usedCredits.toString(),
          charged: totalCreditsCharged.toString(),
        },
        apiKeys: {
          total: apiKeys.length,
          active: activeApiKeys.length,
          revoked: revokedApiKeys.length,
        },
        usage: {
          totalRequests: usageLogs.length,
          successRequests: successfulUsageLogs.length,
          failedRequests: failedUsageLogs.length,
          successRate:
            usageLogs.length > 0
              ? Math.round((successfulUsageLogs.length / usageLogs.length) * 100)
              : 0,
        },
        orders: {
          total: orders.length,
          paid: paidOrders.length,
          pending: pendingOrders.length,
          totalPaidAmount,
        },
        plans: syncedPlans,
        recentUsageLogs: recentUsageLogs.map((log: RecentUsageLogItem) => ({
          id: log.id,
          apiFamily: log.apiFamily,
          model: log.model,
          endpoint: log.endpoint,
          totalTokens: log.totalTokens,
          creditsCharged: log.creditsCharged.toString(),
          status: log.status,
          createdAt: log.createdAt,
          apiKey: log.apiKey,
        })),
        recentOrders: orders.slice(0, 5).map((order: OrderItem) => ({
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          amountVnd: order.amountVnd,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
          product: order.product,
        })),
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
    console.error("GET /api/dashboard failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể tải dữ liệu tổng quan.",
        },
      },
      {
        status: 500,
      },
    );
  }
}
