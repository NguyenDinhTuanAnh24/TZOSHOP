"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { translateStatus } from "@/lib/format";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  KeyRound, 
  History, 
  ShoppingCart, 
  Zap, 
  Package, 
  Clock3,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import Skeleton from "react-loading-skeleton";
import { StatCardsSkeleton } from "@/components/ui/page-skeleton";

type DashboardData = {
  credits: {
    total: string;
    remaining: string;
    used: string;
    charged: string;
  };
  apiKeys: {
    total: number;
    active: number;
    revoked: number;
  };
  usage: {
    totalRequests: number;
    successRequests: number;
    failedRequests: number;
    successRate: number;
  };
  orders: {
    total: number;
    paid: number;
    pending: number;
    totalPaidAmount: number;
  };
  plans: {
    id: string;
    apiFamily: string;
    creditsTotal: string;
    creditsRemaining: string;
    startsAt: string;
    expiresAt: string;
    product: {
      id: string;
      name: string;
      slug: string;
      apiFamily: string;
      tier: string;
    } | null;
  }[];
  recentUsageLogs: {
    id: string;
    apiFamily: string;
    model: string;
    totalTokens: number;
    creditsCharged: string;
    status: string;
    createdAt: string;
    apiKey: {
      id: string;
      name: string;
      keyPrefix: string;
    } | null;
  }[];
  recentOrders: {
    id: string;
    orderCode: string;
    status: string;
    amountVnd: number;
    createdAt: string;
    paidAt: string | null;
    product: {
      id: string;
      name: string;
      slug: string;
      apiFamily: string;
      tier: string;
    } | null;
  }[];
};

function formatCreditsValue(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("vi-VN").format(num);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getUsagePercent(remaining: string, total: string) {
  const r = Number(remaining);
  const t = Number(total);
  if (!t || t <= 0) return 0;
  const used = t - r;
  return Math.min(100, Math.max(0, Math.round((used / t) * 100)));
}

function getStatusBadgeClass(status: string) {
  switch (status.toUpperCase()) {
    case "SUCCESS":
    case "PAID":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "FAILED":
    case "EXPIRED":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "REVOKED":
    case "CANCELLED":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    default:
      return "bg-slate-50 text-slate-500 ring-1 ring-slate-100";
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast, showToast, clearToast } = useToast(3000);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Lỗi tải dashboard.");
      setData(json.data);
    } catch {
      showToast("Không thể tải dữ liệu tổng quan.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const btnPrimary = "rounded-full bg-emerald-600 text-white hover:bg-emerald-700 px-5 py-2 text-sm font-bold transition-all flex items-center gap-2";
  const btnSecondary = "rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2 text-sm font-bold transition-all flex items-center gap-2";

  if (isLoading) {
    return (
      <div className="space-y-10 pb-20">
        <div className="flex items-center gap-4">
          <Skeleton circle width={48} height={48} />
          <div>
            <Skeleton width={180} height={32} />
            <Skeleton width={240} height={20} className="mt-1" />
          </div>
        </div>
        <StatCardsSkeleton />
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton width={200} height={28} />
            <Skeleton width={100} height={40} borderRadius="2rem" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <Skeleton width={80} height={20} borderRadius="1rem" />
                  <Skeleton circle width={16} height={16} />
                </div>
                <Skeleton width={150} height={24} />
                <div className="mt-6 space-y-3">
                  <Skeleton width={100} height={12} />
                  <Skeleton height={12} borderRadius="1rem" />
                  <div className="flex justify-between">
                    <Skeleton width={60} height={12} />
                    <Skeleton width={60} height={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
          <AppIcon icon={BarChart3} className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Tổng quan</h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500 font-medium line-clamp-1">
            Chào mừng bạn quay lại!
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <AppIcon icon={Wallet} className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Credits còn lại</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{formatCreditsValue(data?.credits.remaining ?? "0")}</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
              <AppIcon icon={Zap} className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Credits đã dùng</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{formatCreditsValue(data?.credits.used ?? "0")}</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
              <AppIcon icon={KeyRound} className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Keys</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{data?.apiKeys.active ?? 0}</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AppIcon icon={Clock3} className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn hàng chờ</p>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{data?.orders.pending ?? 0}</p>
        </div>
      </div>

      {/* Active Plans */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AppIcon icon={Package} className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">Gói đang hoạt động</h2>
          </div>
          <Link href="/my-plans" className={btnSecondary + " w-full sm:w-auto"}>
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {data?.plans.length === 0 ? (
          <div className="rounded-[40px] border border-dashed border-slate-300 bg-slate-50/50 p-10 sm:p-20 text-center">
            <h3 className="text-xl font-black text-slate-900">Bạn chưa có gói credits nào.</h3>
            <p className="mt-2 text-slate-500 font-medium">Hãy mua gói credits đầu tiên để bắt đầu sử dụng API.</p>
            <div className="mt-8 flex justify-center">
              <Link href="/plans" className={btnPrimary + " w-full sm:w-auto"}>
                Mua credits ngay
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.plans.slice(0, 3).map((plan) => {
              const usagePercent = getUsagePercent(plan.creditsRemaining, plan.creditsTotal);
              return (
                <div key={plan.id} className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {plan.apiFamily}
                    </span>
                    <AppIcon icon={CheckCircle2} className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 truncate">{plan.product?.name ?? "Gói Tùy Chỉnh"}</h3>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sử dụng</p>
                      <p className="text-sm font-black text-slate-900">{usagePercent}%</p>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${usagePercent > 80 ? "bg-rose-500" : "bg-emerald-500"}`} 
                        style={{ width: `${usagePercent}%` }} 
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-emerald-600">{formatCreditsValue(plan.creditsRemaining)}</span>
                      <span className="text-slate-300">/ {formatCreditsValue(plan.creditsTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Activity Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Usage Logs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AppIcon icon={History} className="h-6 w-6 text-emerald-600" />
              <h2 className="text-xl font-black text-slate-900">Sử dụng gần đây</h2>
            </div>
            <Link href="/usage" className={btnSecondary}>Chi tiết</Link>
          </div>
          <div className="space-y-3">
            {!data?.recentUsageLogs || data.recentUsageLogs.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
                <p className="text-slate-400 font-bold text-sm">Chưa có lịch sử sử dụng.</p>
                <Link href="/usage" className="mt-2 text-emerald-600 font-bold text-xs hover:underline">Xem lịch sử sử dụng</Link>
              </div>
            ) : (
              [...data.recentUsageLogs]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)
                .map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-hover hover:border-emerald-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900">{log.model}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${getStatusBadgeClass(log.status)}`}>
                          {translateStatus(log.status)}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <p className="text-sm font-black text-emerald-600">{formatCreditsValue(log.creditsCharged)}</p>
                  </div>
                ))
            )}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AppIcon icon={ShoppingCart} className="h-6 w-6 text-emerald-600" />
              <h2 className="text-xl font-black text-slate-900">Đơn hàng gần đây</h2>
            </div>
            <Link href="/billing" className={btnSecondary}>Tất cả</Link>
          </div>
          <div className="space-y-3">
            {data?.recentOrders.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
                <p className="text-slate-400 font-bold text-sm">Chưa có đơn hàng nào.</p>
              </div>
            ) : (
              data?.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-hover hover:border-emerald-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 truncate max-w-[150px]">{order.product?.name ?? "Gói nạp"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${getStatusBadgeClass(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      #{order.orderCode} · {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-black text-slate-900">{formatCurrency(order.amountVnd)}</p>
                    {order.status === "PENDING" && (
                      <Link href="/billing" className="text-[10px] font-black text-emerald-600 underline hover:text-emerald-700">Thanh toán</Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <AppIcon icon={Zap} className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-black text-slate-900">Thao tác nhanh</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/plans" className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <AppIcon icon={ShoppingCart} className="h-6 w-6" />
              </div>
              <AppIcon icon={ChevronRight} className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-black text-slate-900">Mua credits</h3>
            <p className="mt-1 text-xs font-medium text-slate-400">Nạp thêm lượt dùng cho AI</p>
          </Link>
          <Link href="/api-keys" className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <AppIcon icon={KeyRound} className="h-6 w-6" />
              </div>
              <AppIcon icon={ChevronRight} className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-black text-slate-900">Tạo API key</h3>
            <p className="mt-1 text-xs font-medium text-slate-400">Kết nối TzoShop với IDE</p>
          </Link>
          <Link href="/usage" className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <AppIcon icon={History} className="h-6 w-6" />
              </div>
              <AppIcon icon={ChevronRight} className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-black text-slate-900">Lịch sử sử dụng</h3>
            <p className="mt-1 text-xs font-medium text-slate-400">Theo dõi lượt gọi và credits</p>
          </Link>
          <Link href="/my-plans" className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <AppIcon icon={Package} className="h-6 w-6" />
              </div>
              <AppIcon icon={ChevronRight} className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-black text-slate-900">Gói của tôi</h3>
            <p className="mt-1 text-xs font-medium text-slate-400">Quản lý kho gói đã mua</p>
          </Link>
        </div>
      </section>

      {/* Toast */}
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
