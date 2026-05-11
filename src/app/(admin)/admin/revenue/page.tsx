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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang tải dữ liệu doanh thu...</p>
      </div>
    );
  }

  if (!data) return null;

  const formatVnd = (val: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  const formatNum = (val: string | number) => new Intl.NumberFormat("vi-VN").format(Number(val));

  const maxDailyRevenue = Math.max(...data.revenueByDay.map(d => d.revenueVnd), 1);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
              <BarChart3 className="h-8 w-8" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Thống kê doanh thu</h1>
              <p className="text-slate-500 font-bold mt-1">Theo dõi doanh thu, đơn thanh toán và hiệu quả kinh doanh.</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600 ring-1 ring-emerald-500/10">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Live System
           </span>
           <button 
             onClick={handleExportCsv}
             disabled={isExporting}
             className="flex h-12 px-6 items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-black text-white hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
           >
              {isExporting ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Đang xuất...</>
              ) : (
                "Xuất CSV"
              )}
           </button>
           <button 
             onClick={fetchRevenueData}
             className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
           >
             <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          label="Tổng doanh thu" 
          value={formatVnd(data.summary.totalRevenueVnd)} 
          subValue="Toàn bộ thời gian"
          icon={Wallet}
          color="bg-slate-900"
        />
        <SummaryCard 
          label="Doanh thu hôm nay" 
          value={formatVnd(data.summary.todayRevenueVnd)} 
          subValue={format(new Date(), "'Ngày' dd/MM")}
          icon={DollarSign}
          color="bg-emerald-600"
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
        />
        <SummaryCardSmall 
          label="Credits đã bán" 
          value={formatNum(data.summary.creditsSold)} 
          icon={Package}
          suffix="Bán"
          textColor="text-emerald-600"
        />
        <SummaryCardSmall 
          label="Credits đã cấp" 
          value={formatNum(data.summary.creditsGranted)} 
          icon={TrendingUp}
          suffix="Tổng"
          textColor="text-blue-600"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Doanh thu 30 ngày gần nhất</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Dữ liệu từ {data.revenueByDay[0].date} đến {data.revenueByDay[29].date}</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="h-3 w-3 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black uppercase text-slate-500">Doanh thu</span>
              </div>
           </div>
        </div>

        <div className="flex h-[300px] items-end gap-1.5 sm:gap-2">
           {data.revenueByDay.map((day, idx) => (
             <div key={idx} className="group relative flex flex-1 flex-col items-center">
                <div 
                  className="w-full rounded-t-lg bg-emerald-500/10 hover:bg-emerald-500 transition-all duration-300 relative group"
                  style={{ height: `${(day.revenueVnd / maxDailyRevenue) * 100}%`, minHeight: '4px' }}
                >
                   {/* Tooltip */}
                   <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 group-hover:block z-20">
                      <div className="rounded-xl bg-slate-900 px-3 py-2 shadow-xl whitespace-nowrap">
                         <p className="text-[10px] font-bold text-slate-400">{day.date}</p>
                         <p className="text-xs font-black text-white">{formatVnd(day.revenueVnd)}</p>
                         <p className="text-[10px] font-bold text-emerald-400">{day.paidOrders} đơn hàng</p>
                      </div>
                      <div className="mx-auto h-2 w-2 -translate-y-1 rotate-45 bg-slate-900" />
                   </div>
                </div>
                {idx % 5 === 0 && (
                  <span className="mt-4 text-[9px] font-black uppercase text-slate-400 rotate-45 sm:rotate-0">
                    {day.date.split('-').slice(1).reverse().join('/')}
                  </span>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Family Breakdown */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         {data.revenueByFamily.map((f, i) => (
           <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:border-emerald-200 transition-all group">
              <div className="flex items-center justify-between mb-4">
                 <span className="rounded-xl bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {f.apiFamily}
                 </span>
                 <LineChart className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
              </div>
              <h4 className="text-lg font-black text-slate-900">{formatVnd(f.revenueVnd)}</h4>
              <div className="flex items-center justify-between mt-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Đơn hàng</span>
                    <span className="text-sm font-black text-slate-700">{f.paidOrders}</span>
                 </div>
                 <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Credits</span>
                    <span className="text-sm font-black text-slate-700">{formatNum(f.creditsSold)}</span>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* Top Products */}
      <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
           <h3 className="text-xl font-black text-slate-900 tracking-tight">Top gói bán chạy nhất</h3>
           <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Dựa trên tổng doanh thu từ trước đến nay</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Sản phẩm</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Family</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Số đơn</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Doanh thu</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Credits bán ra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {data.topProducts.map((p, i) => (
                 <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <span className="text-sm font-black text-slate-900">{p.productName}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                          {p.apiFamily}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="text-sm font-black text-slate-700">{p.paidOrders}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="text-sm font-black text-emerald-600">{formatVnd(p.revenueVnd)}</span>
                    </td>
                    <td className="px-8 py-6 text-right font-mono text-xs font-bold text-slate-500">
                       {formatNum(p.creditsSold)}
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
           <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Đơn hàng thanh toán mới nhất</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">20 đơn hàng PAID gần đây nhất</p>
           </div>
           <Link href="/admin/orders?status=PAID" className="flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest">
              Xem tất cả <ArrowRight className="h-4 w-4" />
           </Link>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Mã đơn</th>
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Khách hàng</th>
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Gói mua</th>
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Số tiền</th>
                   <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {data.recentPaidOrders.map((o) => (
                   <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6 font-mono text-xs font-bold text-slate-400 uppercase">
                         #{o.orderCode}
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900">{o.userEmail}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-700">{o.productName}</span>
                            <span className="text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">{o.apiFamily}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className="text-sm font-black text-slate-900">{formatVnd(o.amountVnd)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className="text-[11px] font-bold text-slate-400">
                            {o.paidAt ? format(new Date(o.paidAt), "dd/MM HH:mm") : '-'}
                         </span>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

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
    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-100 transition-all">
      <div className="relative z-10">
        <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center text-white mb-6 shadow-lg shadow-${color.split('-')[1]}-100`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
           <Calendar className="h-3 w-3" /> {subValue}
        </p>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform">
         <Icon className="h-32 w-32" />
      </div>
    </div>
  );
}

function SummaryCardSmall({ label, value, icon: Icon, suffix, textColor = "text-slate-900" }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
       <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
          <Icon className="h-6 w-6" />
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
          <div className="flex items-baseline gap-1.5">
             <span className={`text-2xl font-black ${textColor}`}>{value}</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{suffix}</span>
          </div>
       </div>
    </div>
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
