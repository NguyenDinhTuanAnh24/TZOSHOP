import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdminUser();

    const { title, message, type } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "Tiêu đề và nội dung không được để trống." },
        { status: 400 }
      );
    }

    await prisma.notification.create({
      data: {
        userId: id,
        title,
        message,
        type: type || "INFO"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Đã gửi thông báo cho người dùng."
    });

  } catch (error) {
    console.error(`POST /api/admin/users/${id}/notify failed:`, error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống." },
      { status: 500 }
    );
  }
}
