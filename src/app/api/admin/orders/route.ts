import { Prisma, OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { buildPagination, getPagination } from "@/lib/pagination";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const searchParams = request.nextUrl.searchParams;
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const status = searchParams.get("status");
    const email = searchParams.get("email") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: Prisma.OrderWhereInput = {};
    if (status && status !== "ALL") where.status = status as OrderStatus;
    if (email) {
      where.user = {
        email: { contains: email, mode: "insensitive" },
      };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              name: true,
              apiFamily: true,
            },
          },
        },
      }),
    ]);

    const orderIds = orders.map((o) => o.id);
    const ledgers = await prisma.creditLedger.findMany({
      where: {
        referenceId: { in: orderIds },
        type: "PURCHASE",
      },
      select: {
        referenceId: true,
        creditBucketId: true,
      },
    });

    const ledgerMap = new Map(ledgers.map((l) => [l.referenceId, l]));

    const ordersWithGrantStatus = orders.map((order) => ({
      ...order,
      payosOrderCode: order.payosOrderCode?.toString(),
      isCreditsGranted: ledgerMap.has(order.id),
      creditBucketId: ledgerMap.get(order.id)?.creditBucketId,
    }));

    return NextResponse.json({
      success: true,
      data: ordersWithGrantStatus,
      items: ordersWithGrantStatus,
      pagination: buildPagination({ page, pageSize, total }),
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
    console.error("GET /api/admin/orders failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải danh sách đơn hàng." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminUser();

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: { message: "Thiếu thông tin cập nhật." } },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "UPDATE",
      entityType: "ORDER",
      entityId: updatedOrder.id,
      metadata: { status },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
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
    console.error("PATCH /api/admin/orders failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi cập nhật đơn hàng." },
      { status: 500 }
    );
  }
}

