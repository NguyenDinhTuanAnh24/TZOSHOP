import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { toCsv, csvResponse, CsvHeader } from "@/lib/csv";
import { format } from "date-fns";

export const runtime = "nodejs";

type UserRow = {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  apiKeysCount: number;
  activeApiKeysCount: number;
  activeBucketsCount: number;
  creditsRemaining: string;
  creditsUsed: string;
  ordersCount: number;
  totalRevenueVnd: string;
};

interface UserWithRelations {
  id: string;
  name: string | null;
  email: string;
  role: string;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  apiKeys: { id: string; isActive: boolean }[];
  creditBuckets: { id: string; isActive: boolean; expiresAt: Date | null; creditsRemaining: bigint; creditsTotal: bigint }[];
  orders: { id: string; amountVnd: number; status: string }[];
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");

    const where: Prisma.UserWhereInput = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (roleFilter && roleFilter !== "ALL") {
      where.role = roleFilter as import("@prisma/client").UserRole; // Cast as UserRole because role is an enum and we need to match searching string
    }

    if (statusFilter === "LOCKED") {
      where.lockedAt = { not: null };
    } else if (statusFilter === "ACTIVE") {
      where.lockedAt = null;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        apiKeys: true,
        creditBuckets: true,
        orders: {
          where: { status: "PAID" },
        },
      },
    }) as unknown as UserWithRelations[];

    const headers: CsvHeader<UserRow>[] = [
      { key: "userId", label: "User ID" },
      { key: "name", label: "Tên" },
      { key: "email", label: "Email" },
      { key: "role", label: "Vai trò" },
      { key: "status", label: "Trạng thái" },
      { key: "createdAt", label: "Ngày tạo" },
      { key: "updatedAt", label: "Ngày cập nhật" },
      { key: "apiKeysCount", label: "Tổng API Keys" },
      { key: "activeApiKeysCount", label: "API Keys hoạt động" },
      { key: "activeBucketsCount", label: "Gói hoạt động" },
      { key: "creditsRemaining", label: "Credits hiện tại" },
      { key: "creditsUsed", label: "Credits đã dùng" },
      { key: "ordersCount", label: "Tổng đơn hàng PAID" },
      { key: "totalRevenueVnd", label: "Tổng doanh thu VND" },
    ];

    const rows: UserRow[] = users.map((user) => {
      const activeApiKeys = user.apiKeys.filter((k) => k.isActive).length;
      
      const now = new Date();
      const activeBuckets = user.creditBuckets.filter(
        (b) => b.isActive && (b.expiresAt === null || new Date(b.expiresAt) > now)
      ).length;

      const creditsRemaining = user.creditBuckets.reduce(
        (sum, b) => sum + Number(b.creditsRemaining),
        0
      );

      const creditsUsed = user.creditBuckets.reduce(
        (sum, b) => sum + (Number(b.creditsTotal) - Number(b.creditsRemaining)),
        0
      );

      const totalRevenueVnd = user.orders.reduce(
        (sum, o) => sum + Number(o.amountVnd),
        0
      );

      return {
        userId: user.id,
        name: user.name || "",
        email: user.email,
        role: user.role,
        status: user.lockedAt ? "LOCKED" : "ACTIVE",
        createdAt: format(new Date(user.createdAt), "yyyy-MM-dd HH:mm:ss"),
        updatedAt: format(new Date(user.updatedAt), "yyyy-MM-dd HH:mm:ss"),
        apiKeysCount: user.apiKeys.length,
        activeApiKeysCount: activeApiKeys,
        activeBucketsCount: activeBuckets,
        creditsRemaining: creditsRemaining.toString(),
        creditsUsed: creditsUsed.toString(),
        ordersCount: user.orders.length,
        totalRevenueVnd: totalRevenueVnd.toString(),
      };
    });

    const csvContent = toCsv(headers, rows);
    const dateStr = format(new Date(), "yyyy-MM-dd");

    return csvResponse(csvContent, `tzoshop-users-${dateStr}.csv`);
  } catch (error) {
    console.error("GET /api/admin/users/export error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Lỗi hệ thống khi xuất CSV." } },
      { status: 500 }
    );
  }
}
