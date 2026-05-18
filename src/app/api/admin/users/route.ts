import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { buildPagination, getPagination } from "@/lib/pagination";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);

    const search = searchParams.get("search")?.trim() || "";
    const role = (searchParams.get("role") || "all").toUpperCase();
    const status = (searchParams.get("status") || "all").toUpperCase();

    const where: Record<string, unknown> = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { id: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role !== "ALL" ? { role } : {}),
      ...(status === "ACTIVE" ? { lockedAt: null } : {}),
      ...(status === "LOCKED" ? { NOT: { lockedAt: null } } : {}),
    };

    const [total, users, totalUsers, adminUsers, activeUsers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          lockedAt: true,
          creditBuckets: {
            select: {
              creditsTotal: true,
            },
          },
          _count: {
            select: {
              orders: true,
              apiKeys: true,
              creditBuckets: true,
            },
          },
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { lockedAt: null } }),
    ]);

    const mappedUsers = users.map((u) => ({
      ...u,
      totalCredits: u.creditBuckets.reduce((sum, b) => sum + b.creditsTotal, BigInt(0)).toString(),
      creditBuckets: undefined,
    }));

    return NextResponse.json({
      items: mappedUsers,
      users: mappedUsers,
      pagination: buildPagination({ page, pageSize, total }),
      summary: {
        totalUsers,
        newUsers: 0,
        adminUsers,
        activeUsers,
      },
      success: true,
      data: mappedUsers,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Bạn không có quyền truy cập" }, { status: 403 });
      }
    }

    console.error("[ADMIN_USERS_ERROR]", error);

    return NextResponse.json(
      {
        error: "Không thể tải danh sách người dùng",
        detail: error instanceof Error ? error.message : String(error),
      },
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
      metadata: { role },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /api/admin/users failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi cập nhật người dùng." },
      { status: 500 }
    );
  }
}
