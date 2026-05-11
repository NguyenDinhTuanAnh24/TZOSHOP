import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { startOfDay, endOfDay, startOfMonth, subDays, format } from "date-fns";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdminUser();

    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = subDays(todayStart, 29);

    const [
      allPaidOrders,
      pendingOrdersCount,
      revenueByDayRaw,
      allCreditBuckets
    ] = await Promise.all([
      prisma.order.findMany({
        where: { status: "PAID" },
        include: { 
          product: { select: { name: true, apiFamily: true, credits: true } },
          user: { select: { email: true } }
        },
        orderBy: { paidAt: "desc" }
      }),
      prisma.order.count({
        where: { status: "PENDING" }
      }),
      prisma.order.findMany({
        where: { 
          status: "PAID",
          paidAt: { gte: thirtyDaysAgo }
        },
        select: {
          amountVnd: true,
          paidAt: true
        }
      }),
      prisma.creditBucket.findMany({
        select: { creditsTotal: true }
      })
    ]);

    // 1. Calculations
    const totalRevenueVnd = allPaidOrders.reduce((sum, o) => sum + o.amountVnd, 0);
    const todayRevenueVnd = allPaidOrders
      .filter(o => o.paidAt && o.paidAt >= todayStart)
      .reduce((sum, o) => sum + o.amountVnd, 0);
    const monthRevenueVnd = allPaidOrders
      .filter(o => o.paidAt && o.paidAt >= monthStart)
      .reduce((sum, o) => sum + o.amountVnd, 0);

    const paidOrdersCount = allPaidOrders.length;
    const averageOrderValueVnd = paidOrdersCount > 0 ? totalRevenueVnd / paidOrdersCount : 0;

    const creditsSold = allPaidOrders.reduce((sum, o) => sum + BigInt(o.product?.credits || 0), BigInt(0));
    const creditsGranted = allCreditBuckets.reduce((sum, b) => sum + BigInt(b.creditsTotal || 0), BigInt(0));

    // 2. Revenue By Day (Last 30 days)
    const dailyMap = new Map();
    for (let i = 0; i < 30; i++) {
      const d = subDays(todayStart, i);
      const dateStr = format(d, "yyyy-MM-dd");
      dailyMap.set(dateStr, { date: dateStr, revenueVnd: 0, paidOrders: 0 });
    }

    revenueByDayRaw.forEach(o => {
      if (!o.paidAt) return;
      const dateStr = format(o.paidAt, "yyyy-MM-dd");
      if (dailyMap.has(dateStr)) {
        const val = dailyMap.get(dateStr);
        val.revenueVnd += o.amountVnd;
        val.paidOrders += 1;
      }
    });

    const revenueByDay = Array.from(dailyMap.values()).reverse();

    // 3. Revenue By Family
    const familyMap: any = {};
    // Ensure all 4 families exist even with 0 revenue
    ["CODEXAI", "CLAUDE", "GEMINI", "DEEPSEEK"].forEach(f => {
      familyMap[f] = { apiFamily: f, revenueVnd: 0, paidOrders: 0, creditsSold: BigInt(0) };
    });

    allPaidOrders.forEach(o => {
      const family = o.product?.apiFamily || "UNKNOWN";
      if (!familyMap[family]) {
        familyMap[family] = { apiFamily: family, revenueVnd: 0, paidOrders: 0, creditsSold: BigInt(0) };
      }
      familyMap[family].revenueVnd += o.amountVnd;
      familyMap[family].paidOrders += 1;
      familyMap[family].creditsSold += BigInt(o.product?.credits || 0);
    });

    const revenueByFamily = Object.values(familyMap).map((f: any) => ({
      ...f,
      creditsSold: f.creditsSold.toString()
    }));

    // 4. Top Products
    const productMap: any = {};
    allPaidOrders.forEach(o => {
      const pId = o.productId;
      if (!productMap[pId]) {
        productMap[pId] = { 
          productId: pId, 
          productName: o.product?.name || "Unknown", 
          apiFamily: o.product?.apiFamily || "Unknown",
          paidOrders: 0, 
          revenueVnd: 0, 
          creditsSold: BigInt(0) 
        };
      }
      productMap[pId].paidOrders += 1;
      productMap[pId].revenueVnd += o.amountVnd;
      productMap[pId].creditsSold += BigInt(o.product?.credits || 0);
    });

    const topProducts = Object.values(productMap)
      .sort((a: any, b: any) => b.revenueVnd - a.revenueVnd)
      .slice(0, 10)
      .map((p: any) => ({
        ...p,
        creditsSold: p.creditsSold.toString()
      }));

    // 5. Recent Paid Orders
    const recentPaidOrders = allPaidOrders.slice(0, 20).map(o => ({
      id: o.id,
      orderCode: o.orderCode,
      userEmail: o.user.email,
      productName: o.product?.name || "Unknown",
      apiFamily: o.product?.apiFamily || "Unknown",
      amountVnd: o.amountVnd,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      paidAt: o.paidAt ? o.paidAt.toISOString() : null
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenueVnd,
        todayRevenueVnd,
        monthRevenueVnd,
        paidOrders: paidOrdersCount,
        pendingOrders: pendingOrdersCount,
        creditsSold: creditsSold.toString(),
        creditsGranted: creditsGranted.toString(),
        averageOrderValueVnd
      },
      revenueByDay,
      revenueByFamily,
      topProducts,
      recentPaidOrders
    });

  } catch (error) {
    console.error("GET /api/admin/revenue failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải báo cáo doanh thu." },
      { status: 500 }
    );
  }
}
