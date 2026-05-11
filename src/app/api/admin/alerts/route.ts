import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 1. Auth check
    const user = await requireAdminUser();

    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const sixtyMinsAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 2. Fetch data
    const [activeBuckets, staleOrders, recentLogs] = await Promise.all([
      // Fetch active buckets with user and product info
      prisma.creditBucket.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: now },
        },
        include: {
          user: { select: { email: true, id: true } },
          product: { select: { name: true } },
        },
      }),
      // Fetch stale pending orders
      prisma.order.findMany({
        where: {
          status: "PENDING",
          createdAt: { lte: sixtyMinsAgo },
        },
        include: {
          user: { select: { email: true } },
        },
      }),
      // Fetch logs for failure analysis
      prisma.usageLog.findMany({
        where: {
          createdAt: { gte: fifteenMinsAgo },
        },
        select: {
          status: true,
          model: true,
        },
      }),
    ]);

    const alerts: any[] = [];

    // 3. Process Bucket Alerts (LOW_CREDITS, OUT_OF_CREDITS, EXPIRING_BUCKET)
    for (const bucket of activeBuckets) {
      const remaining = Number(bucket.creditsRemaining);
      const total = Number(bucket.creditsTotal);
      const email = bucket.user.email;
      const productName = bucket.product?.name || "Gói AI";
      const userId = bucket.user.id;

      // OUT_OF_CREDITS
      if (remaining <= 0) {
        alerts.push({
          id: `out-of-credits-${bucket.id}`,
          type: "OUT_OF_CREDITS",
          severity: "DANGER",
          title: "Hết credits",
          message: `${email} đã hết credits trong gói ${productName}.`,
          href: `/admin/users/${userId}`,
          createdAt: bucket.updatedAt.toISOString(),
        });
      } 
      // LOW_CREDITS
      else if (total > 0 && remaining <= total * 0.1) {
        alerts.push({
          id: `low-credits-${bucket.id}`,
          type: "LOW_CREDITS",
          severity: "WARNING",
          title: "Sắp hết credits",
          message: `${email} chỉ còn ${remaining}/${total} credits trong gói ${productName}.`,
          href: `/admin/users/${userId}`,
          createdAt: bucket.updatedAt.toISOString(),
        });
      }

      // EXPIRING_BUCKET
      if (bucket.expiresAt <= threeDaysFromNow) {
        alerts.push({
          id: `expiring-${bucket.id}`,
          type: "EXPIRING_BUCKET",
          severity: "WARNING",
          title: "Sắp hết hạn",
          message: `Gói ${productName} của ${email} sẽ hết hạn vào ${bucket.expiresAt.toLocaleString("vi-VN")}.`,
          href: `/admin/users/${userId}`,
          createdAt: bucket.updatedAt.toISOString(),
        });
      }
    }

    // 4. Process Stale Orders
    for (const order of staleOrders) {
      alerts.push({
        id: `stale-order-${order.id}`,
        type: "STALE_PENDING_ORDER",
        severity: "WARNING",
        title: "Đơn hàng tồn đọng",
        message: `Đơn ${order.orderCode} của ${order.user.email} đã pending quá 60 phút.`,
        href: "/admin/orders?status=PENDING",
        createdAt: order.createdAt.toISOString(),
      });
    }

    // 5. Process Usage Logs (HIGH_FAILED_REQUESTS, MODEL_FAILED_SPIKE)
    if (recentLogs.length >= 10) {
      const failedCount = recentLogs.filter(log => log.status !== "SUCCESS").length;
      const totalCount = recentLogs.length;
      const failureRate = failedCount / totalCount;

      if (failureRate >= 0.3) {
        alerts.push({
          id: "high-failure-rate",
          type: "HIGH_FAILED_REQUESTS",
          severity: "DANGER",
          title: "Tỷ lệ lỗi cao",
          message: `Tỷ lệ request lỗi 15 phút gần nhất đang cao: ${failedCount}/${totalCount} (${(failureRate * 100).toFixed(1)}%).`,
          href: "/admin/usage?status=FAILED",
          createdAt: now.toISOString(),
        });
      }
    }

    // MODEL_FAILED_SPIKE
    const modelFailures: Record<string, number> = {};
    recentLogs.forEach(log => {
      if (log.status !== "SUCCESS") {
        modelFailures[log.model] = (modelFailures[log.model] || 0) + 1;
      }
    });

    for (const [model, count] of Object.entries(modelFailures)) {
      if (count >= 5) {
        alerts.push({
          id: `model-spike-${model}`,
          type: "MODEL_FAILED_SPIKE",
          severity: "WARNING",
          title: "Model lỗi bất thường",
          message: `Model ${model} có ${count} request lỗi trong 15 phút gần nhất.`,
          href: `/admin/usage?model=${model}&status=FAILED`,
          createdAt: now.toISOString(),
        });
      }
    }

    // Sort: DANGER first, then WARNING
    const sortedAlerts = alerts.sort((a, b) => {
      if (a.severity === "DANGER" && b.severity === "WARNING") return -1;
      if (a.severity === "WARNING" && b.severity === "DANGER") return 1;
      return 0;
    }).slice(0, 50);

    // Summary
    const summary = {
      total: sortedAlerts.length,
      danger: sortedAlerts.filter(a => a.severity === "DANGER").length,
      warning: sortedAlerts.filter(a => a.severity === "WARNING").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      alerts: sortedAlerts,
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
    console.error("GET /api/admin/alerts failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi quét cảnh báo." },
      { status: 500 }
    );
  }
}
