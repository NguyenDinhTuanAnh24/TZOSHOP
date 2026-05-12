import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { 
  csvResponse, 
  buildCsvReport, 
  sectionTitle, 
  blankLine, 
  keyValueLine, 
  table 
} from "@/lib/csv";
import { format } from "date-fns";

export const runtime = "nodejs";

interface OrderWithRelations {
  id: string;
  orderCode: string;
  amountVnd: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  user: { email: string; name: string | null };
  product: { name: string; credits: bigint; apiFamily: string } | null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser();

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");
    const statusFilter = searchParams.get("status");
    const familyFilter = searchParams.get("family");
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const where: Prisma.OrderWhereInput = {};

    if (q) {
      where.OR = [
        { orderCode: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter as import("@prisma/client").OrderStatus;
    }

    if (fromStr && toStr) {
      const from = new Date(fromStr);
      from.setHours(0, 0, 0, 0);
      const to = new Date(toStr);
      to.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: from,
        lte: to,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        product: { select: { name: true, credits: true, apiFamily: true } },
      },
    }) as unknown as OrderWithRelations[];

    let filteredOrders = orders;
    if (familyFilter && familyFilter !== "ALL") {
       filteredOrders = orders.filter((o) => o.product?.apiFamily === familyFilter);
    }

    const now = new Date();
    
    // Tính toán thống kê
    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let creditsSold = BigInt(0);
    
    const familyStats: Record<string, { count: number, revenue: number, credits: bigint }> = {};

    filteredOrders.forEach((o) => {
      if (o.status === "PAID") {
        totalRevenue += o.amountVnd;
        paidCount++;
        const pCredits = BigInt(o.product?.credits || 0);
        creditsSold += pCredits;

        if (o.paidAt) {
          const pDate = new Date(o.paidAt);
          if (pDate.toDateString() === now.toDateString()) {
            todayRevenue += o.amountVnd;
          }
          if (pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()) {
            monthRevenue += o.amountVnd;
          }
        }

        const fam = o.product?.apiFamily || "Khác";
        if (!familyStats[fam]) familyStats[fam] = { count: 0, revenue: 0, credits: BigInt(0) };
        familyStats[fam].count++;
        familyStats[fam].revenue += o.amountVnd;
        familyStats[fam].credits += pCredits;
      } else if (o.status === "PENDING") {
        pendingCount++;
      }
    });

    const formatVnd = (val: number) => new Intl.NumberFormat("vi-VN").format(val) + " đ";
    const formatNum = (val: bigint | number) => new Intl.NumberFormat("vi-VN").format(val);

    const lines: string[] = [];
    lines.push(sectionTitle("BÁO CÁO DOANH THU TZOSHOP"));
    lines.push(blankLine());
    lines.push(keyValueLine("Ngày xuất", format(now, "dd/MM/yyyy HH:mm")));
    lines.push(keyValueLine("Người xuất", admin.email || "Unknown"));
    const periodStr = (fromStr && toStr) ? `Từ ${format(new Date(fromStr), "dd/MM/yyyy")} đến ${format(new Date(toStr), "dd/MM/yyyy")}` : "Toàn bộ thời gian";
    lines.push(keyValueLine("Khoảng thời gian", periodStr));
    lines.push(blankLine());

    lines.push(sectionTitle("TỔNG QUAN DOANH THU"));
    lines.push(keyValueLine("Tổng doanh thu", formatVnd(totalRevenue)));
    lines.push(keyValueLine("Doanh thu hôm nay", formatVnd(todayRevenue)));
    lines.push(keyValueLine("Doanh thu tháng này", formatVnd(monthRevenue)));
    lines.push(keyValueLine("Đơn đã thanh toán", formatNum(paidCount)));
    lines.push(keyValueLine("Đơn chờ thanh toán", formatNum(pendingCount)));
    lines.push(keyValueLine("Credits đã bán", formatNum(creditsSold)));
    lines.push(blankLine());

    lines.push(sectionTitle("DOANH THU THEO DÒNG AI"));
    const familyRows = Object.entries(familyStats).map(([fam, stats]) => ({
      family: fam,
      count: formatNum(stats.count),
      revenue: formatVnd(stats.revenue),
      credits: formatNum(stats.credits),
    }));
    
    lines.push(...table([
      { key: "family", label: "Dòng AI" },
      { key: "count", label: "Số đơn" },
      { key: "revenue", label: "Doanh thu" },
      { key: "credits", label: "Credits đã bán" },
    ], familyRows));
    
    lines.push(blankLine());

    lines.push(sectionTitle("CHI TIẾT ĐƠN HÀNG"));
    const orderRows = filteredOrders.map((o, idx: number) => ({
      stt: (idx + 1).toString(),
      orderCode: o.orderCode || "",
      userEmail: o.user?.email || "",
      productName: o.product?.name || "",
      apiFamily: o.product?.apiFamily || "N/A",
      amountVnd: formatVnd(o.amountVnd),
      status: o.status,
      paidAt: o.paidAt ? format(new Date(o.paidAt), "dd/MM/yyyy") : "",
    }));

    lines.push(...table([
      { key: "stt", label: "STT" },
      { key: "orderCode", label: "Mã đơn" },
      { key: "userEmail", label: "Email khách hàng" },
      { key: "productName", label: "Gói" },
      { key: "apiFamily", label: "Dòng AI" },
      { key: "amountVnd", label: "Số tiền" },
      { key: "status", label: "Trạng thái" },
      { key: "paidAt", label: "Ngày thanh toán" },
    ], orderRows));

    const reportContent = buildCsvReport(lines);
    const dateStr = format(now, "yyyy-MM-dd");

    return csvResponse(reportContent, `tzoshop-revenue-${dateStr}.csv`);
  } catch (error) {
    console.error("GET /api/admin/revenue/export error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Lỗi hệ thống khi xuất CSV." } },
      { status: 500 }
    );
  }
}
