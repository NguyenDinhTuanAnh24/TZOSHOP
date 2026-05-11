import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { UserRole } from "@prisma/client";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await requireAdminUser();

    if (admin.id === id) {
      return NextResponse.json(
        { success: false, message: "Không thể tự thay đổi quyền của chính mình." },
        { status: 400 }
      );
    }

    const { role } = await request.json();

    if (!role || !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Quyền không hợp lệ." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as UserRole }
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "ADMIN_CHANGE_USER_ROLE",
      entityType: "USER",
      entityId: id,
      metadata: { newRole: role, email: updatedUser.email }
    });

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật quyền người dùng."
    });

  } catch (error) {
    console.error(`PATCH /api/admin/users/${id}/role failed:`, error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống." },
      { status: 500 }
    );
  }
}
