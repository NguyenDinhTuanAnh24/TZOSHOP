import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
    }

    const isAdmin = user.role === "ADMIN";
    const where: Prisma.NotificationWhereInput = { isRead: false };

    if (isAdmin) {
      where.OR = [
        { userId: user.id },
        { roleTarget: "ADMIN" }
      ];
    } else {
      where.userId = user.id;
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error("POST /api/notifications/mark-read failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống." },
      { status: 500 }
    );
  }
}
