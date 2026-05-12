import { prisma } from "@/lib/prisma";

export async function createNotificationOnce(data: {
  userId: string;
  type?: string;
  title: string;
  message: string;
  href?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    if (data.dedupeKey) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: data.userId,
          dedupeKey: data.dedupeKey,
        },
      });
      if (existing) return existing;
    }

    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type || "INFO",
        title: data.title,
        message: data.message,
        href: data.href,
        dedupeKey: data.dedupeKey,
        metadata: data.metadata as import("@prisma/client").Prisma.InputJsonValue,
      },
    });
  } catch {
    // If unique constraint error due to race condition, ignore and return null
    return null;
  }
}

export async function notifyAdmins(data: {
  type?: string;
  title: string;
  message: string;
  href?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    return await Promise.all(
      admins.map((admin) =>
        createNotificationOnce({
          ...data,
          userId: admin.id,
          dedupeKey: data.dedupeKey ? `${data.dedupeKey}:admin:${admin.id}` : undefined,
        })
      )
    );
  } catch (error) {
    console.error(`[Notification] Failed to notify admins:`, error);
  }
}

// Keep the old createNotification as an alias for createNotificationOnce for compatibility
export const createNotification = createNotificationOnce;
export const createAdminNotification = notifyAdmins;


export async function markNotificationAsRead(id: string, userId: string, isAdmin: boolean) {
  try {
    const where: Record<string, unknown> = { id };
    
    // Nếu không phải admin, chỉ được mark read notification của chính mình
    if (!isAdmin) {
      where.userId = userId;
    } else {
      // Nếu là admin, được mark read notification của mình HOẶC roleTarget là ADMIN
      where.OR = [
        { userId: userId },
        { roleTarget: "ADMIN" }
      ];
    }

    return await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[Notification] Failed to mark read ${id}:`, error);
  }
}

export async function markAllNotificationsAsRead(userId: string, isAdmin: boolean) {
  try {
    const where: Record<string, unknown> = {};
    
    if (isAdmin) {
      where.OR = [
        { userId: userId },
        { roleTarget: "ADMIN" }
      ];
    } else {
      where.userId = userId;
    }
    
    where.isRead = false;

    return await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[Notification] Failed to mark all read for user ${userId}:`, error);
  }
}

export async function checkCreditAlertsForUser(userId: string) {
  try {
    const now = new Date();
    // 1. Lấy tất cả bucket active của user
    const buckets = await prisma.creditBucket.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: { gt: now } },
          { expiresAt: null },
        ],
      },
      include: {
        product: { select: { name: true } },
      },
    });

    for (const bucket of buckets) {
      const remaining = Number(bucket.creditsRemaining);
      const total = Number(bucket.creditsTotal);
      const productName = bucket.product?.name || "AI Credits";

      // A. OUT_OF_CREDITS
      if (remaining <= 0) {
        await createNotification({
          userId,
          type: "ERROR",
          title: "Gói credits đã hết",
          message: `Gói ${productName} của bạn đã hết credits. Vui lòng mua thêm credits để tiếp tục sử dụng API.`,
          href: "/my-plans",
          dedupeKey: `credit-alert:${bucket.id}:OUT_OF_CREDITS`,
          metadata: {
            bucketId: bucket.id,
            alertType: "OUT_OF_CREDITS",
          },
        });
      }
      // B. LOW_CREDITS (chỉ báo khi còn > 0 và <= 10%)
      else if (total > 0 && remaining <= total * 0.1) {
        await createNotification({
          userId,
          type: "WARNING",
          title: "Gói credits sắp hết",
          message: `Gói ${productName} của bạn chỉ còn ${new Intl.NumberFormat('vi-VN').format(remaining)} credits (${Math.round((remaining / total) * 100)}%).`,
          href: "/my-plans",
          dedupeKey: `credit-alert:${bucket.id}:LOW_CREDITS`,
          metadata: {
            bucketId: bucket.id,
            alertType: "LOW_CREDITS",
          },
        });
      }
    }
  } catch (error) {
    console.error(`[Notification] Failed to check credit alerts for user ${userId}:`, error);
  }
}
