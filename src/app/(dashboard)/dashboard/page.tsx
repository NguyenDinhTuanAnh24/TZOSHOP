"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock3,
  History,
  KeyRound,
  Package,
  ShoppingCart,
  Wallet,
  Zap,
} from "lucide-react";
import { translateStatus } from "@/lib/format";
import { formatCredits } from "@/lib/credits";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { TextFadeInUp } from "@/components/ui/text-fade-in-up";
import { CosmicButton } from "@/components/ui/cosmic-button";

type DashboardData = {
  credits: { total: string; remaining: string; used: string; charged: string };
  apiKeys: { total: number; active: number; revoked: number };
  usage: { totalRequests: number; successRequests: number; failedRequests: number; successRate: number };
  orders: { total: number; paid: number; pending: number; totalPaidAmount: number };
  plans: {
    id: string;
    apiFamily: string;
    aiLineLabel?: string;
    creditsTotal: string;
    creditsRemaining: string;
    creditsUsed?: string;
    creditsSource?: "NEWAPI" | "DB";
    startsAt: string;
    expiresAt: string;
    product: { id: string; name: string; slug: string; apiFamily: string; tier: string } | null;
  }[];
  recentUsageLogs: {
    id: string;
    apiFamily: string;
    model: string;
    totalTokens: number;
    creditsCharged: string;
    status: string;
    createdAt: string;
    apiKey: { id: string; name: string; keyPrefix: string } | null;
  }[];
  recentOrders: {
    id: string;
    orderCode: string;
    status: string;
    amountVnd: number;
    createdAt: string;
    paidAt: string | null;
    product: { id: string; name: string; slug: string; apiFamily: string; tier: string } | null;
  }[];
};

function formatCreditsValue(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return formatCredits(num);
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function getUsagePercent(remaining: string, total: string) {
  const r = Number(remaining);
  const t = Number(total);
  if (!t || t <= 0) return 0;
  const used = t - r;
  return Math.min(100, Math.max(0, Math.round((used / t) * 100)));
}

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.28)]";
const primaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold !text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(79,70,229,0.45)] active:scale-[0.98]";

const secondaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 active:scale-[0.98]";

function UsageStatusBadge({ status }: { status: string }) {
  const translated = translateStatus(status);
  const isSuccess = status === "SUCCESS";
  const isPending = status === "PENDING";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : isPending
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {translated}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const translated = translateStatus(status);
  const cls =
    status === "PAID"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "PENDING"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{translated}</span>;
}

function DashboardPageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-4 w-[440px] max-w-full rounded-full" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className={cardClass}>
              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-2xl" />
              </div>
              <Skeleton className="mt-5 h-8 w-28 rounded-xl" />
              <Skeleton className="mt-2 h-4 w-28 rounded-full" />
            </div>
          ))}
        </div>

        <section className="space-y-5">
          <Skeleton className="h-7 w-48 rounded-xl" />
          <div className="min-h-[240px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm" />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-6 w-40 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            </div>
        ))}
      </div>
    </div>
  );
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

  if (isLoading) {
    return (
      <div className="space-y-8 overflow-x-hidden" aria-busy="true">
        <DashboardPageSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8 overflow-x-hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-700 shadow-sm">
          Không có dữ liệu dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 overflow-x-hidden">

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Credits còn lại",
            value: formatCreditsValue(data.credits.remaining),
            sub: "Có thể sử dụng",
            icon: Wallet,
            iconClass: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "Credits đã dùng",
            value: formatCreditsValue(data.credits.used),
            sub: "Đã tiêu thụ",
            icon: Zap,
            iconClass: "bg-violet-50 text-violet-600",
          },
          {
            label: "API Keys",
            value: String(data.apiKeys.active),
            sub: "Đang hoạt động",
            icon: KeyRound,
            iconClass: "bg-amber-50 text-amber-600",
          },
          {
            label: "Đơn hàng chờ",
            value: String(data.orders.pending),
            sub: "Cần xử lý",
            icon: Clock3,
            iconClass: "bg-rose-50 text-rose-600",
          },
        ].map((s) => (
          <article key={s.label} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{s.label}</p>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconClass}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{s.value}</p>
            <p className="mt-2 text-xs text-slate-600">{s.sub}</p>
          </article>
        ))}
      </div>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Package className="h-5 w-5" />
            </span>
            <h3 className="text-2xl font-extrabold text-slate-950">Gói đang hoạt động</h3>
          </div>
          <Link href="/my-plans" className={secondaryBtnClass}>Xem tất cả</Link>
        </div>

        {data.plans.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Package className="h-7 w-7" />
            </div>
            <TextFadeInUp as="h4" className="text-xl font-bold text-slate-950">Bạn chưa có gói credits nào</TextFadeInUp>
            <TextFadeInUp as="p" delay={0.08} className="mt-2 max-w-2xl text-sm text-slate-600">Mua gói credits đầu tiên để bắt đầu tạo API key và sử dụng các model AI.</TextFadeInUp>
            <Link href="/plans" className={`${primaryBtnClass} mt-6`}>Xem gói credits</Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.plans.slice(0, 3).map((plan) => {
              const usagePercent = getUsagePercent(plan.creditsRemaining, plan.creditsTotal);
              return (
                <article key={plan.id} className={cardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-lg font-bold text-slate-950">{plan.product?.name ?? "Gói tùy chỉnh"}</p>
                    <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{plan.aiLineLabel ?? plan.apiFamily}</span>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credits còn lại</p>
                    <p className="text-2xl font-extrabold text-slate-950">{formatCreditsValue(plan.creditsRemaining)}</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" style={{ width: `${usagePercent}%` }} />
                    </div>
                    <p className="text-xs text-slate-600">
                      {formatCreditsValue(plan.creditsRemaining)} / {formatCreditsValue(plan.creditsTotal)} credits
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href="/api-keys" className="text-xs font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-700">Tạo API key</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><History className="h-5 w-5" /></span>
              <h3 className="text-xl font-bold text-slate-950">Sử dụng gần đây</h3>
            </div>
            <Link href="/usage" className={secondaryBtnClass}>Chi tiết</Link>
          </div>

          {!data.recentUsageLogs?.length ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center">
              <h4 className="text-lg font-bold text-slate-950">Chưa có lịch sử sử dụng</h4>
              <p className="mt-2 text-sm text-slate-600">Khi bạn gọi API, lịch sử sử dụng sẽ hiển thị tại đây.</p>
            <CosmicButton href="/api-docs" className="mt-4">Xem hướng dẫn API</CosmicButton>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {[...data.recentUsageLogs]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)
                .map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-3 bg-white p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{log.model}</p>
                      <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                    <div className="text-right">
                      <UsageStatusBadge status={log.status} />
                      <p className="mt-1 text-sm font-bold text-slate-900">{formatCreditsValue(log.creditsCharged)}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><ShoppingCart className="h-5 w-5" /></span>
              <h3 className="text-xl font-bold text-slate-950">Đơn hàng gần đây</h3>
            </div>
            <Link href="/billing" className={secondaryBtnClass}>Tất cả</Link>
          </div>

          {!data.recentOrders?.length ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center">
              <h4 className="text-lg font-bold text-slate-950">Chưa có đơn hàng</h4>
              <p className="mt-2 text-sm text-slate-600">Các đơn mua credits của bạn sẽ được hiển thị tại đây.</p>
              <CosmicButton href="/plans" className="mt-4">Mua credits</CosmicButton>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.product?.name ?? "Gói nạp"}</p>
                    <p className="text-xs text-slate-500">
                      #{order.orderCode} • {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <OrderStatusBadge status={order.status} />
                    <p className="mt-1 text-sm font-bold text-slate-900">{formatCurrency(order.amountVnd)}</p>
                    {order.status === "PENDING" && (
                      <Link href="/billing" className="text-xs font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-700">Thanh toán</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
