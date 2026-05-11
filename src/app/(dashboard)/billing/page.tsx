"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import { 
  ReceiptText, 
  ShoppingCart, 
  CheckCircle2, 
  Clock3, 
  XCircle, 
  Wallet,
  ArrowRight,
  Filter,
  CreditCard,
  Info,
  Plus,
  Zap
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import Skeleton from "react-loading-skeleton";
import { StatCardsSkeleton, CardListSkeleton } from "@/components/ui/page-skeleton";

type ApiOrderStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatCredits(value: string) {
  const amount = Number(value);
  if (amount >= 1_000_000_000) return `${amount / 1_000_000_000}B`;
  if (amount >= 1_000_000) return `${amount / 1_000_000}M`;
  if (amount >= 1_000) return `${amount / 1_000}K`;
  return amount.toLocaleString("vi-VN");
}

function getStatusBadgeClass(status: ApiOrderStatus) {
  switch (status) {
    case "PAID": return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "PENDING": return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    default: return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }
}

function getStatusIcon(status: ApiOrderStatus) {
  switch (status) {
    case "PAID": return CheckCircle2;
    case "PENDING": return Clock3;
    default: return XCircle;
  }
}

import { PaymentModal } from "@/components/dashboard/payment-modal";

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

export default function BillingPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<"Tất cả" | "Đã thanh toán" | "Chờ thanh toán" | "Đã hủy">("Tất cả");
  const [activePayment, setActivePayment] = useState<PaymentData | null>(null);

  const { toast, showToast, clearToast } = useToast(3000);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const loadBillingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Không thể tải lịch sử đơn hàng.");
      setOrders(data.data ?? []);
    } catch (error) {
      showToast("Không thể tải lịch sử thanh toán.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handlePayOS = async (order: ApiOrder) => {
    try {
      const res = await fetch(`/api/payments/payos/create`, { 
        method: "POST",
        body: JSON.stringify({ orderId: order.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error?.message ?? "Không thể tạo thanh toán.");
      
      // Open internal payment modal
      setActivePayment(result);
    } catch (error: any) {
      showToast(error.message || "Không thể tạo thanh toán.", "error");
    }
  };

  const handleCancelPayment = async (orderId: string) => {
    try {
      const res = await fetch(`/api/payments/payos/cancel`, {
        method: "POST",
        body: JSON.stringify({ orderId })
      });
      if (!res.ok) throw new Error("Không thể hủy thanh toán.");
      
      showToast("Đã hủy thanh toán.", "success");
      setActivePayment(null);
      await loadBillingData();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleMockPay = async (order: ApiOrder) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/mock-pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Không thể xử lý thanh toán.");
      showToast("Thanh toán thành công.", "success");
      await loadBillingData();
    } catch (error) {
      showToast("Không thể thực hiện thanh toán.", "error");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedFilter === "Tất cả") return true;
      if (selectedFilter === "Đã thanh toán") return o.status === "PAID";
      if (selectedFilter === "Chờ thanh toán") return o.status === "PENDING";
      return o.status === "CANCELLED" || o.status === "EXPIRED";
    });
  }, [orders, selectedFilter]);

  const stats = useMemo(() => {
    const paid = orders.filter(o => o.status === "PAID");
    const pending = orders.filter(o => o.status === "PENDING");
    const totalSpent = paid.reduce((sum, o) => sum + o.amountVnd, 0);
    return { total: orders.length, paid: paid.length, pending: pending.length, totalSpent };
  }, [orders]);

  const btnPrimary = "rounded-full bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2.5 text-sm font-bold transition-all flex items-center gap-2";
  const btnSecondary = "rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2 text-sm font-bold transition-all flex items-center gap-2";

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <AppIcon icon={CreditCard} className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Thanh toán</h1>
            <p className="mt-1 text-slate-500 font-medium">Quản lý lịch sử nạp credits và trạng thái đơn hàng của bạn.</p>
          </div>
        </div>
        <Link href="/plans" className={btnPrimary}>
          <AppIcon icon={ShoppingCart} className="h-4 w-4" />
          Mua thêm credits
        </Link>
      </div>

      {/* Stats */}
      {isLoading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                <AppIcon icon={ReceiptText} className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng đơn hàng</p>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <AppIcon icon={CheckCircle2} className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đã thanh toán</p>
            </div>
            <p className="text-3xl font-black text-emerald-600">{stats.paid}</p>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AppIcon icon={Clock3} className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chờ thanh toán</p>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.pending}</p>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                <AppIcon icon={Wallet} className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng đã chi</p>
            </div>
            <p className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalSpent)}</p>
          </div>
        </div>
      )}

      {/* List Section */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        {/* Orders List */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AppIcon icon={CreditCard} className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-black text-slate-900">Lịch sử giao dịch</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Tất cả", "Đã thanh toán", "Chờ thanh toán", "Đã hủy"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f as any)}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedFilter === f ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <CardListSkeleton count={3} />
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-[40px] border border-dashed border-slate-300 bg-slate-50/50 p-10 sm:p-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 mb-6">
                <AppIcon icon={CreditCard} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Bạn chưa có đơn hàng nào.</h3>
              <p className="mt-2 text-slate-500 font-medium">Các đơn mua credits sẽ xuất hiện tại đây sau khi bạn chọn gói.</p>
              <div className="mt-8 flex justify-center">
                <Link href="/plans" className={btnPrimary}>
                  <Plus className="h-4 w-4" />
                  Mua gói đầu tiên ngay
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  className="group relative flex flex-col gap-6 rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 sm:flex-row sm:items-center"
                >
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] font-black text-slate-400 uppercase">#{order.orderCode}</span>
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeClass(order.status)}`}>
                        <AppIcon icon={getStatusIcon(order.status)} className="h-3.5 w-3.5" />
                        {order.status === "PAID" ? "Đã thanh toán" : order.status === "PENDING" ? "Chờ thanh toán" : "Đã hủy/Hết hạn"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 truncate">{order.product.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tight line-clamp-1">
                        {formatCredits(order.product.credits)} credits · {order.product.durationDays} ngày · {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 border-t border-slate-50 pt-5 sm:border-none sm:pt-0 sm:text-right sm:justify-end">
                    <p className="text-xl font-black text-slate-900 whitespace-nowrap">{formatCurrency(order.amountVnd)}</p>
                    {order.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => askConfirm({
                            title: "Thanh toán đơn hàng?",
                            description: "Bạn sẽ được chuyển sang cổng thanh toán PayOS để hoàn tất giao dịch.",
                            confirmLabel: "Thanh toán ngay",
                            cancelLabel: "Hủy",
                            type: "info",
                            onConfirm: () => handlePayOS(order)
                          })}
                          className={btnPrimary + " h-10 px-6"}
                        >
                          Nạp ngay
                        </button>
                        

                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <AppIcon icon={Info} className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-900">Hướng dẫn</h3>
            </div>
            <div className="space-y-4 text-xs font-bold text-slate-500 leading-6">
              <p>• <b>Chờ thanh toán:</b> Đơn hàng vừa tạo, hãy hoàn tất thanh toán để nhận credits.</p>
              <p>• <b>Đã thanh toán:</b> Gói đã được kích hoạt, hãy kiểm tra tại mục "Gói của tôi".</p>
              <p>• <b>Đã hủy:</b> Đơn hàng bị hết hạn hoặc bị hủy thủ công.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Payment Modal */}
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

      {/* Toast & Confirm */}
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
    </div>
  );
}
