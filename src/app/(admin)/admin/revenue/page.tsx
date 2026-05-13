"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ChartNoAxesColumnIncreasing,
  CreditCard,
  DollarSign,
  Download,
  Package,
  RefreshCw,
  ShoppingCart,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv } from "@/lib/download-csv";
import { translateStatus } from "@/lib/format";

type RevenueData = {
  summary: {
    totalRevenueVnd: number;
    todayRevenueVnd: number;
    monthRevenueVnd: number;
    paidOrders: number;
    pendingOrders: number;
    creditsSold: string;
    creditsGranted: string;
    averageOrderValueVnd: number;
  };
  revenueByDay: {
    date: string;
    revenueVnd: number;
    paidOrders: number;
  }[];
  revenueByFamily: {
    apiFamily: string;
    revenueVnd: number;
    paidOrders: number;
    creditsSold: string;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    apiFamily: string;
    paidOrders: number;
    revenueVnd: number;
    creditsSold: string;
  }[];
  recentPaidOrders: {
    id: string;
    orderCode: string;
    userEmail: string;
    productName: string;
    apiFamily: string;
    amountVnd: number;
    status: string;
    createdAt: string;
    paidAt: string | null;
  }[];
};

function RevenueSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="h-8 w-72 bg-[#E9E1D0] animate-pulse" />
        <div className="mt-3 h-4 w-full max-w-[520px] bg-[#E9E1D0] animate-pulse" />
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-h-[160px] border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-12 w-12 border-4 border-black bg-[#E9E1D0] animate-pulse" />
            <div className="mt-6 h-3 w-28 bg-[#E9E1D0] animate-pulse" />
            <div className="mt-3 h-8 w-36 bg-[#E9E1D0] animate-pulse" />
            <div className="mt-3 h-3 w-32 bg-[#E9E1D0] animate-pulse" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-h-[110px] border-4 border-black bg-[#FFFDF5] p-4 shadow-[5px_5px_0px_0px_#000]">
            <div className="h-full w-full bg-[#E9E1D0] animate-pulse" />
          </div>
        ))}
      </section>

      <section className="min-h-[360px] border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000]">
        <div className="h-7 w-72 bg-[#E9E1D0] animate-pulse" />
        <div className="mt-3 h-[260px] border-2 border-black bg-[#E9E1D0] animate-pulse" />
      </section>
    </div>
  );
}

function statusBg(status: string) {
  if (status === "PAID") return "bg-[#C7F0D8]";
  if (status === "PENDING") return "bg-[#FFD93D]";
  return "bg-[#FF6B6B]";
}

function familyBg(name: string) {
  if (name === "CODEXAI") return "bg-[#C7F0D8]";
  if (name === "CLAUDE") return "bg-[#FFD93D]";
  if (name === "GEMINI") return "bg-[#A78BFA]";
  if (name === "DEEPSEEK") return "bg-[#FF6B6B]";
  return "bg-[#93C5FD]";
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast, showToast, clearToast } = useToast(3000);

  const fetchRevenueData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/revenue");
      const result = await res.json();
      if (result.success) setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRevenueData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRevenueData]);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await downloadCsv("/api/admin/revenue/export", `tzoshop-revenue-${format(new Date(), "yyyy-MM-dd")}.csv`);
      showToast("Đã xuất CSV thành công.", "success");
    } catch {
      showToast("Không thể xuất CSV.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const formatVnd = (val: number) =>
    `${new Intl.NumberFormat("vi-VN").format(val)} đ`;
  const formatNum = (val: string | number) => new Intl.NumberFormat("vi-VN").format(Number(val));

  const maxDailyRevenue = useMemo(() => Math.max(...(data?.revenueByDay.map((d) => d.revenueVnd) || [0]), 1), [data]);
  const isRevenueEmpty = useMemo(() => (data?.revenueByDay || []).every((d) => d.revenueVnd === 0), [data]);

  if (isLoading && !data) return <RevenueSkeleton />;
  if (!data) return null;

  const mainStats = [
    {
      label: "TỔNG DOANH THU",
      value: formatVnd(data.summary.totalRevenueVnd),
      desc: "Toàn bộ thời gian",
      icon: Wallet,
      iconBg: "bg-[#FFD93D]",
    },
    {
      label: "DOANH THU HÔM NAY",
      value: formatVnd(data.summary.todayRevenueVnd),
      desc: format(new Date(), "dd/MM").replace(/^/, "Ngày "),
      icon: DollarSign,
      iconBg: "bg-[#C7F0D8]",
    },
    {
      label: "DOANH THU THÁNG NÀY",
      value: formatVnd(data.summary.monthRevenueVnd),
      desc: format(new Date(), "MM/yyyy").replace(/^/, "Tháng "),
      icon: TrendingUp,
      iconBg: "bg-[#93C5FD]",
    },
    {
      label: "GIÁ TRỊ ĐƠN TB",
      value: formatVnd(data.summary.averageOrderValueVnd),
      desc: "Trung bình mỗi đơn đã thanh toán",
      icon: Target,
      iconBg: "bg-[#A78BFA]",
    },
  ];

  const miniStats = [
    {
      label: "ĐƠN ĐÃ THANH TOÁN",
      value: `${formatNum(data.summary.paidOrders)} đơn`,
      sub: "Đơn hàng đã thanh toán",
      icon: ShoppingCart,
      iconBg: "bg-[#C7F0D8]",
    },
    {
      label: "ĐƠN CHỜ THANH TOÁN",
      value: `${formatNum(data.summary.pendingOrders)} đơn`,
      sub: "Đơn hàng đang chờ",
      icon: Calendar,
      iconBg: "bg-[#FFD93D]",
    },
    {
      label: "CREDITS ĐÃ BÁN",
      value: `${formatNum(data.summary.creditsSold)} bán`,
      sub: "Credits từ đơn đã thanh toán",
      icon: Zap,
      iconBg: "bg-[#C7F0D8]",
    },
    {
      label: "CREDITS ĐÃ CẤP",
      value: `${formatNum(data.summary.creditsGranted)} tổng`,
      sub: "Credits đã cấp cho người dùng",
      icon: TrendingUp,
      iconBg: "bg-[#DBEAFE]",
    },
  ];

  return (
    <div className="space-y-8 overflow-x-hidden pb-12">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <BarChart3 className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">REVENUE</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">THỐNG KÊ DOANH THU</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Theo dõi doanh thu, đơn thanh toán và hiệu quả kinh doanh.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end lg:w-auto">
            <div className="inline-flex h-11 items-center justify-center gap-2 border-4 border-black bg-[#C7F0D8] px-4 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[4px_4px_0px_0px_#000]">
              <ChartNoAxesColumnIncreasing className="h-4 w-4" />
              LIVE SYSTEM
            </div>
            <AppButton
              variant="accent"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="h-11 border-4 border-black bg-[#FFD93D] px-5 text-xs font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {isExporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {isExporting ? "ĐANG XUẤT..." : "XUẤT CSV"}
            </AppButton>
            <button
              onClick={fetchRevenueData}
              className="inline-flex h-11 w-11 items-center justify-center border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFD93D]"
              title="Làm mới"
              aria-label="Làm mới"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {mainStats.map((card) => (
          <article key={card.label} className="relative flex min-h-[160px] flex-col justify-between overflow-hidden border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className={`flex h-12 w-12 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${card.iconBg}`}>
              <card.icon className="h-6 w-6 text-black" />
            </div>
            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-black/70">{card.label}</p>
              <p className="mt-3 text-3xl font-black leading-none text-black md:text-4xl">{card.value}</p>
              <p className="mt-3 break-words text-sm font-bold leading-snug text-black/70">{card.desc}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {miniStats.map((card) => (
          <article key={card.label} className="flex min-h-[110px] items-center gap-4 border-4 border-black bg-[#FFFDF5] p-4 shadow-[5px_5px_0px_0px_#000]">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${card.iconBg}`}>
              <card.icon className="h-5 w-5 text-black" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-black/70">{card.label}</p>
              <p className="mt-3 text-3xl font-black leading-none text-black">{card.value}</p>
              <p className="mt-3 break-words text-sm font-bold leading-snug text-black/70">{card.sub}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] md:p-6">
        <header className="mb-5">
          <h3 className="text-2xl font-black text-black">Doanh thu 30 ngày gần nhất</h3>
          <p className="text-sm font-bold text-black/70">
            Dữ liệu từ {data.revenueByDay[0]?.date ?? "-"} đến {data.revenueByDay[data.revenueByDay.length - 1]?.date ?? "-"}
          </p>
        </header>

        <div className="relative min-h-[300px]">
          <div className="flex h-[260px] items-end gap-1.5 border-2 border-black bg-[#FFFDF5] p-3 sm:gap-2">
            {data.revenueByDay.map((day, idx) => (
              <div key={idx} className="group relative flex flex-1 flex-col items-center">
                <div
                  className="w-full bg-[#C7F0D8] transition-all duration-200 hover:bg-[#93C5FD]"
                  style={{ height: `${Math.max((day.revenueVnd / maxDailyRevenue) * 100, 1)}%` }}
                >
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 group-hover:block">
                    <div className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black shadow-[3px_3px_0px_0px_#000]">
                      <p>{day.date}</p>
                      <p>{formatVnd(day.revenueVnd)}</p>
                      <p>{day.paidOrders} đơn</p>
                    </div>
                  </div>
                </div>
                {idx % 5 === 0 && (
                  <span className="mt-2 text-[10px] font-black text-black/70">{day.date.split("-").slice(1).reverse().join("/")}</span>
                )}
              </div>
            ))}
          </div>
          {isRevenueEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="border-4 border-black bg-[#FFFDF5] px-4 py-3 text-sm font-black text-black shadow-[4px_4px_0px_0px_#000]">
                Chưa có doanh thu trong 30 ngày gần nhất
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {data.revenueByFamily.map((f) => (
          <article key={f.apiFamily} className="min-h-[140px] border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex items-center justify-between">
              <span className={`inline-flex border-2 border-black px-2 py-1 text-xs font-black uppercase text-black ${familyBg(f.apiFamily)}`}>
                {f.apiFamily}
              </span>
              <ChartNoAxesColumnIncreasing className="h-4 w-4 text-black" />
            </div>
            <p className="text-3xl font-black leading-none text-black">{formatVnd(f.revenueVnd)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-black uppercase text-black/60">Đơn hàng</p>
                <p className="text-sm font-black text-black">{f.paidOrders}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase text-black/60">Credits</p>
                <p className="text-sm font-black text-black">{formatNum(f.creditsSold)}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] md:p-6">
        <header className="mb-5">
          <h3 className="text-2xl font-black text-black">Top gói bán chạy nhất</h3>
          <p className="text-sm font-bold text-black/70">Dựa trên tổng doanh thu từ trước đến nay</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b-2 border-black bg-[#FFFDF5]">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black/60">Sản phẩm</th>
                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-black/60">Family</th>
                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-black/60">Số đơn</th>
                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-black/60">Doanh thu</th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.14em] text-black/60">Credits</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center border-4 border-black bg-[#E9E1D0]">
                        <Package className="h-6 w-6 text-black" />
                      </div>
                      <p className="text-base font-black text-black">Chưa có dữ liệu bán chạy</p>
                      <p className="text-sm font-bold text-black/60">Các gói sẽ xuất hiện khi có đơn thanh toán thành công.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.topProducts.map((p) => (
                  <tr key={p.productId} className="border-b border-black/20">
                    <td className="px-4 py-4 text-sm font-black text-black">{p.productName}</td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge status={p.apiFamily} variant="neutral" />
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-black">{p.paidOrders}</td>
                    <td className="px-4 py-4 text-center text-sm font-black text-black">{formatVnd(p.revenueVnd)}</td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-black">{formatNum(p.creditsSold)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black text-black">Đơn hàng thanh toán mới nhất</h3>
            <p className="text-sm font-bold text-black/70">20 đơn hàng đã thanh toán gần đây nhất</p>
          </div>
          <Link
            href="/admin/orders?status=PAID"
            className="inline-flex h-10 items-center gap-2 border-4 border-black bg-[#FFD93D] px-4 text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000]"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b-2 border-black bg-[#FFFDF5]">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black/60">Mã đơn</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black/60">Khách hàng</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black/60">Gói mua</th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.14em] text-black/60">Số tiền</th>
                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.14em] text-black/60">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPaidOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center border-4 border-black bg-[#E9E1D0]">
                        <CreditCard className="h-6 w-6 text-black" />
                      </div>
                      <p className="text-base font-black text-black">Chưa có đơn thanh toán</p>
                      <p className="text-sm font-bold text-black/60">Các đơn đã thanh toán gần nhất sẽ hiển thị tại đây.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.recentPaidOrders.map((o) => (
                  <tr key={o.id} className="border-b border-black/20">
                    <td className="px-4 py-4 text-xs font-black uppercase text-black">#{o.orderCode}</td>
                    <td className="px-4 py-4">
                      <p className="max-w-[220px] truncate text-sm font-bold text-black">{o.userEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[220px] truncate text-sm font-bold text-black">{o.productName}</span>
                        <StatusBadge status={o.apiFamily} variant="neutral" />
                        <span className={`inline-flex border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase text-black ${statusBg(o.status)}`}>
                          {translateStatus(o.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-black text-black">{formatVnd(o.amountVnd)}</td>
                    <td className="px-4 py-4 text-right text-xs font-bold text-black/70">
                      {o.paidAt ? format(new Date(o.paidAt), "dd/MM HH:mm") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
