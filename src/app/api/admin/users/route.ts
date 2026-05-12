import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdminUser();

    const users = await prisma.user.findMany({
      where: {
        role: "USER"
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          }
        },
        creditBuckets: {
          select: {
            creditsTotal: true,
          }
        }
      }
    });

    const data = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      _count: u._count,
      totalCredits: u.creditBuckets.reduce((sum, b) => sum + b.creditsTotal, BigInt(0)).toString()
    }));

    return NextResponse.json({
      success: true,
      data: data
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
    console.error("GET /api/admin/users failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải danh sách người dùng." },
      { status: 500 }
    );
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminUser();

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: { message: "Thiếu thông tin cập nhật." } },
        { status: 400 }
      );
    }

    // Không cho admin tự hạ role của chính mình
    if (userId === admin.id && role !== "ADMIN") {
      return NextResponse.json(
        { error: { message: "Bạn không thể tự hạ quyền của chính mình." } },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "UPDATE",
      entityType: "USER_ROLE",
      entityId: updatedUser.id,
      metadata: { role }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error("PATCH /api/admin/users failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi cập nhật người dùng." },
      { status: 500 }
    );
  }
}
