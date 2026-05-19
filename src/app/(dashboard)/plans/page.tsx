"use client";


import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  KeyRound,
  RefreshCw,
  Search,
  Star,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TextFadeInUp } from "@/components/ui/text-fade-in-up";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { cn } from "@/lib/utils";
import { getAiLineFromProductSlug, getAiLineLabelFromApiFamily, getAiLineLabelFromSlug, type AiLine } from "@/lib/ai-line";
import { formatModelName } from "@/lib/model-display";
import {
  FilterBarSkeleton,
  PageHeaderSkeleton,
  PlanGridSkeleton,
} from "@/components/skeletons/dashboard-skeletons";

type ApiFamily = "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";

type ApiPlan = {
  id: string;
  name: string;
  slug: string;
  apiFamily: ApiFamily;
  tier: "Trial" | "Mini" | "Plus" | "Pro" | "Max" | "Ultra" | "Enterprise";
  credits: string;
  durationDays: number | null;
  priceVnd: number;
  apiKeyLimit: number;
  allowedModels: string[];
  allowedReasoning: string[];
  isPopular: boolean;
  isActive: boolean;
  isContactOnly?: boolean;
};

type UserCoupon = {
  id: string;
  code: string;
  name: string;
  discountPercent: number;
  minOrderAmount: number;
};

function getPlanFamilyLabel(plan: Pick<ApiPlan, "slug" | "apiFamily">) {
  return getAiLineFromProductSlug(plan.slug) ? getAiLineLabelFromSlug(plan.slug) : getAiLineLabelFromApiFamily(plan.apiFamily);
}

function formatCreditAmount(value: string) {
  const amount = Number(value);
  if (amount >= 1_000_000_000) return `${amount / 1_000_000_000}B`;
  if (amount >= 1_000_000) return `${amount / 1_000_000}M`;
  if (amount >= 1_000) return `${amount / 1_000}K`;
  return amount.toLocaleString("vi-VN");
}

function formatCreditsWithUnit(value: string | number) {
  const text = typeof value === "string" ? formatCreditAmount(value) : Number(value).toLocaleString("vi-VN");
  return `${text} credits`;
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function parseCreditsValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;

  const raw = value.toString().trim().toUpperCase().replace(/\s/g, "");
  const match = raw.match(/([\d.]+)(K|M|B)?/);
  if (!match) return 0;

  const num = Number.parseFloat(match[1]);
  if (Number.isNaN(num)) return 0;

  const unit = match[2];
  if (unit === "K") return num * 1_000;
  if (unit === "M") return num * 1_000_000;
  if (unit === "B") return num * 1_000_000_000;
  return num;
}

function getPlanCredits(plan: ApiPlan): number {
  return parseCreditsValue(plan.credits);
}

function isContactPlan(plan: ApiPlan) {
  const name = plan.name.toLowerCase();
  const tier = plan.tier.toLowerCase();
  return (
    plan.isContactOnly === true ||
    plan.priceVnd === null ||
    plan.priceVnd === 0 ||
    name.includes("enterprise") ||
    name.includes("custom") ||
    name.includes("liên hệ") ||
    tier.includes("enterprise") ||
    tier.includes("custom")
  );
}

function getPlanAudienceText(plan: ApiPlan) {
  const tier = plan.tier.toLowerCase();
  if (tier.includes("enterprise")) return "Dành cho nhu cầu lớn hoặc đội nhóm.";
  if (plan.slug.startsWith("all_models_")) return "Dùng chung toàn bộ model CodexAI, Claude, Gemini và DeepSeek trong một gói.";
  if (plan.apiFamily === "CODEXAI") return "Phù hợp lập trình, IDE và extension.";
  if (plan.apiFamily === "CLAUDE") return "Phù hợp viết nội dung, phân tích và xử lý văn bản.";
  if (plan.apiFamily === "GEMINI") return "Phù hợp đa nhiệm, tốc độ tốt và chi phí cân bằng.";
  if (plan.apiFamily === "DEEPSEEK") return "Phù hợp tối ưu chi phí khi dùng thường xuyên.";
  return "Phù hợp nhiều nhu cầu sử dụng khác nhau.";
}

function getDurationLabel(plan: ApiPlan) {
  if (plan.durationDays && plan.durationDays > 0) return `${plan.durationDays} ngày`;
  return "Dùng đến khi hết credits";
}

const durationTabs = [
  { label: "Tất cả", value: "all" },
  { label: "7 ngày", value: "7" },
  { label: "30 ngày", value: "30" },
  { label: "90 ngày", value: "90" },
  { label: "365 ngày", value: "365" },
];

const packageTypeTabs = [
  { label: "Tất cả", value: "all" },
  { label: "Trial 7 ngày", value: "trial" },
  { label: "1 tháng", value: "monthly" },
  { label: "3 tháng", value: "quarterly" },
  { label: "1 năm", value: "yearly" },
];

const sortOptions = [
  { label: "Giá thấp", value: "price-asc" },
  { label: "Giá cao", value: "price-desc" },
  { label: "Credits thấp", value: "credits-asc" },
  { label: "Credits cao", value: "credits-desc" },
  { label: "Thời hạn ngắn", value: "duration-asc" },
  { label: "Thời hạn dài", value: "duration-desc" },
];

const ITEMS_PER_PAGE = 6;
const MAX_VISIBLE_MODELS = 2;

const aiFamilies: Array<{
  id: AiLine;
  name: string;
  description: string;
  logoSrc: string;
}> = [
  {
    id: "ALL_MODELS",
    name: "All Models",
    description: "Dùng chung toàn bộ model trong một gói.",
    logoSrc: "/logos/gemini.svg",
  },
  {
    id: "CODEXAI",
    name: "CodexAI",
    description: "Phù hợp lập trình, IDE và extension.",
    logoSrc: "/logos/codexai.svg",
  },
  {
    id: "CLAUDE",
    name: "Claude",
    description: "Phù hợp viết nội dung, phân tích và xử lý văn bản.",
    logoSrc: "/logos/claude.svg",
  },
  {
    id: "GEMINI",
    name: "Gemini",
    description: "Phù hợp đa nhiệm, tốc độ tốt và chi phí cân bằng.",
    logoSrc: "/logos/gemini.svg",
  },
  {
    id: "DEEPSEEK",
    name: "DeepSeek",
    description: "Phù hợp tối ưu chi phí khi dùng thường xuyên.",
    logoSrc: "/logos/deepseek.svg",
  },
];

const cardClass =
  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 active:scale-[0.98]";

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 !text-white shadow-[0_10px_24px_-14px_rgba(79,70,229,0.55)]"
          : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
      )}
    >
      {children}
    </button>
  );
}

function PlansPageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <PlanGridSkeleton count={6} />
    </div>
  );
}

function PlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState("");
  const { toast, showToast, clearToast } = useToast(3000);

  const [selectedFamily, setSelectedFamily] = useState<AiLine>("ALL_MODELS");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [selectedPackageType, setSelectedPackageType] = useState("all");
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<ApiPlan | null>(null);
  const [isConfirmBuyOpen, setIsConfirmBuyOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [sortBy, setSortBy] = useState("price-asc");
  const [hasHandledProductQuery, setHasHandledProductQuery] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponData, setCouponData] = useState<{
    valid: boolean;
    discountAmount: number;
    finalAmount: number;
    message?: string;
    code?: string;
  } | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [myCoupons, setMyCoupons] = useState<UserCoupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setIsLoadingPlans(true);
      setPlansError("");
      const response = await fetch("/api/plans", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Lỗi tải gói credits.");
      setPlans(data.data ?? []);
    } catch {
      setPlansError("Không thể tải danh sách gói credits.");
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlans();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPlans]);

  useEffect(() => {
    if (hasHandledProductQuery || isLoadingPlans || plans.length === 0) return;
    const productIdFromPricing = searchParams.get("product");
    if (!productIdFromPricing) return;
    const targetPlan = plans.find((p) => p.id === productIdFromPricing);
    if (!targetPlan) return;
    const timer = window.setTimeout(() => {
      setSelectedFamily(getAiLineFromProductSlug(targetPlan.slug) ?? "ALL_MODELS");
      setCurrentPage(1);
      setSelectedPlanToBuy(targetPlan);
      setIsConfirmBuyOpen(true);
      setHasHandledProductQuery(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasHandledProductQuery, isLoadingPlans, plans, searchParams]);

    const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const line = getAiLineFromProductSlug(plan.slug);
      const matchesFamily = line === selectedFamily;
      const matchesDuration = selectedDuration === "all" || Number(plan.durationDays ?? 0) === Number(selectedDuration);
      const matchesPackageType =
        selectedPackageType === "all" ||
        (selectedPackageType === "trial" && plan.slug.endsWith("_trial")) ||
        (selectedPackageType === "monthly" && plan.slug.endsWith("_monthly")) ||
        (selectedPackageType === "quarterly" && plan.slug.endsWith("_quarterly")) ||
        (selectedPackageType === "yearly" && plan.slug.endsWith("_yearly"));

      return matchesFamily && matchesDuration && matchesPackageType;
    });
  }, [plans, selectedFamily, selectedDuration, selectedPackageType]);

    const sortedPlans = useMemo(() => {
    const plansCopy = [...filteredPlans];

    switch (sortBy) {
      case "price-asc":
        return plansCopy.sort((a, b) => Number(a.priceVnd ?? 0) - Number(b.priceVnd ?? 0));
      case "price-desc":
        return plansCopy.sort((a, b) => Number(b.priceVnd ?? 0) - Number(a.priceVnd ?? 0));
      case "credits-asc":
        return plansCopy.sort((a, b) => getPlanCredits(a) - getPlanCredits(b));
      case "credits-desc":
        return plansCopy.sort((a, b) => getPlanCredits(b) - getPlanCredits(a));
      case "duration-asc":
        return plansCopy.sort((a, b) => (a.durationDays ?? 0) - (b.durationDays ?? 0));
      case "duration-desc":
        return plansCopy.sort((a, b) => (b.durationDays ?? 0) - (a.durationDays ?? 0));
      default:
        return plansCopy;
    }
  }, [filteredPlans, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedPlans.length / ITEMS_PER_PAGE));
  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const paginatedPlans = useMemo(() => {
    return sortedPlans.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);
  }, [safeCurrentPage, sortedPlans]);

  function handleChoosePlan(plan: ApiPlan) {
    if (isContactPlan(plan)) {
      router.push("/support?type=custom-plan");
      return;
    }
    setSelectedPlanToBuy(plan);
    setCouponCode("");
    setCouponData(null);
    setIsConfirmBuyOpen(true);
  }

  const handleValidateCoupon = useCallback(async () => {
    if (!couponCode || !selectedPlanToBuy || isValidatingCoupon) return;
    try {
      setIsValidatingCoupon(true);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, productId: selectedPlanToBuy.id }),
      });
      const result = await res.json();
      setCouponData({
        valid: !!result.valid,
        discountAmount: result.discountAmount || 0,
        finalAmount: result.finalAmount || 0,
        message: result.message,
        code: result.code,
      });
      if (result.valid) showToast("Áp dụng mã giảm giá thành công!", "success");
      else showToast(result.message || "Mã giảm giá không hợp lệ.", "error");
    } catch {
      showToast("Lỗi kiểm tra mã giảm giá.", "error");
    } finally {
      setIsValidatingCoupon(false);
    }
  }, [couponCode, selectedPlanToBuy, isValidatingCoupon, showToast]);

  async function loadMyCoupons() {
    try {
      setIsLoadingCoupons(true);
      const res = await fetch("/api/coupons/my");
      const result = await res.json();
      if (result.success) setMyCoupons(result.data.available);
    } catch {
      showToast("Không thể tải kho mã.", "error");
    } finally {
      setIsLoadingCoupons(false);
    }
  }

  function handleSelectCoupon(code: string) {
    setCouponCode(code);
    setIsCouponModalOpen(false);
  }

  useEffect(() => {
    if (!couponCode || !isConfirmBuyOpen || couponData) return;
    const timer = window.setTimeout(() => {
      void handleValidateCoupon();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [couponCode, isConfirmBuyOpen, couponData, handleValidateCoupon]);

  async function handleConfirmBuyPlan() {
    if (!selectedPlanToBuy || isCreatingOrder) return;
    try {
      setIsCreatingOrder(true);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedPlanToBuy.id,
          couponCode: couponData?.valid ? couponData.code : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "Không thể tạo đơn hàng.");
      if (result.data?.freeOrder) {
        showToast("Mua gói thành công! Gói đã được kích hoạt.", "success");
        setIsConfirmBuyOpen(false);
        setSelectedPlanToBuy(null);
        if (result.data.creditBucketId) router.push(`/api-keys?bucketId=${result.data.creditBucketId}`);
        else router.push("/my-plans");
        return;
      }
      showToast("Đơn hàng đã được tạo.", "success");
      setIsConfirmBuyOpen(false);
      setSelectedPlanToBuy(null);
      router.push("/billing");
    } catch (error) {
      console.error(error);
      showToast("Không thể tạo đơn hàng.", "error");
    } finally {
      setIsCreatingOrder(false);
    }
  }

  return (
    <div className="space-y-8 overflow-x-hidden" aria-busy={isLoadingPlans}>

      {isLoadingPlans ? (
        <PlansPageSkeleton />
      ) : plansError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-950">Không thể tải danh sách gói</h3>
          <p className="mt-2 text-sm text-slate-600">Vui lòng thử lại sau ít phút.</p>
          <button onClick={loadPlans} className={`${secondaryBtnClass} mt-6`}>
            <RefreshCw className="mr-2 h-4 w-4" />Thử lại
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex gap-2 overflow-x-auto">
              {aiFamilies.map((family) => (
                <FilterChip key={family.id} active={selectedFamily === family.id} onClick={() => { setSelectedFamily(family.id); setCurrentPage(1); }}>
                  {family.name}
                </FilterChip>
              ))}
            </div>
</section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hiệu lực</p>
                <div className="flex flex-wrap gap-2">
                  {durationTabs.map((tab) => (
                    <FilterChip key={tab.value} active={selectedDuration === tab.value} onClick={() => { setSelectedDuration(tab.value); setCurrentPage(1); }}>
                      {tab.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Loại gói</p>
                <div className="flex flex-wrap gap-2">
                  {packageTypeTabs.map((tab) => (
                    <FilterChip key={tab.value} active={selectedPackageType === tab.value} onClick={() => { setSelectedPackageType(tab.value); setCurrentPage(1); }}>
                      {tab.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sắp xếp</p>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((opt) => (
                    <FilterChip key={opt.value} active={sortBy === opt.value} onClick={() => { setSortBy(opt.value); setCurrentPage(1); }}>
                      {opt.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {paginatedPlans.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              {filteredPlans.length === 0 ? (
                <>
                  <TextFadeInUp as="h3" className="text-xl font-bold text-slate-950">Chưa có gói credits phù hợp</TextFadeInUp>
                  <p className="mt-2 text-sm text-slate-600">Bạn có thể đổi bộ lọc hoặc quay lại sau khi TzoShop cập nhật thêm gói mới.</p>
                  <button type="button" onClick={() => { setSelectedFamily("ALL_MODELS"); setSelectedDuration("all"); setSelectedPackageType("all"); setCurrentPage(1); }} className={`${secondaryBtnClass} mt-6`}>
                    Quay về All Models
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Search className="h-7 w-7" />
                  </div>
                  <TextFadeInUp as="h3" className="text-xl font-bold text-slate-950">Không tìm thấy gói phù hợp</TextFadeInUp>
                  <p className="mt-2 text-sm text-slate-600">Hãy thử đổi bộ lọc để tìm gói phù hợp hơn.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {paginatedPlans.map((plan) => {
                  const modelCount = plan.allowedModels.length;
                  const visibleModels = plan.allowedModels.slice(0, MAX_VISIBLE_MODELS);
                  const hiddenCount = Math.max(0, modelCount - MAX_VISIBLE_MODELS);

                  return (
                    <article key={plan.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {getPlanFamilyLabel(plan)}
                        </span>
                        <div className="flex items-center gap-2">
                          {plan.isPopular && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              <Star className="h-3.5 w-3.5" /> Phổ biến
                            </span>
                          )}
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {plan.slug.endsWith("_trial")
                              ? "Trial 7 ngày"
                              : plan.slug.endsWith("_monthly")
                                ? "1 tháng"
                                : plan.slug.endsWith("_quarterly")
                                  ? "3 tháng"
                                  : plan.slug.endsWith("_yearly")
                                    ? "1 năm"
                                    : "Gói credits"}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-4 text-2xl font-extrabold text-slate-950">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{getPlanAudienceText(plan)}</p>

                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credits</p>
                        <p className="mt-1 text-3xl font-extrabold text-slate-950">{formatCreditsWithUnit(plan.credits)}</p>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-600">
                        <p className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" /> Thời hạn</span>
                          <span className="font-semibold text-slate-900">{getDurationLabel(plan)}</span>
                        </p>
                        <p className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <span className="inline-flex items-center gap-2"><KeyRound className="h-4 w-4 text-violet-500" /> API key</span>
                          <span className="font-semibold text-slate-900">{plan.apiKeyLimit} key</span>
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Models hỗ trợ</p>
                        <div className="mt-2 w-full rounded-xl border border-transparent p-1 text-left">
                          <div className="flex flex-wrap gap-2">
                            {visibleModels.map((m) => (
                              <span key={m} className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                {formatModelName(m)}
                              </span>
                            ))}
                            {hiddenCount > 0 && (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">+{hiddenCount} model</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-6 text-3xl font-extrabold text-slate-950">{isContactPlan(plan) ? "Liên hệ" : formatCurrency(plan.priceVnd)}</p>

                      <CosmicButton
                        onClick={() => handleChoosePlan(plan)}
                        disabled={plan.allowedModels.length === 0 && !isContactPlan(plan)}
                        className={cn("mt-4 w-full", plan.allowedModels.length === 0 && !isContactPlan(plan) && "grayscale")}
                      >
                        {isContactPlan(plan) ? "Liên hệ tư vấn" : "Mua gói"}
                      </CosmicButton>
                    </article>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={`${secondaryBtnClass} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={`${secondaryBtnClass} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Sau
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Trang {safeCurrentPage} / {totalPages}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isConfirmBuyOpen && selectedPlanToBuy && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.35)] sm:p-8">
            <h2 className="text-xl font-extrabold text-slate-950">Xác nhận mua gói</h2>
            <p className="mt-2 text-sm text-slate-600">
              {couponData?.valid && couponData.finalAmount === 0
                ? "Bạn đang sử dụng mã giảm giá 100%. Gói credits sẽ được kích hoạt ngay lập tức."
                : "Sau khi xác nhận, hệ thống sẽ tạo đơn hàng chờ thanh toán."}
            </p>

            <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>Gói: <b>{selectedPlanToBuy.name}</b></p>
              <p>Dòng AI: <b>{getPlanFamilyLabel(selectedPlanToBuy)}</b></p>
              <p>Credits: <b>{formatCreditsWithUnit(selectedPlanToBuy.credits)}</b></p>
              <p>Hiệu lực: <b>{selectedPlanToBuy.durationDays && selectedPlanToBuy.durationDays > 0 ? `${selectedPlanToBuy.durationDays} ngày` : "Không giới hạn"}</b></p>
              <p>API key: <b>{selectedPlanToBuy.apiKeyLimit} key</b></p>
              <p>Giá gốc: <b>{formatCurrency(selectedPlanToBuy.priceVnd)}</b></p>
              {couponData?.valid && <p>Giảm giá: <b>-{formatCurrency(couponData.discountAmount)}</b></p>}
              <p className="text-base">Tổng thanh toán: <b>{couponData?.valid ? formatCurrency(couponData.finalAmount) : formatCurrency(selectedPlanToBuy.priceVnd)}</b></p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mã giảm giá (nếu có)</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponData(null);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-indigo-50/30"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={!couponCode || isValidatingCoupon}
                  className={`${secondaryBtnClass} h-11 px-4 text-xs disabled:opacity-50`}
                >
                  {isValidatingCoupon ? "..." : "Áp dụng"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCouponModalOpen(true);
                  loadMyCoupons();
                }}
                className="text-xs font-semibold text-indigo-600 underline transition-colors hover:text-indigo-700"
              >
                Chọn từ kho mã giảm giá của tôi
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isCreatingOrder}
                onClick={() => {
                  setIsConfirmBuyOpen(false);
                  setSelectedPlanToBuy(null);
                }}
                className={`${secondaryBtnClass} w-full sm:w-auto`}
              >
                Hủy
              </button>
              <CosmicButton type="button" onClick={handleConfirmBuyPlan} disabled={isCreatingOrder} className="w-full sm:w-auto">
                {isCreatingOrder ? "Đang xử lý..." : "Tiếp tục thanh toán"}
              </CosmicButton>
            </div>
          </div>
        </div>
      )}

      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.35)] sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-950">Mã giảm giá của tôi</h2>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-500 hover:text-slate-700"><XCircle className="h-5 w-5" /></button>
            </div>

            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
              {isLoadingCoupons ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
              ) : myCoupons.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-600">Bạn chưa có mã giảm giá nào.</p>
              ) : (
                myCoupons.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCoupon(c.code)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs font-semibold uppercase text-slate-500">{c.code}</p>
                      </div>
                      <p className="text-lg font-extrabold text-indigo-600">-{c.discountPercent}%</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Đơn từ {formatCurrency(c.minOrderAmount)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={<PlansPageSkeleton />}>
      <PlansPageContent />
    </Suspense>
  );
}















