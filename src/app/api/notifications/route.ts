import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server/current-user";
import { checkCreditAlertsForUser } from "@/lib/server/notifications";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
    }

    // Sync credit notifications before fetching
    if (user.role !== "ADMIN") {
      await checkCreditAlertsForUser(user.id);
    }

    const isAdmin = user.role === "ADMIN";

    const where: Prisma.NotificationWhereInput = {};
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
      const where: Prisma.NotificationWhereInput = {};
      
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
