"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Wallet, 
  LineChart, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  ShoppingCart, 
  Package, 
  Calendar,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Target,
  ArrowRight
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { downloadCsv } from "@/lib/download-csv";

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

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/revenue");
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await downloadCsv(
        "/api/admin/revenue/export",
        `tzoshop-revenue-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      
      showToast("Đã xuất CSV thành công.", "success");
    } catch (error) {
      showToast("Không thể xuất CSV.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
        <p className={cn(ui.label, "animate-pulse")}>Đang tải dữ liệu doanh thu...</p>
      </div>
    );
  }

  if (!data) return null;

  const formatVnd = (val: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  const formatNum = (val: string | number) => new Intl.NumberFormat("vi-VN").format(Number(val));

  const maxDailyRevenue = Math.max(...data.revenueByDay.map(d => d.revenueVnd), 1);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Thống kê doanh thu" 
        description="Theo dõi doanh thu, đơn thanh toán và hiệu quả kinh doanh."
        icon={<BarChart3 className="h-8 w-8" />}
        actions={
          <div className="flex items-center gap-3">
             <StatusBadge status="Live System" variant="info" />
             <AppButton 
               variant="accent"
               onClick={handleExportCsv}
               disabled={isExporting}
             >
                {isExporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isExporting ? "Đang xuất..." : "Xuất CSV"}
             </AppButton>
             <IconButton 
               onClick={fetchRevenueData}
               isLoading={isLoading}
               variant="outline"
               title="Làm mới"
             >
               <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
             </IconButton>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          label="Tổng doanh thu" 
          value={formatVnd(data.summary.totalRevenueVnd)} 
          subValue="Toàn bộ thời gian"
          icon={Wallet}
          color="bg-[#020c0a]"
        />
        <SummaryCard 
          label="Doanh thu hôm nay" 
          value={formatVnd(data.summary.todayRevenueVnd)} 
          subValue={format(new Date(), "'Ngày' dd/MM")}
          icon={DollarSign}
          color="bg-[#00d4a4]"
        />
        <SummaryCard 
          label="Doanh thu tháng này" 
          value={formatVnd(data.summary.monthRevenueVnd)} 
          subValue={format(new Date(), "'Tháng' MM/yyyy")}
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <SummaryCard 
          label="Giá trị đơn TB" 
          value={formatVnd(data.summary.averageOrderValueVnd)} 
          subValue="Revenue / Paid Orders"
          icon={Target}
          color="bg-purple-600"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCardSmall 
          label="Đơn đã thanh toán" 
          value={formatNum(data.summary.paidOrders)} 
          icon={ShoppingCart}
          suffix="Đơn"
        />
        <SummaryCardSmall 
          label="Đơn chờ thanh toán" 
          value={formatNum(data.summary.pendingOrders)} 
          icon={Clock}
          suffix="Đơn"
          textColor="text-amber-600"
          bgColor="bg-amber-50"
        />
        <SummaryCardSmall 
          label="Credits đã bán" 
          value={formatNum(data.summary.creditsSold)} 
          icon={Package}
          suffix="Bán"
          textColor="text-[#00d4a4]"
          bgColor="bg-[#e7fff7]"
        />
        <SummaryCardSmall 
          label="Credits đã cấp" 
          value={formatNum(data.summary.creditsGranted)} 
          icon={TrendingUp}
          suffix="Tổng"
          textColor="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      <AppCard className="p-8">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h3 className={ui.h3}>Doanh thu 30 ngày gần nhất</h3>
              <p className={cn(ui.pMuted, "mt-1")}>Dữ liệu từ {data.revenueByDay[0].date} đến {data.revenueByDay[29].date}</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="h-3 w-3 rounded-full bg-[#00d4a4]" />
                 <span className={ui.label}>Doanh thu</span>
              </div>
           </div>
        </div>

        <div className="flex h-[300px] items-end gap-1.5 sm:gap-2">
           {data.revenueByDay.map((day, idx) => (
             <div key={idx} className="group relative flex flex-1 flex-col items-center">
                <div 
                  className="w-full rounded-t-lg bg-[#00d4a4]/10 hover:bg-[#00d4a4] transition-all duration-300 relative group"
                  style={{ height: `${(day.revenueVnd / maxDailyRevenue) * 100}%`, minHeight: '4px' }}
                >
                   {/* Tooltip */}
                   <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 group-hover:block z-20">
                      <div className="rounded-xl bg-[#020c0a] px-3 py-2 shadow-xl whitespace-nowrap">
                         <p className="text-[10px] font-bold text-white/50">{day.date}</p>
                         <p className="text-xs font-black text-white">{formatVnd(day.revenueVnd)}</p>
                         <p className="text-[10px] font-bold text-[#00d4a4]">{day.paidOrders} đơn hàng</p>
                      </div>
                      <div className="mx-auto h-2 w-2 -translate-y-1 rotate-45 bg-[#020c0a]" />
                   </div>
                </div>
                {idx % 5 === 0 && (
                  <span className={cn(ui.label, "mt-4 rotate-45 sm:rotate-0")}>
                    {day.date.split('-').slice(1).reverse().join('/')}
                  </span>
                )}
             </div>
           ))}
        </div>
      </AppCard>

      {/* Family Breakdown */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         {data.revenueByFamily.map((f, i) => (
           <AppCard key={i} className="p-6 hover:border-[#00d4a4]/40 transition-all group">
              <div className="flex items-center justify-between mb-4">
                 <StatusBadge status={f.apiFamily} variant="neutral" />
                 <LineChart className="h-4 w-4 text-[#dfe5e1] group-hover:text-[#00d4a4]" />
              </div>
              <h4 className={cn(ui.h3, "text-lg")}>{formatVnd(f.revenueVnd)}</h4>
              <div className="flex items-center justify-between mt-4">
                 <div className="flex flex-col">
                    <span className={ui.label}>Đơn hàng</span>
                    <span className="text-sm font-black text-[#47524d]">{f.paidOrders}</span>
                 </div>
                 <div className="flex flex-col text-right">
                    <span className={ui.label}>Credits</span>
                    <span className="text-sm font-black text-[#47524d]">{formatNum(f.creditsSold)}</span>
                 </div>
              </div>
           </AppCard>
         ))}
      </div>

      <AppCard className="overflow-hidden">
        <div className="p-8 border-b border-[#edf1ee]">
           <h3 className={ui.h3}>Top gói bán chạy nhất</h3>
           <p className={ui.pMuted}>Dựa trên tổng doanh thu từ trước đến nay</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Sản phẩm</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Family</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Số đơn</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Doanh thu</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-right">Credits bán ra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {data.topProducts.map((p, i) => (
                 <tr key={i} className="hover:bg-[#fbfbf8] transition-colors">
                    <td className="px-8 py-6">
                       <span className="text-sm font-black text-[#0b0f0d]">{p.productName}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <StatusBadge status={p.apiFamily} variant="neutral" />
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="text-sm font-black text-[#47524d]">{p.paidOrders}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="text-sm font-black text-[#00d4a4]">{formatVnd(p.revenueVnd)}</span>
                    </td>
                    <td className="px-8 py-6 text-right font-mono text-xs font-bold text-[#8a9690]">
                       {formatNum(p.creditsSold)}
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </AppCard>

      <AppCard className="overflow-hidden">
        <div className="p-8 border-b border-[#edf1ee] flex items-center justify-between">
           <div>
              <h3 className={ui.h3}>Đơn hàng thanh toán mới nhất</h3>
              <p className={ui.pMuted}>20 đơn hàng PAID gần đây nhất</p>
           </div>
           <Link href="/admin/orders?status=PAID" className="flex items-center gap-2 text-xs font-black text-[#00d4a4] hover:text-[#00d4a4]/80 transition-colors uppercase tracking-widest">
              Xem tất cả <ArrowRight className="h-4 w-4" />
           </Link>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Mã đơn</th>
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Khách hàng</th>
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Gói mua</th>
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-right">Số tiền</th>
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {data.recentPaidOrders.map((o) => (
                   <tr key={o.id} className="hover:bg-[#fbfbf8] transition-colors">
                      <td className="px-8 py-6 font-mono text-xs font-bold text-[#8a9690] uppercase">
                         #{o.orderCode}
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-[#0b0f0d]">{o.userEmail}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#47524d]">{o.productName}</span>
                            <StatusBadge status={o.apiFamily} variant="neutral" />
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className="text-sm font-black text-[#0b0f0d]">{formatVnd(o.amountVnd)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className={cn(ui.pMuted, "text-[11px]")}>
                            {o.paidAt ? format(new Date(o.paidAt), "dd/MM HH:mm") : '-'}
                         </span>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </AppCard>

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, subValue, icon: Icon, color }: any) {
  return (
    <AppCard className="p-8 relative overflow-hidden group hover:shadow-xl hover:shadow-[#00d4a4]/10 transition-all border-[#edf1ee]">
      <div className="relative z-10">
        <div className={cn(`h-12 w-12 rounded-2xl ${color} flex items-center justify-center text-white mb-6 shadow-lg shadow-black/10`)}>
          <Icon className="h-6 w-6" />
        </div>
        <p className={ui.label + " mb-1"}>{label}</p>
        <h3 className="text-2xl font-black text-[#0b0f0d] tracking-tight">{value}</h3>
        <p className={cn(ui.pMuted, "text-[10px] mt-2 flex items-center gap-1.5")}>
           <Calendar className="h-3 w-3" /> {subValue}
        </p>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform text-[#0b0f0d]">
         <Icon className="h-32 w-32" />
      </div>
    </AppCard>
  );
}

function SummaryCardSmall({ label, value, icon: Icon, suffix, textColor = "text-[#0b0f0d]", bgColor = "bg-[#fbfbf8]" }: any) {
  return (
    <AppCard className={cn("p-6 flex items-center gap-5 border-[#edf1ee]", bgColor)}>
       <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-[#8a9690] shrink-0 shadow-sm border border-[#edf1ee]">
          <Icon className="h-6 w-6" />
       </div>
       <div>
          <p className={ui.label + " mb-0.5"}>{label}</p>
          <div className="flex items-baseline gap-1.5">
             <span className={`text-2xl font-black ${textColor}`}>{value}</span>
             <span className={ui.label}>{suffix}</span>
          </div>
       </div>
    </AppCard>
  );
}

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
