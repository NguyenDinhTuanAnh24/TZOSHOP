// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

async function createNotificationOnce({
  userId,
  title,
  message,
  type,
  href,
  dedupeKey,
  metadata,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  href?: string;
  dedupeKey: string;
  metadata?: any;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      dedupeKey,
    },
  });

  if (existing) return null;

  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        href,
        dedupeKey,
        metadata,
      },
    });
  } catch (error) {
    // Nếu bị unique constraint do race condition thì bỏ qua
    return null;
  }
}

async function syncCreditNotifications(userId: string) {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Find active buckets
  const activeBuckets = await prisma.creditBucket.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: now },
    },
    include: {
      product: true,
    },
  });

  for (const bucket of activeBuckets) {
    const creditsRemaining = Number(bucket.creditsRemaining);
    const creditsTotal = Number(bucket.creditsTotal);
    const productName = bucket.product?.name || "Gói Credits";
    
    // 1. Check OUT_OF_CREDITS
    if (creditsRemaining <= 0) {
      await createNotificationOnce({
        userId,
        type: "OUT_OF_CREDITS",
        title: "Gói credits đã hết",
        message: `Gói ${productName} của bạn đã hết credits. Vui lòng mua thêm để tiếp tục sử dụng.`,
        href: "/plans",
        dedupeKey: `credit-alert:${bucket.id}:OUT_OF_CREDITS`,
        metadata: {
          bucketId: bucket.id,
          alertType: "OUT_OF_CREDITS"
        }
      });
    } 
    // 2. Check LOW_CREDITS (10%)
    else if (creditsRemaining <= creditsTotal * 0.1) {
      await createNotificationOnce({
        userId,
        type: "LOW_CREDITS",
        title: "Gói credits sắp hết",
        message: `Gói ${productName} của bạn chỉ còn ${new Intl.NumberFormat('vi-VN').format(creditsRemaining)}/${new Intl.NumberFormat('vi-VN').format(creditsTotal)} credits.`,
        href: "/my-plans",
        dedupeKey: `credit-alert:${bucket.id}:LOW_CREDITS`,
        metadata: {
          bucketId: bucket.id,
          alertType: "LOW_CREDITS"
        }
      });
    }
    
    // 3. Check EXPIRING_PLAN (3 days) - tách biệt, có thể cùng tồn tại với LOW_CREDITS
    if (bucket.expiresAt <= threeDaysFromNow && bucket.expiresAt > now) {
      await createNotificationOnce({
        userId,
        type: "EXPIRING_PLAN",
        title: "Gói credits sắp hết hạn",
        message: `Gói ${productName} của bạn sẽ hết hạn vào ${bucket.expiresAt.toLocaleDateString("vi-VN")}.`,
        href: "/my-plans",
        dedupeKey: `credit-alert:${bucket.id}:EXPIRING_PLAN`,
        metadata: {
          bucketId: bucket.id,
          alertType: "EXPIRING_PLAN"
        }
      });
    }
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
    }

    // Sync credit notifications before fetching
    if (user.role !== "ADMIN") {
      await syncCreditNotifications(user.id);
    }

    const isAdmin = user.role === "ADMIN";

    const where: any = {};
    if (isAdmin) {
      where.OR = [
        { userId: user.id },
        { roleTarget: "ADMIN" }
      ];
    } else {
      where.userId = user.id;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false
        }
      })
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });

  } catch (error) {
    console.error("GET /api/notifications failed:", error);
    return NextResponse.json({ success: false, message: "Lỗi hệ thống." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
    }

    const { action } = await request.json().catch(() => ({}));
    
    if (action === "read-all") {
      const isAdmin = user.role === "ADMIN";
      const where: any = {};
      
      if (isAdmin) {
        where.OR = [
          { userId: user.id },
          { roleTarget: "ADMIN" }
        ];
      } else {
        where.userId = user.id;
      }
      
      where.isRead = false;

      await prisma.notification.updateMany({
        where,
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: { message: "Hành động không hợp lệ." } }, { status: 400 });

  } catch (error) {
    console.error("PATCH /api/notifications failed:", error);
    return NextResponse.json({ success: false, message: "Lỗi hệ thống." }, { status: 500 });
  }
}
