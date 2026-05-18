"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, Eye, RefreshCw, Search, ShoppingCart, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { getAiLineFromProductSlug, getAiLineLabelFromApiFamily, getAiLineLabelFromSlug, type AiLine } from "@/lib/ai-line";

type OrderItem = {
  id: string;
  orderCode: string;
  amountVnd: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  isCreditsGranted: boolean;
  creditBucketId?: string;
  user: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    slug?: string;
    apiFamily: string;
  };
  couponCode?: string;
  discountAmount?: number;
};

type StatusFilter = "ALL" | "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
type FamilyFilter = "ALL" | AiLine;
type TimeFilter = "ALL" | "TODAY" | "7D" | "30D" | "MONTH";
type SortFilter = "NEWEST" | "OLDEST" | "PRICE_HIGH" | "PRICE_LOW";

function statusLabel(status: string) {
  if (status === "PENDING") return "Chờ thanh toán";
  if (status === "PAID") return "Đã thanh toán";
  if (status === "CANCELLED") return "Đã hủy";
  if (status === "EXPIRED") return "Hết hạn";
  return "Đang xử lý";
}

function statusClass(status: string) {
  if (status === "PAID") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "border-amber-100 bg-amber-50 text-amber-700";
  if (status === "CANCELLED") return "border-rose-100 bg-rose-50 text-rose-700";
  if (status === "EXPIRED") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-indigo-100 bg-indigo-50 text-indigo-700";
}

function familyClass(family: string) {
  const f = family.toUpperCase();
  if (f === "CODEXAI") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (f === "CLAUDE") return "border-orange-100 bg-orange-50 text-orange-700";
  if (f === "GEMINI") return "border-sky-100 bg-sky-50 text-sky-700";
  if (f === "DEEPSEEK") return "border-violet-100 bg-violet-50 text-violet-700";
  if (f === "ALL MODELS" || f === "ALL_MODELS") return "border-purple-100 bg-purple-50 text-purple-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getDisplayAiFamily(product?: { slug?: string; apiFamily: string }) {
  if (!product) return "N/A";
  if (product.slug) return getAiLineLabelFromSlug(product.slug);
  return getAiLineLabelFromApiFamily(product.apiFamily);
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || "K").trim();
  return source[0]?.toUpperCase() || "K";
}

function OrdersSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="mt-4 h-10 w-52 rounded-xl" />
        <Skeleton className="mt-3 h-5 w-[620px] max-w-full rounded-full" />
      </section>
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="mt-5 h-4 w-28 rounded-full" />
            <Skeleton className="mt-3 h-8 w-32 rounded-xl" />
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <Skeleton className="h-11 w-full rounded-xl" />
      </section>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [familyFilter, setFamilyFilter] = useState<FamilyFilter>("ALL");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");
  const [sortFilter, setSortFilter] = useState<SortFilter>("NEWEST");
  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error();
      setOrders(result.data || []);
    } catch {
      setLoadError("Vui lòng thử lại sau ít phút.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchOrders(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast("Đã cập nhật trạng thái đơn hàng.", "success");
      void fetchOrders();
    } else showToast("Không thể cập nhật trạng thái.", "error");
  };

  const handleVerifyPayment = async (orderId: string) => {
    showToast("Đang kiểm tra thanh toán...", "info");
    const res = await fetch(`/api/admin/orders/${orderId}/verify`, { method: "POST" });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast(result.message || "Đã kiểm tra thanh toán.", result.status === "PAID" ? "success" : "info");
      void fetchOrders();
    } else showToast(result.message || "Lỗi kiểm tra thanh toán.", "error");
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const list = orders
      .filter((o) => {
        const kw = search.trim().toLowerCase();
        if (!kw) return true;
        return (
          o.orderCode.toLowerCase().includes(kw) ||
          o.user.email.toLowerCase().includes(kw) ||
          (o.product?.name || "").toLowerCase().includes(kw)
        );
      })
      .filter((o) => (statusFilter === "ALL" ? true : o.status === statusFilter))
      .filter((o) => {
        if (familyFilter === "ALL") return true;
        const line = o.product?.slug ? getAiLineFromProductSlug(o.product.slug) : null;
        return line === familyFilter;
      })
      .filter((o) => {
        if (timeFilter === "ALL") return true;
        const createdAt = new Date(o.createdAt).getTime();
        if (timeFilter === "TODAY") {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          return createdAt >= today;
        }
        if (timeFilter === "7D") return createdAt >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
        if (timeFilter === "30D") return createdAt >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return createdAt >= startMonth;
      });

    if (sortFilter === "OLDEST") return [...list].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    if (sortFilter === "PRICE_HIGH") return [...list].sort((a, b) => b.amountVnd - a.amountVnd);
    if (sortFilter === "PRICE_LOW") return [...list].sort((a, b) => a.amountVnd - b.amountVnd);
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [orders, search, statusFilter, familyFilter, timeFilter, sortFilter]);

  const summary = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.status === "PAID").length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const totalRevenue = orders.reduce((acc, o) => (o.status === "PAID" ? acc + o.amountVnd : acc), 0);
    return { total, paid, pending, totalRevenue };
  }, [orders]);

  if (isLoading && !orders.length) return <OrdersSkeleton />;

  if (loadError && !orders.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải danh sách đơn hàng</h2>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Thử lại
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-1">
      <TextFadeInUp as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Quản trị đơn hàng</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Đơn hàng</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Quản lý đơn hàng, trạng thái thanh toán, gói credits và lịch sử mua hàng của người dùng.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <CosmicButton href="/admin/revenue" className="min-w-[140px]">Doanh thu</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng đơn hàng", value: summary.total.toLocaleString("vi-VN"), desc: "Tất cả đơn mua credits", icon: ShoppingCart, cls: "bg-indigo-50 text-indigo-700" },
          { label: "Đã thanh toán", value: summary.paid.toLocaleString("vi-VN"), desc: "Đơn hàng thanh toán thành công", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
          { label: "Chờ thanh toán", value: summary.pending.toLocaleString("vi-VN"), desc: "Đơn hàng đang chờ xử lý", icon: RefreshCw, cls: "bg-amber-50 text-amber-700" },
          { label: "Tổng doanh thu", value: formatVnd(summary.totalRevenue ?? 0), desc: "Doanh thu từ đơn đã thanh toán", icon: Wallet, cls: "bg-violet-50 text-violet-700" },
        ].map((card, i) => (
          <TextFadeInUp key={card.label} delay={Math.min(i * 0.05, 0.25)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", card.cls)}><card.icon className="h-5 w-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 break-words text-2xl font-extrabold text-slate-950">{card.value}</p>
            <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã đơn, email khách hàng hoặc tên gói..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="ALL">Tất cả</option><option value="PENDING">Chờ thanh toán</option><option value="PAID">Đã thanh toán</option><option value="CANCELLED">Đã hủy</option><option value="EXPIRED">Hết hạn</option></select>
          <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value as FamilyFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="ALL">Tất cả dòng AI</option><option value="ALL_MODELS">All Models</option><option value="CODEXAI">CodexAI</option><option value="CLAUDE">Claude</option><option value="GEMINI">Gemini</option><option value="DEEPSEEK">DeepSeek</option></select>
          <div className="grid grid-cols-2 gap-3"><select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as TimeFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="ALL">Tất cả</option><option value="TODAY">Hôm nay</option><option value="7D">7 ngày</option><option value="30D">30 ngày</option><option value="MONTH">Tháng này</option></select><select value={sortFilter} onChange={(e) => setSortFilter(e.target.value as SortFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="NEWEST">Mới nhất</option><option value="OLDEST">Cũ nhất</option><option value="PRICE_HIGH">Giá cao</option><option value="PRICE_LOW">Giá thấp</option></select></div>
        </div>
      </TextFadeInUp>

      {filteredOrders.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><ShoppingCart className="h-7 w-7" /></div>
          <h2 className="text-2xl font-extrabold text-slate-950">Chưa có đơn hàng</h2>
          <p className="mt-2 text-sm text-slate-600">Đơn hàng mới sẽ hiển thị tại đây sau khi người dùng mua gói credits.</p>
          <div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => void fetchOrders()} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">Làm mới</button><Link href="/admin/revenue" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">Xem doanh thu</Link></div>
        </section>
      ) : (
        <>
          <TextFadeInUp as="section" delay={0.08} className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Đơn hàng</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Gói credits</th><th className="px-4 py-3">Dòng AI</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Ngày tạo</th><th className="px-4 py-3">Hành động</th></tr></thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 transition hover:bg-indigo-50/30">
                    <td className="px-4 py-3"><p className="font-semibold text-slate-900">#{order.orderCode}</p><p className="text-xs text-slate-400">{order.id}</p></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{getInitials(order.user.name, order.user.email)}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{order.user.name || "Khách hàng"}</p><p className="truncate text-sm text-slate-600">{order.user.email}</p></div></div></td>
                    <td className="px-4 py-3"><p className="truncate text-slate-900">{order.product?.name || "Không xác định"}</p></td>
                    <td className="px-4 py-3"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", familyClass(getDisplayAiFamily(order.product)))}>{getDisplayAiFamily(order.product)}</span></td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatVnd(order.amountVnd ?? 0)}</td>
                    <td className="px-4 py-3"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass(order.status))}>{statusLabel(order.status)}</span></td>
                    <td className="px-4 py-3 text-slate-600">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Link href={`/admin/orders/${order.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Eye className="h-4 w-4" /></Link>{order.status === "PENDING" ? <><button type="button" onClick={() => askConfirm({ title: "Kiểm tra thanh toán?", description: "Hệ thống sẽ kiểm tra trạng thái thanh toán mới nhất của đơn hàng.", confirmLabel: "Kiểm tra", type: "primary", onConfirm: async () => handleVerifyPayment(order.id) })} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Kiểm tra</button><button type="button" onClick={() => askConfirm({ title: "Đánh dấu đơn hàng đã thanh toán?", description: "Hệ thống sẽ kích hoạt gói credits cho người dùng. Hãy chỉ thực hiện khi đã xác nhận thanh toán.", confirmLabel: "Xác nhận thanh toán", type: "warning", onConfirm: async () => handleUpdateStatus(order.id, "PAID") })} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Duyệt</button><button type="button" onClick={() => askConfirm({ title: "Hủy đơn hàng này?", description: "Đơn hàng đang chờ thanh toán sẽ được chuyển sang trạng thái đã hủy. Hành động này không ảnh hưởng đến các đơn hàng khác.", confirmLabel: "Hủy đơn", type: "danger", onConfirm: async () => handleUpdateStatus(order.id, "CANCELLED") })} className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">Hủy</button></> : null}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TextFadeInUp>

          <TextFadeInUp as="section" delay={0.12} className="space-y-4 lg:hidden">
            {filteredOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-900">#{order.orderCode}</p><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass(order.status))}>{statusLabel(order.status)}</span></div>
                <p className="mt-2 truncate text-sm text-slate-700">{order.user.email}</p>
                <p className="mt-1 truncate text-sm text-slate-700">{order.product?.name || "Không xác định"}</p>
                <div className="mt-3 flex items-center gap-2"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", familyClass(getDisplayAiFamily(order.product)))}>{getDisplayAiFamily(order.product)}</span></div>
                <div className="mt-3 flex items-center justify-between text-sm"><span className="font-semibold text-slate-900">{formatVnd(order.amountVnd ?? 0)}</span><span className="text-slate-600">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</span></div>
                <div className="mt-4 flex flex-wrap gap-2"><Link href={`/admin/orders/${order.id}`} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Chi tiết</Link>{order.status === "PENDING" ? <><button type="button" onClick={() => askConfirm({ title: "Kiểm tra thanh toán?", description: "Hệ thống sẽ kiểm tra trạng thái thanh toán mới nhất của đơn hàng.", confirmLabel: "Kiểm tra", type: "primary", onConfirm: async () => handleVerifyPayment(order.id) })} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Kiểm tra thanh toán</button><button type="button" onClick={() => askConfirm({ title: "Hủy đơn hàng này?", description: "Đơn hàng đang chờ thanh toán sẽ được chuyển sang trạng thái đã hủy. Hành động này không ảnh hưởng đến các đơn hàng khác.", confirmLabel: "Hủy đơn", type: "danger", onConfirm: async () => handleUpdateStatus(order.id, "CANCELLED") })} className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">Hủy đơn</button></> : null}</div>
              </article>
            ))}
          </TextFadeInUp>
        </>
      )}

      {confirmState ? <ConfirmDialog open={Boolean(confirmState)} title={confirmState.title} description={confirmState.description} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} type={confirmState.type} isLoading={isConfirming} onConfirm={handleConfirm} onCancel={closeConfirm} /> : null}
      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </div>
  );
}
