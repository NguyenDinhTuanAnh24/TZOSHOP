import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAdminUser();

    const [
      userCount,
      paidOrdersData,
      pendingOrders,
      activeApiKeysCount,
      openTicketsCount,
      activeModelsCount,
      activeProvidersCount,
      creditBucketsData
    ] = await Promise.all([
      prisma.user.count({
        where: { role: "USER" }
      }),
      prisma.order.findMany({
        where: { status: "PAID" },
        include: { product: true }
      }),
      prisma.order.count({
        where: { status: "PENDING" }
      }),
      prisma.apiKey.count({
        where: { 
          isActive: true,
          revokedAt: null
        }
      }),
      prisma.supportTicket.count({
        where: { status: { not: "CLOSED" } }
      }),
      prisma.aiModel.count({
        where: { isActive: true }
      }),
      (prisma as any).aiProvider.count({
        where: { isActive: true }
      }),
      prisma.creditBucket.findMany({
        select: { creditsTotal: true }
      })
    ]);

    // 1. Doanh thu (Chỉ tính các order PAID và priceVnd > 0)
    const revenueVnd = paidOrdersData.reduce((sum: number, order: { amountVnd: number }) => sum + order.amountVnd, 0);

    // 3. Credits đã bán (Tổng credits của các gói PAID)
    const creditsSold = paidOrdersData.reduce((sum: bigint, order: any) => {
      const credits = order.product?.credits ? BigInt(order.product.credits) : BigInt(0);
      return sum + credits;
    }, BigInt(0));

    // Credits đã cấp (Tổng creditsTotal của tất cả CreditBucket)
    const creditsGranted = creditBucketsData.reduce((sum: bigint, bucket: { creditsTotal: bigint }) => {
      return sum + BigInt(bucket.creditsTotal);
    }, BigInt(0));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: userCount,
        revenueVnd: revenueVnd,
        pendingOrders: pendingOrders,
        openTickets: openTicketsCount,
        creditsSold: creditsSold.toString(),
        creditsGranted: creditsGranted.toString(),
        activeApiKeys: activeApiKeysCount,
        activeModels: activeModelsCount,
        activeProviders: activeProvidersCount,
      }
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
    console.error("GET /api/admin/stats failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải thống kê." },
      { status: 500 }
    );
  }
}

