"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Info,
  Plus,
  ReceiptText,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  SearchCheck,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { AppButton } from "@/components/ui/app-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { BillingPageSkeleton } from "@/components/dashboard/billing/billing-page-skeleton";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";

type ApiOrderStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
type BillingFilter = "Tất cả" | "Đã thanh toán" | "Chờ thanh toán" | "Đã hủy" | "Hết hạn";

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

const FILTERS: BillingFilter[] = ["Tất cả", "Đã thanh toán", "Chờ thanh toán", "Đã hủy", "Hết hạn"];

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function formatCredits(value: string) {
  const amount = Number(value);
  if (amount >= 1_000_000_000) return `${amount / 1_000_000_000}B`;
  if (amount >= 1_000_000) return `${amount / 1_000_000}M`;
  if (amount >= 1_000) return `${amount / 1_000}K`;
  return amount.toLocaleString("vi-VN");
}

function getStatusMeta(status: ApiOrderStatus) {
  if (status === "PAID") return { label: "Đã thanh toán", variant: "success" as const };
  if (status === "PENDING") return { label: "Chờ thanh toán", variant: "warning" as const };
  if (status === "CANCELLED") return { label: "Đã hủy", variant: "danger" as const };
  return { label: "Hết hạn", variant: "info" as const };
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: BillingFilter;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "min-h-9 border-2 border-black px-3 py-2 text-[10px] font-black uppercase tracking-wide text-black transition-all duration-100 ease-linear focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        active
          ? "bg-[#FFD93D] shadow-[2px_2px_0px_0px_#000]"
          : "bg-[#FFFDF5] hover:-translate-y-0.5 hover:bg-[#FFD93D]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function BillingHero() {
  return (
    <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[5px_5px_0px_0px_#000]">
            <CreditCard className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">THANH TOÁN</h2>
            <p className="mt-2 text-sm font-bold text-black/70 md:text-base">
              Quản lý lịch sử nạp credits và trạng thái đơn hàng của bạn.
            </p>
          </div>
        </div>
        <AppButton
          variant="accent"
          className="h-12 w-full px-6 md:w-auto"
          onClick={() => {
            window.location.href = "/plans";
          }}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Mua thêm credits
        </AppButton>
      </div>
    </section>
  );
}

export default function BillingPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<BillingFilter>("Tất cả");
  const [activePayment, setActivePayment] = useState<PaymentData | null>(null);

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
      const message = "Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu lỗi tiếp tục xảy ra.";
      setLoadError(message);
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
      showToast(error instanceof Error ? error.message : "Đã xảy ra lỗi", "error");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedFilter === "Tất cả") return true;
      if (selectedFilter === "Đã thanh toán") return order.status === "PAID";
      if (selectedFilter === "Chờ thanh toán") return order.status === "PENDING";
      if (selectedFilter === "Đã hủy") return order.status === "CANCELLED";
      return order.status === "EXPIRED";
    });
  }, [orders, selectedFilter]);

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.status === "PAID");
    const pending = orders.filter((order) => order.status === "PENDING");
    const totalSpent = paid.reduce((sum, order) => sum + order.amountVnd, 0);
    return { totalOrders: orders.length, paidOrders: paid.length, pendingOrders: pending.length, totalSpent };
  }, [orders]);

  return (
    <main className="px-5 py-6 lg:px-8 lg:py-8" aria-busy={isLoading}>
      <div className="space-y-8 lg:space-y-10">
        <BillingHero />

        {isLoading ? (
          <BillingPageSkeleton />
        ) : (
          <div className="space-y-8">
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <article className="min-h-[120px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black">Tổng đơn hàng</p>
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_#000]"><ReceiptText className="h-5 w-5" /></div>
                </div>
                <p className="mt-5 text-3xl font-black leading-none text-black">{stats.totalOrders}</p>
                <p className="mt-2 text-xs font-bold uppercase text-black/70">Tất cả giao dịch</p>
              </article>

              <article className="min-h-[120px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black">Đã thanh toán</p>
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#C7F0D8] text-black shadow-[2px_2px_0px_0px_#000]"><CheckCircle2 className="h-5 w-5" /></div>
                </div>
                <p className="mt-5 text-3xl font-black leading-none text-black">{stats.paidOrders}</p>
                <p className="mt-2 text-xs font-bold uppercase text-black/70">Hoàn tất</p>
              </article>

              <article className="min-h-[120px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black">Chờ thanh toán</p>
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#A78BFA] text-black shadow-[2px_2px_0px_0px_#000]"><Clock3 className="h-5 w-5" /></div>
                </div>
                <p className="mt-5 text-3xl font-black leading-none text-black">{stats.pendingOrders}</p>
                <p className="mt-2 text-xs font-bold uppercase text-black/70">Cần xử lý</p>
              </article>

              <article className="min-h-[120px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black">Tổng đã chi</p>
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FF6B6B] text-black shadow-[2px_2px_0px_0px_#000]"><Wallet className="h-5 w-5" /></div>
                </div>
                <p className="mt-5 text-3xl font-black leading-none text-black">{formatCurrency(stats.totalSpent)}</p>
                <p className="mt-2 text-xs font-bold uppercase text-black/70">Đã thanh toán</p>
              </article>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_300px]">
              <section className="space-y-5">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#C7F0D8] text-black shadow-[2px_2px_0px_0px_#000]">
                      <ReceiptText className="h-4 w-4" />
                    </div>
                    <h2 className="text-xl font-black uppercase text-black md:text-2xl">Lịch sử giao dịch</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FILTERS.map((filter) => (
                      <FilterChip
                        key={filter}
                        label={filter}
                        active={selectedFilter === filter}
                        onClick={() => setSelectedFilter(filter)}
                      />
                    ))}
                  </div>
                </header>

                {loadError ? (
                  <div className="border-4 border-black bg-[#FF6B6B] p-6 text-black shadow-[8px_8px_0px_0px_#000]">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
                      <div>
                        <h3 className="text-xl font-black uppercase">Không thể tải lịch sử giao dịch</h3>
                        <p className="mt-2 text-sm font-bold text-black/80">{loadError}</p>
                        <AppButton variant="secondary" className="mt-5 h-11" onClick={() => void loadBillingData()}>
                          THỬ LẠI
                        </AppButton>
                      </div>
                    </div>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-8 text-center shadow-[8px_8px_0px_0px_#000] md:p-10">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[5px_5px_0px_0px_#000]">
                      <CreditCard className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-black md:text-2xl">Bạn chưa có đơn hàng nào</h3>
                    <p className="mt-3 max-w-[520px] text-sm font-bold text-black/70 md:text-base">
                      Các đơn mua credits sẽ xuất hiện tại đây sau khi bạn chọn gói.
                    </p>
                    <AppButton
                      variant="accent"
                      className="mt-6 h-12 px-6 md:px-8"
                      onClick={() => {
                        window.location.href = "/plans";
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Mua gói đầu tiên ngay
                    </AppButton>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-hidden border-4 border-black bg-[#FFFDF5] shadow-[8px_8px_0px_0px_#000] lg:block">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                          <thead>
                            <tr className="border-b-4 border-black bg-[#FFD93D] text-left text-xs font-black uppercase tracking-wide text-black">
                              <th className="px-4 py-3">Mã đơn</th>
                              <th className="px-4 py-3">Gói credits</th>
                              <th className="px-4 py-3">Số tiền</th>
                              <th className="px-4 py-3">Trạng thái</th>
                              <th className="px-4 py-3">Ngày tạo</th>
                              <th className="px-4 py-3">Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.map((order) => {
                              const statusMeta = getStatusMeta(order.status);
                              return (
                                <tr key={order.id} className="border-b-2 border-black font-bold text-black transition-colors hover:bg-[#FFF7CC]">
                                  <td className="px-4 py-4 text-sm font-black">#{order.orderCode}</td>
                                  <td className="px-4 py-4 text-sm">
                                    <p className="font-black text-black">{order.product.name}</p>
                                    <p className="text-xs font-bold text-black/70">
                                      {formatCredits(order.product.credits)} credits · {order.product.durationDays > 0 ? `${order.product.durationDays} ngày` : "Dùng đến khi hết credits"}
                                    </p>
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-lg font-black">{formatCurrency(order.amountVnd)}</td>
                                  <td className="px-4 py-4">
                                    <StatusBadge status={statusMeta.label} variant={statusMeta.variant} />
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-sm">{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                                  <td className="px-4 py-4">
                                    {order.status === "PENDING" ? (
                                      <div className="flex flex-wrap gap-2">
                                        <AppButton
                                          variant="accent"
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
                                          Thanh toán tiếp
                                        </AppButton>
                                      </div>
                                    ) : (
                                      <span className="text-xs font-black uppercase text-black/70">Đã hoàn tất</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:hidden">
                      {filteredOrders.map((order) => {
                        const statusMeta = getStatusMeta(order.status);
                        return (
                          <article key={order.id} className="space-y-3 border-4 border-black bg-[#FFFDF5] p-5 shadow-[5px_5px_0px_0px_#000]">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-black">#{order.orderCode}</p>
                                <p className="text-xs font-bold text-black/70">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
                              </div>
                              <StatusBadge status={statusMeta.label} variant={statusMeta.variant} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-black">{order.product.name}</p>
                              <p className="text-xs font-bold text-black/70">
                                {formatCredits(order.product.credits)} credits · {order.product.durationDays > 0 ? `${order.product.durationDays} ngày` : "Dùng đến khi hết credits"}
                              </p>
                            </div>
                            <p className="text-xl font-black text-black">{formatCurrency(order.amountVnd)}</p>
                            {order.status === "PENDING" ? (
                              <AppButton
                                variant="accent"
                                className="h-10"
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
                                Thanh toán tiếp
                              </AppButton>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>

              <aside className="border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] xl:sticky xl:top-24">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_#000]">
                    <Info className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-black uppercase text-black">Hướng dẫn</h3>
                </div>
                <div className="space-y-3 text-sm font-bold leading-relaxed text-black/75">
                  <p>
                    <span className="font-black text-black">Chờ thanh toán:</span> đơn đã tạo nhưng chưa hoàn tất thanh toán.
                  </p>
                  <p>
                    <span className="font-black text-black">Đã thanh toán:</span> credits đã được cộng vào tài khoản.
                  </p>
                  <p>
                    <span className="font-black text-black">Đã hủy:</span> đơn không còn hiệu lực.
                  </p>
                  <p>
                    Nếu đã thanh toán nhưng chưa thấy credits, hãy dùng nút <span className="font-black text-black">Kiểm tra thanh toán</span> hoặc liên hệ hỗ trợ.
                  </p>
                </div>
                <AppButton
                  variant="secondary"
                  className="mt-5 h-10"
                  onClick={() => {
                    window.location.href = "/support";
                  }}
                >
                  <SearchCheck className="mr-2 h-4 w-4" />
                  Kiểm tra thanh toán
                </AppButton>
              </aside>
            </div>
          </div>
        )}
      </div>

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
