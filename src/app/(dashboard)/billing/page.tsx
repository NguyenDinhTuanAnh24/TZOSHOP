"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import { 
  ReceiptText, 
  ShoppingCart, 
  CheckCircle2, 
  Clock3, 
  Wallet,
  CreditCard,
  Info,
  Plus
} from "lucide-react";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
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
    } catch {
      showToast("Không thể tải lịch sử thanh toán.", "error");
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
        body: JSON.stringify({ orderId: order.id })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error?.message ?? "Không thể tạo thanh toán.");
      
      // Open internal payment modal
      setActivePayment(result);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Không thể tạo thanh toán.", "error");
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
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Đã xảy ra lỗi", "error");
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



  return (
    <div className="space-y-10 pb-20">
      <PageHeader 
        title="Thanh toán" 
        description="Quản lý lịch sử nạp credits và trạng thái đơn hàng của bạn."
        icon={<CreditCard className="h-8 w-8" />}
        actions={
          <AppButton variant="accent" onClick={() => window.location.href = "/plans"}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Mua thêm credits
          </AppButton>
        }
      />

      {/* Stats */}
      {isLoading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-1.5 rounded-lg bg-[#fbfbf8] border border-[#edf1ee]">
                <ReceiptText className="h-5 w-5 text-[#8a9690]" />
              </div>
              <p className={ui.statLabel}>Tổng đơn hàng</p>
            </div>
            <p className={ui.statValue}>{stats.total}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-1.5 rounded-lg bg-[#e7fff7] border border-[#00d4a4]/20">
                <CheckCircle2 className="h-5 w-5 text-[#00d4a4]" />
              </div>
              <p className={ui.statLabel}>Đã thanh toán</p>
            </div>
            <p className={cn(ui.statValue, "text-[#00d4a4]")}>{stats.paid}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-100">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
              <p className={ui.statLabel}>Chờ thanh toán</p>
            </div>
            <p className={ui.statValue}>{stats.pending}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-1.5 rounded-lg bg-[#fbfbf8] border border-[#edf1ee]">
                <Wallet className="h-5 w-5 text-[#8a9690]" />
              </div>
              <p className={ui.statLabel}>Tổng đã chi</p>
            </div>
            <p className={ui.statValue}>{formatCurrency(stats.totalSpent)}</p>
          </AppCard>
        </div>
      )}

      {/* List Section */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        {/* Orders List */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#00d4a4]" />
              <h2 className={ui.h3}>Lịch sử giao dịch</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Tất cả", "Đã thanh toán", "Chờ thanh toán", "Đã hủy"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f as "Tất cả" | "Đã thanh toán" | "Chờ thanh toán" | "Đã hủy")}
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
            <div className="rounded-[40px] border border-dashed border-[#dfe5e1] bg-[#fbfbf8] p-10 sm:p-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white border border-[#dfe5e1] text-[#8a9690] mb-6 shadow-sm">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className={ui.h3}>Bạn chưa có đơn hàng nào.</h3>
              <p className={ui.p}>Các đơn mua credits sẽ xuất hiện tại đây sau khi bạn chọn gói.</p>
              <div className="mt-8 flex justify-center">
                <AppButton variant="accent" onClick={() => window.location.href = "/plans"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Mua gói đầu tiên ngay
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <AppCard
                  key={order.id}
                  variant="interactive"
                  className="flex flex-col gap-6 sm:flex-row sm:items-center group"
                >
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={ui.label}>#{order.orderCode}</span>
                      <StatusBadge 
                        status={order.status === "PAID" ? "Đã thanh toán" : order.status === "PENDING" ? "Chờ thanh toán" : "Đã hủy/Hết hạn"} 
                        variant={order.status === "PAID" ? "success" : order.status === "PENDING" ? "warning" : "danger"} 
                      />
                    </div>
                    <div>
                      <h3 className={ui.h3}>{order.product.name}</h3>
                      <p className={cn(ui.pMuted, "font-bold uppercase tracking-tight")}>
                        {formatCredits(order.product.credits)} credits · {order.product.durationDays && order.product.durationDays > 0 ? `${order.product.durationDays} ngày` : "Dùng đến khi hết credits"} · {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 border-t border-[#edf1ee] pt-5 sm:border-none sm:pt-0 sm:text-right sm:justify-end">
                    <p className="text-xl font-black text-[#0b0f0d] whitespace-nowrap">{formatCurrency(order.amountVnd)}</p>
                    {order.status === "PENDING" && (
                      <div className="flex gap-2">
                        <AppButton 
                          onClick={() => askConfirm({
                            title: "Thanh toán đơn hàng?",
                            description: "Bạn sẽ được chuyển hướng đến giao diện thanh toán an toàn để hoàn tất giao dịch.",
                            confirmLabel: "Thanh toán ngay",
                            cancelLabel: "Hủy",
                            type: "info",
                            onConfirm: () => handlePayOS(order)
                          })}
                          size="sm"
                          variant="accent"
                        >
                          Nạp ngay
                        </AppButton>
                      </div>
                    )}
                  </div>
                </AppCard>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <AppCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-[#00d4a4]" />
              <h3 className={ui.h3}>Hướng dẫn</h3>
            </div>
            <div className="space-y-4 text-xs font-bold text-[#66736d] leading-6">
              <p>• <b className="text-[#0b0f0d]">Chờ thanh toán:</b> Đơn hàng vừa tạo, hãy hoàn tất thanh toán để nhận credits.</p>
              <p>• <b className="text-[#0b0f0d]">Đã thanh toán:</b> Gói đã được kích hoạt, hãy kiểm tra tại mục &quot;Gói của tôi&quot;.</p>
              <p>• <b className="text-[#0b0f0d]">Đã hủy:</b> Đơn hàng bị hết hạn hoặc bị hủy thủ công.</p>
            </div>
          </AppCard>
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
