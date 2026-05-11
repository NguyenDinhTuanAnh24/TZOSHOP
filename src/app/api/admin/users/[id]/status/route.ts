import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

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
        { success: false, message: "Không thể tự khóa tài khoản của chính mình." },
        { status: 400 }
      );
    }

    const { action } = await request.json();

    if (!action || !["LOCK", "UNLOCK"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Hành động không hợp lệ." },
        { status: 400 }
      );
    }

    const lockedAt = action === "LOCK" ? new Date() : null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { lockedAt }
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: action === "LOCK" ? "ADMIN_LOCK_USER" : "ADMIN_UNLOCK_USER",
      entityType: "USER",
      entityId: id,
      metadata: { email: updatedUser.email }
    });

    return NextResponse.json({
      success: true,
      message: action === "LOCK" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản."
    });

  } catch (error) {
    console.error(`PATCH /api/admin/users/${id}/status failed:`, error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống." },
      { status: 500 }
    );
  }
}
