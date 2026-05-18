"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, RefreshCw, TicketPercent, WalletCards } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";

type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscountVnd: number | null;
  endsAt: string | null;
};

type Plan = { id: string; name: string; priceVnd: number };

type CouponStatus = "available" | "expiring" | "used" | "expired";
type FilterStatus = "all" | "available" | "used" | "expired";

type CouponView = Coupon & {
  source: "available" | "used";
  status: CouponStatus;
};

const EXPIRING_DAYS = 7;

function formatVnd(val: number) {
  return `${new Intl.NumberFormat("vi-VN").format(val)}đ`;
}

function getStatusClass(status: CouponStatus) {
  if (status === "available") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (status === "expiring") return "bg-amber-50 text-amber-700 border border-amber-100";
  if (status === "used") return "bg-slate-100 text-slate-600 border border-slate-200";
  return "bg-rose-50 text-rose-700 border border-rose-100";
}

function getStatusLabel(status: CouponStatus) {
  if (status === "available") return "Khả dụng";
  if (status === "expiring") return "Sắp hết hạn";
  if (status === "used") return "Đã sử dụng";
  return "Hết hạn";
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
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

function CouponsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-64 rounded-xl bg-slate-100" />
          <div className="h-5 w-full max-w-xl rounded-xl bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-8 w-20 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
            <div className="h-6 w-36 rounded bg-slate-100" />
            <div className="mt-3 h-4 w-28 rounded bg-slate-100" />
            <div className="mt-6 h-10 w-full rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<{ available: Coupon[]; used: Coupon[] }>({ available: [], used: [] });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const [couponCode, setCouponCode] = useState("");
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    valid: boolean;
    message: string;
    discountAmount?: number;
    finalAmount?: number;
    originalAmount?: number;
  } | null>(null);

  const { toast, showToast, clearToast } = useToast(3000);
  const [nowTs] = useState(() => Date.now());

  const loadCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      const [couponRes, planRes] = await Promise.all([
        fetch("/api/coupons/my", { cache: "no-store" }),
        fetch("/api/plans", { cache: "no-store" }),
      ]);

      const couponJson = await couponRes.json();
      if (!couponRes.ok || !couponJson.success) throw new Error("load_coupon_failed");
      setCoupons(couponJson.data);

      const planJson = await planRes.json();
      if (planRes.ok) {
        const rawPlans = (planJson.data ?? []) as Plan[];
        setPlans(rawPlans.filter((p) => typeof p?.id === "string"));
      }
    } catch {
      setHasError(true);
      showToast("Không thể tải mã giảm giá.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCoupons();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCoupons]);

  const normalizedCoupons = useMemo<CouponView[]>(() => {
    const now = nowTs;

    const availableItems: CouponView[] = coupons.available.map((coupon) => {
      if (!coupon.endsAt) {
        return { ...coupon, source: "available", status: "available" };
      }
      const endsAtTs = new Date(coupon.endsAt).getTime();
      if (endsAtTs < now) {
        return { ...coupon, source: "available", status: "expired" };
      }
      if (endsAtTs - now <= EXPIRING_DAYS * 24 * 60 * 60 * 1000) {
        return { ...coupon, source: "available", status: "expiring" };
      }
      return { ...coupon, source: "available", status: "available" };
    });

    const usedItems: CouponView[] = coupons.used.map((coupon) => ({ ...coupon, source: "used", status: "used" }));

    return [...availableItems, ...usedItems];
  }, [coupons.available, coupons.used, nowTs]);

  const filteredCoupons = useMemo(() => {
    if (statusFilter === "all") return normalizedCoupons;
    if (statusFilter === "available") return normalizedCoupons.filter((c) => c.status === "available" || c.status === "expiring");
    return normalizedCoupons.filter((c) => c.status === statusFilter);
  }, [normalizedCoupons, statusFilter]);

  const stats = useMemo(() => {
    const availableCount = normalizedCoupons.filter((c) => c.status === "available" || c.status === "expiring").length;
    const usedCount = normalizedCoupons.filter((c) => c.status === "used").length;
    const expiringCount = normalizedCoupons.filter((c) => c.status === "expiring").length;
    const totalDiscount = normalizedCoupons.reduce((sum, c) => sum + (c.maxDiscountVnd ?? 0), 0);
    return { availableCount, usedCount, expiringCount, totalDiscount };
  }, [normalizedCoupons]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Đã sao chép mã giảm giá", "success");
    } catch {
      showToast("Không thể sao chép mã", "error");
    }
  };

  const handleCheckCode = async () => {
    if (!couponCode.trim()) return;
    if (plans.length === 0) {
      setCheckResult({ valid: false, message: "Hiện chưa thể kiểm tra mã, vui lòng thử lại sau." });
      return;
    }

    try {
      setIsCheckingCode(true);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), productId: plans[0].id }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCheckResult({ valid: false, message: data?.message ?? "Mã không hợp lệ hoặc đã hết hạn" });
        return;
      }
      setCheckResult({
        valid: true,
        message: data?.message ?? "Mã có thể sử dụng",
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
        originalAmount: data.originalAmount,
      });
    } catch {
      setCheckResult({ valid: false, message: "Mã không hợp lệ hoặc đã hết hạn" });
    } finally {
      setIsCheckingCode(false);
    }
  };

  if (isLoading) {
    return (
      <main className="space-y-8" aria-busy="true">
        <CouponsSkeleton />
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-950">Không thể tải mã giảm giá</h2>
          <p className="mt-2 text-sm text-slate-600">Vui lòng thử lại sau ít phút.</p>
          <button
            type="button"
            onClick={() => void loadCoupons()}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <TextFadeInUp as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Mã giảm giá</h1>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Nhập mã ưu đãi, kiểm tra điều kiện áp dụng và theo dõi các mã còn hiệu lực.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CosmicButton href="/plans">Mua credits</CosmicButton>
            <CosmicButton href="/billing" variant="secondary">Thanh toán</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <TextFadeInUp as="section" delay={0.05} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Kiểm tra mã ưu đãi</h2>
        <p className="mt-1 text-sm text-slate-600">Nhập mã bạn có để kiểm tra giá trị và điều kiện sử dụng.</p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã giảm giá"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <CosmicButton
            type="button"
            onClick={handleCheckCode}
            disabled={!couponCode.trim() || isCheckingCode}
            className="w-full md:w-auto"
          >
            {isCheckingCode ? "Đang kiểm tra..." : "Kiểm tra mã"}
          </CosmicButton>
        </div>

        {checkResult && (
          <div
            className={cn(
              "mt-4 rounded-2xl border p-4",
              checkResult.valid ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"
            )}
          >
            {checkResult.valid ? (
              <>
                <p className="font-semibold text-emerald-700">Mã có thể sử dụng</p>
                <p className="mt-2 text-sm text-slate-700">Giá trị giảm: {formatVnd(checkResult.discountAmount ?? 0)}</p>
                <p className="text-sm text-slate-700">Giá trị đơn tham chiếu: {formatVnd(checkResult.originalAmount ?? 0)}</p>
                <p className="text-sm text-slate-700">Tạm tính sau giảm: {formatVnd(checkResult.finalAmount ?? 0)}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-rose-700">Mã không hợp lệ hoặc đã hết hạn</p>
                <p className="mt-1 text-sm text-slate-700">Vui lòng kiểm tra lại mã hoặc thử mã khác.</p>
              </>
            )}
          </div>
        )}
      </TextFadeInUp>

      <TextFadeInUp as="section" delay={0.1} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Mã đang khả dụng", value: String(stats.availableCount), icon: TicketPercent, iconClass: "bg-indigo-50 text-indigo-600" },
          { label: "Mã đã sử dụng", value: String(stats.usedCount), icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-600" },
          { label: "Mã sắp hết hạn", value: String(stats.expiringCount), icon: AlertCircle, iconClass: "bg-amber-50 text-amber-600" },
          { label: "Tổng ưu đãi đã nhận", value: formatVnd(stats.totalDiscount), icon: WalletCards, iconClass: "bg-violet-50 text-violet-600" },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", item.iconClass)}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{item.value}</p>
          </article>
        ))}
      </TextFadeInUp>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Tất cả</FilterChip>
          <FilterChip active={statusFilter === "available"} onClick={() => setStatusFilter("available")}>Khả dụng</FilterChip>
          <FilterChip active={statusFilter === "used"} onClick={() => setStatusFilter("used")}>Đã sử dụng</FilterChip>
          <FilterChip active={statusFilter === "expired"} onClick={() => setStatusFilter("expired")}>Hết hạn</FilterChip>
        </div>
      </section>

      {normalizedCoupons.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <TicketPercent className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-950">Bạn chưa có mã giảm giá nào</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            Các mã ưu đãi khả dụng sẽ hiển thị tại đây khi TzoShop có chương trình khuyến mãi.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CosmicButton href="/plans">Mua credits</CosmicButton>
            <CosmicButton href="/billing" variant="secondary">Theo dõi thanh toán</CosmicButton>
          </div>
        </section>
      ) : filteredCoupons.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-xl font-bold text-slate-950">Không có mã phù hợp bộ lọc</h3>
          <p className="mt-2 text-sm text-slate-600">Hãy thử đổi trạng thái lọc để xem thêm mã giảm giá.</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCoupons.map((coupon) => {
            const isDisabled = coupon.status === "used" || coupon.status === "expired";
            return (
              <article
                key={coupon.id}
                className={cn(
                  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]",
                  isDisabled && "opacity-75"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-extrabold tracking-tight text-slate-950">{coupon.code}</p>
                    <p className="mt-1 text-sm text-slate-600">{coupon.name}</p>
                  </div>
                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getStatusClass(coupon.status))}>
                    {getStatusLabel(coupon.status)}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Giá trị giảm</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">Giảm {coupon.discountPercent}%</p>
                  {coupon.maxDiscountVnd ? (
                    <p className="mt-1 text-xs text-slate-600">Tối đa {formatVnd(coupon.maxDiscountVnd)}</p>
                  ) : null}
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <p>Đơn tối thiểu: <span className="font-semibold text-slate-900">{formatVnd(coupon.minOrderAmount)}</span></p>
                  <p>
                    {coupon.endsAt
                      ? `Hết hạn vào ${format(new Date(coupon.endsAt), "dd/MM/yyyy", { locale: vi })}`
                      : "Không giới hạn thời hạn"}
                  </p>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyCode(coupon.code)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
                  >
                    <Copy className="h-4 w-4" /> Sao chép mã
                  </button>
                  <Link
                    href="/plans"
                    aria-disabled={isDisabled}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
                      isDisabled
                        ? "pointer-events-none border border-slate-200 bg-slate-100 text-slate-400"
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 !text-white hover:-translate-y-0.5 active:scale-[0.98]"
                    )}
                  >
                    Dùng ngay
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
