import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: { message: "Thiếu ID." } }, { status: 400 });
    }

    const isAdmin = user.role === "ADMIN";
    const where: Prisma.NotificationWhereInput = { id };

    if (!isAdmin) {
      where.userId = user.id;
    } else {
      where.OR = [
        { userId: user.id },
        { roleTarget: "ADMIN" }
      ];
    }

    const updated = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: { message: "Không tìm thấy thông báo hoặc không có quyền." } }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("PATCH /api/notifications/[id]/read failed:", error);
    return NextResponse.json({ success: false, message: "Lỗi hệ thống." }, { status: 500 });
  }
}
