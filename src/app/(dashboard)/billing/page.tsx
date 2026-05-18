"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Info,
  Search,
  SearchCheck,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  Package,
  XCircle,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getAiLineLabelFromApiFamily, getAiLineLabelFromSlug } from "@/lib/ai-line";

type ApiOrderStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
type BillingFilter = "all" | "pending" | "paid" | "cancelled" | "expired";
type BillingSort = "newest" | "oldest" | "amount_desc" | "amount_asc";

type ApiOrder = {
  id: string;
  orderCode: string;
  status: ApiOrderStatus;
  amountVnd: number;
  paidAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    apiFamily: "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
    tier: string;
    credits: string;
    durationDays: number;
    priceVnd: number;
    apiKeyLimit: number;
    allowedModels: string[];
  };
};

type PaymentData = {
  orderId: string;
  orderCode: string;
  payosOrderCode: string;
  amount: number;
  description: string;
  qrCode: string;
  checkoutUrl: string;
  status: string;
};

const FILTERS: Array<{ id: BillingFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ thanh toán" },
  { id: "paid", label: "Đã thanh toán" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "expired", label: "Hết hạn" },
];

const SORT_OPTIONS: Array<{ id: BillingSort; label: string }> = [
  { id: "newest", label: "Mới nhất" },
  { id: "oldest", label: "Cũ nhất" },
  { id: "amount_desc", label: "Giá cao" },
  { id: "amount_asc", label: "Giá thấp" },
];

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function formatCredits(value: string) {
  const amount = Number(value);
  if (Number.isInteger(amount)) {
    return new Intl.NumberFormat("en-US").format(amount);
  }
  return amount.toFixed(6).replace(/\.?0+$/, "");
}

function getStatusLabel(status: ApiOrderStatus) {
  if (status === "PAID") return "Đã thanh toán";
  if (status === "PENDING") return "Chờ thanh toán";
  if (status === "CANCELLED") return "Đã hủy";
  return "Hết hạn";
}

function getDisplayAiFamily(product: { slug?: string; apiFamily: string }) {
  if (product.slug) return getAiLineLabelFromSlug(product.slug);
  return getAiLineLabelFromApiFamily(product.apiFamily);
}

function getStatusClass(status: ApiOrderStatus) {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (status === "PENDING") return "bg-amber-50 text-amber-700 border border-amber-100";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-700 border border-rose-100";
  return "bg-slate-100 text-slate-600 border border-slate-200";
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_10px_24px_-14px_rgba(79,70,229,0.55)]"
          : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
      )}
    >
      {children}
    </button>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="animate-pulse space-y-3">
          <div className="h-9 w-56 rounded-xl bg-slate-100" />
          <div className="h-5 w-full max-w-xl rounded-xl bg-slate-100" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-8 w-24 rounded bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-full rounded-xl bg-slate-100" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 w-full rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<BillingFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<BillingSort>("newest");
  const [activePayment, setActivePayment] = useState<PaymentData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const { toast, showToast, clearToast } = useToast(3000);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const loadBillingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Không thể tải lịch sử đơn hàng.");
      setOrders(data.data ?? []);
    } catch {
      const message = "Vui lòng thử lại sau ít phút.";
      setLoadError(message);
      showToast("Không thể tải đơn hàng.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBillingData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBillingData]);

  const handlePayOS = async (order: ApiOrder) => {
    try {
      const res = await fetch(`/api/payments/payos/create`, {
        method: "POST",
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error?.message ?? "Không thể tạo thanh toán.");
      setActivePayment(result);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Không thể tạo thanh toán.", "error");
    }
  };

  const handleCancelPayment = async (orderId: string) => {
    try {
      const res = await fetch(`/api/payments/payos/cancel`, {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) throw new Error("Không thể hủy thanh toán.");

      showToast("Đã hủy thanh toán.", "success");
      setActivePayment(null);
      await loadBillingData();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Đã xảy ra lỗi.", "error");
    }
  };

  const filteredOrders = useMemo(() => {
    const byFilter = orders.filter((order) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "paid") return order.status === "PAID";
      if (selectedFilter === "pending") return order.status === "PENDING";
      if (selectedFilter === "cancelled") return order.status === "CANCELLED";
      return order.status === "EXPIRED";
    });

    const q = searchText.trim().toLowerCase();
    const bySearch = q
      ? byFilter.filter(
          (o) => o.orderCode.toLowerCase().includes(q) || o.product.name.toLowerCase().includes(q)
        )
      : byFilter;

    const sorted = [...bySearch];
    sorted.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "amount_desc") return b.amountVnd - a.amountVnd;
      return a.amountVnd - b.amountVnd;
    });
    return sorted;
  }, [orders, searchText, selectedFilter, sortBy]);

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.status === "PAID");
    const pending = orders.filter((order) => order.status === "PENDING");
    const totalSpent = paid.reduce((sum, order) => sum + order.amountVnd, 0);
    return { totalOrders: orders.length, paidOrders: paid.length, pendingOrders: pending.length, totalSpent };
  }, [orders]);

  return (
    <main className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 px-5 py-6 lg:px-8 lg:py-8" aria-busy={isLoading}>
      <div className="space-y-8 lg:space-y-10">
        <TextFadeInUp as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Thanh toán</h1>
              <p className="text-sm leading-7 text-slate-600 md:text-base">
                Theo dõi đơn hàng, trạng thái thanh toán và lịch sử mua credits của bạn.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <CosmicButton href="/plans">
                <ShoppingCart className="h-4 w-4" /> Mua credits
              </CosmicButton>
              <CosmicButton href="/my-plans" variant="secondary">
                <Package className="h-4 w-4" /> Gói của tôi
              </CosmicButton>
            </div>
          </div>
        </TextFadeInUp>

        {isLoading ? (
          <BillingSkeleton />
        ) : (
          <div className="space-y-8">
            <TextFadeInUp as="section" delay={0.05} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.28)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Tổng đơn hàng</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><CreditCard className="h-5 w-5" /></div>
                </div>
                <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{stats.totalOrders}</p>
                <p className="mt-2 text-xs text-slate-600">Tất cả giao dịch</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.28)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Đã thanh toán</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                </div>
                <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{stats.paidOrders}</p>
                <p className="mt-2 text-xs text-slate-600">Hoàn tất</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.28)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Đang chờ thanh toán</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock3 className="h-5 w-5" /></div>
                </div>
                <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{stats.pendingOrders}</p>
                <p className="mt-2 text-xs text-slate-600">Cần xử lý</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.28)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Tổng đã chi</p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Wallet className="h-5 w-5" /></div>
                </div>
                <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{formatCurrency(stats.totalSpent)}</p>
                <p className="mt-2 text-xs text-slate-600">Đã thanh toán</p>
              </article>
            </TextFadeInUp>

            <TextFadeInUp as="section" delay={0.1} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map((filter) => (
                  <FilterChip key={filter.id} active={selectedFilter === filter.id} onClick={() => setSelectedFilter(filter.id)}>
                    {filter.label}
                  </FilterChip>
                ))}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Tìm theo mã đơn hàng hoặc tên gói..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-indigo-50/30"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as BillingSort)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-indigo-50/30"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </TextFadeInUp>

            {loadError ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-950">Không thể tải đơn hàng</h3>
                <p className="mt-2 text-sm text-slate-600">{loadError}</p>
                <CosmicButton variant="secondary" className="mt-5" onClick={() => void loadBillingData()}>
                  Thử lại
                </CosmicButton>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-950">Bạn chưa có đơn hàng nào</h3>
                <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
                  Khi bạn mua credits, đơn hàng và trạng thái thanh toán sẽ hiển thị tại đây.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <CosmicButton href="/plans">Mua credits</CosmicButton>
                  <CosmicButton href="/my-plans" variant="secondary">Xem gói của tôi</CosmicButton>
                </div>
              </div>
            ) : (
              <>
                <div className="hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3">Đơn hàng</th>
                          <th className="px-4 py-3">Gói credits</th>
                          <th className="px-4 py-3">Số tiền</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3">Ngày tạo</th>
                          <th className="px-4 py-3">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-t border-slate-100 transition-colors hover:bg-indigo-50/30">
                            <td className="px-4 py-4 text-sm font-semibold text-slate-900">#{order.orderCode}</td>
                            <td className="px-4 py-4 text-sm">
                              <p className="font-semibold text-slate-900">{order.product.name}</p>
                              <div className="mt-1 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                                {getDisplayAiFamily(order.product)}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-950">{formatCurrency(order.amountVnd)}</td>
                            <td className="px-4 py-4">
                              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getStatusClass(order.status))}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                {order.status === "PENDING" && (
                                  <CosmicButton
                                    size="sm"
                                    onClick={() =>
                                      askConfirm({
                                        title: "Thanh toán đơn hàng?",
                                        description:
                                          "Bạn sẽ được chuyển hướng đến giao diện thanh toán an toàn để hoàn tất giao dịch.",
                                        confirmLabel: "Thanh toán ngay",
                                        cancelLabel: "Hủy",
                                        type: "info",
                                        onConfirm: () => handlePayOS(order),
                                      })
                                    }
                                  >
                                    Thanh toán ngay
                                  </CosmicButton>
                                )}
                                <CosmicButton variant="secondary" size="sm" onClick={() => setSelectedOrder(order)}>
                                  Chi tiết
                                </CosmicButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4 lg:hidden">
                  {filteredOrders.map((order) => (
                    <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{order.product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">#{order.orderCode}</p>
                        </div>
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getStatusClass(order.status))}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p>Số tiền: <span className="font-bold text-slate-900">{formatCurrency(order.amountVnd)}</span></p>
                        <p>Ngày tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.status === "PENDING" && (
                          <CosmicButton
                            size="sm"
                            onClick={() =>
                              askConfirm({
                                title: "Thanh toán đơn hàng?",
                                description: "Bạn sẽ được chuyển hướng đến giao diện thanh toán an toàn để hoàn tất giao dịch.",
                                confirmLabel: "Thanh toán ngay",
                                cancelLabel: "Hủy",
                                type: "info",
                                onConfirm: () => handlePayOS(order),
                              })
                            }
                          >
                            Thanh toán ngay
                          </CosmicButton>
                        )}
                        <CosmicButton variant="secondary" size="sm" onClick={() => setSelectedOrder(order)}>
                          Chi tiết
                        </CosmicButton>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Info className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-slate-950">Lưu ý thanh toán</h3>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <p><span className="font-semibold text-slate-900">Chờ thanh toán:</span> Đơn đã tạo nhưng chưa hoàn tất thanh toán.</p>
                <p><span className="font-semibold text-slate-900">Đã thanh toán:</span> Credits đã được cộng vào tài khoản.</p>
                <p><span className="font-semibold text-slate-900">Đã hủy:</span> Đơn không còn hiệu lực.</p>
                <p>Nếu đã thanh toán nhưng chưa thấy credits, hãy dùng nút <span className="font-semibold text-slate-900">Kiểm tra thanh toán</span> hoặc liên hệ hỗ trợ.</p>
              </div>
              <CosmicButton className="mt-5" onClick={() => { window.location.href = "/support"; }}>
                <SearchCheck className="h-4 w-4" /> Kiểm tra thanh toán
              </CosmicButton>
            </aside>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.45)] sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-950">Chi tiết đơn hàng</h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Mã đơn hàng</p><p className="mt-1 font-semibold text-slate-900">#{selectedOrder.orderCode}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Trạng thái</p><p className="mt-1"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getStatusClass(selectedOrder.status))}>{getStatusLabel(selectedOrder.status)}</span></p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Tên gói</p><p className="mt-1 font-semibold text-slate-900">{selectedOrder.product.name}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Dòng AI</p><p className="mt-1 font-semibold text-slate-900">{getDisplayAiFamily(selectedOrder.product)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Credits</p><p className="mt-1 font-semibold text-slate-900">{formatCredits(selectedOrder.product.credits)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Thời hạn</p><p className="mt-1 font-semibold text-slate-900">{selectedOrder.product.durationDays > 0 ? `${selectedOrder.product.durationDays} ngày` : "Dùng đến khi hết credits"}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Số tiền</p><p className="mt-1 font-semibold text-slate-900">{formatCurrency(selectedOrder.amountVnd)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">Ngày tạo</p><p className="mt-1 font-semibold text-slate-900">{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p></div>
              {selectedOrder.paidAt && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2"><p className="text-xs text-slate-500">Ngày thanh toán</p><p className="mt-1 font-semibold text-slate-900">{new Date(selectedOrder.paidAt).toLocaleString("vi-VN")}</p></div>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <CosmicButton variant="secondary" onClick={() => setSelectedOrder(null)}>
                Đóng
              </CosmicButton>
              {selectedOrder.status === "PENDING" && (
                <>
                  <CosmicButton
                    variant="secondary"
                    onClick={() =>
                      askConfirm({
                        title: "Hủy đơn hàng?",
                        description: "Bạn có chắc muốn hủy thanh toán đơn hàng này không?",
                        confirmLabel: "Hủy đơn",
                        cancelLabel: "Quay lại",
                        type: "danger",
                        onConfirm: async () => {
                          await handleCancelPayment(selectedOrder.id);
                          setSelectedOrder(null);
                        },
                      })
                    }
                  >
                    Hủy đơn
                  </CosmicButton>
                  <CosmicButton
                    onClick={() =>
                      askConfirm({
                        title: "Thanh toán đơn hàng?",
                        description: "Bạn sẽ được chuyển hướng đến giao diện thanh toán an toàn để hoàn tất giao dịch.",
                        confirmLabel: "Thanh toán ngay",
                        cancelLabel: "Hủy",
                        type: "info",
                        onConfirm: () => handlePayOS(selectedOrder),
                      })
                    }
                  >
                    Thanh toán ngay
                  </CosmicButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activePayment && (
        <PaymentModal
          payment={activePayment}
          onClose={() => setActivePayment(null)}
          onSuccess={async () => {
            showToast("Thanh toán thành công.", "success");
            setActivePayment(null);
            await loadBillingData();
          }}
          onCancel={handleCancelPayment}
          askConfirm={askConfirm}
        />
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
      {confirmState && (
        <ConfirmDialog
          open={!!confirmState}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </main>
  );
}
