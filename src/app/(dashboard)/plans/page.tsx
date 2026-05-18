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
  ShoppingCart,
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
  return `${value.toLocaleString("vi-VN")}Ä‘`;
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
    name.includes("liĂªn há»‡") ||
    tier.includes("enterprise") ||
    tier.includes("custom")
  );
}

function getPlanAudienceText(plan: ApiPlan) {
  const tier = plan.tier.toLowerCase();
  if (tier.includes("enterprise")) return "DĂ nh cho nhu cáº§u lá»›n hoáº·c Ä‘á»™i nhĂ³m.";
  if (plan.slug.startsWith("all_models_")) return "DĂ¹ng chung toĂ n bá»™ model CodexAI, Claude, Gemini vĂ  DeepSeek trong má»™t gĂ³i.";
  if (plan.apiFamily === "CODEXAI") return "PhĂ¹ há»£p láº­p trĂ¬nh, IDE vĂ  extension.";
  if (plan.apiFamily === "CLAUDE") return "PhĂ¹ há»£p viáº¿t ná»™i dung, phĂ¢n tĂ­ch vĂ  xá»­ lĂ½ vÄƒn báº£n.";
  if (plan.apiFamily === "GEMINI") return "PhĂ¹ há»£p Ä‘a nhiá»‡m, tá»‘c Ä‘á»™ tá»‘t vĂ  chi phĂ­ cĂ¢n báº±ng.";
  if (plan.apiFamily === "DEEPSEEK") return "PhĂ¹ há»£p tá»‘i Æ°u chi phĂ­ khi dĂ¹ng thÆ°á»ng xuyĂªn.";
  return "PhĂ¹ há»£p nhiá»u nhu cáº§u sá»­ dá»¥ng khĂ¡c nhau.";
}

function getDurationLabel(plan: ApiPlan) {
  if (plan.durationDays && plan.durationDays > 0) return `${plan.durationDays} ngĂ y`;
  return "DĂ¹ng Ä‘áº¿n khi háº¿t credits";
}

const durationTabs = [
  { label: "Táº¥t cáº£", value: "all" },
  { label: "7 ngĂ y", value: "7" },
  { label: "30 ngĂ y", value: "30" },
  { label: "90 ngĂ y", value: "90" },
  { label: "365 ngĂ y", value: "365" },
];

const packageTypeTabs = [
  { label: "Táº¥t cáº£", value: "all" },
  { label: "Trial 7 ngĂ y", value: "trial" },
  { label: "1 thĂ¡ng", value: "monthly" },
  { label: "3 thĂ¡ng", value: "quarterly" },
  { label: "1 nÄƒm", value: "yearly" },
];

const sortOptions = [
  { label: "GiĂ¡ tháº¥p", value: "price-asc" },
  { label: "GiĂ¡ cao", value: "price-desc" },
  { label: "Credits tháº¥p", value: "credits-asc" },
  { label: "Credits cao", value: "credits-desc" },
  { label: "Thá»i háº¡n ngáº¯n", value: "duration-asc" },
  { label: "Thá»i háº¡n dĂ i", value: "duration-desc" },
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
    description: "DĂ¹ng chung toĂ n bá»™ model trong má»™t gĂ³i.",
    logoSrc: "/logos/gemini.svg",
  },
  {
    id: "CODEXAI",
    name: "CodexAI",
    description: "PhĂ¹ há»£p láº­p trĂ¬nh, IDE vĂ  extension.",
    logoSrc: "/logos/codexai.svg",
  },
  {
    id: "CLAUDE",
    name: "Claude",
    description: "PhĂ¹ há»£p viáº¿t ná»™i dung, phĂ¢n tĂ­ch vĂ  xá»­ lĂ½ vÄƒn báº£n.",
    logoSrc: "/logos/claude.svg",
  },
  {
    id: "GEMINI",
    name: "Gemini",
    description: "PhĂ¹ há»£p Ä‘a nhiá»‡m, tá»‘c Ä‘á»™ tá»‘t vĂ  chi phĂ­ cĂ¢n báº±ng.",
    logoSrc: "/logos/gemini.svg",
  },
  {
    id: "DEEPSEEK",
    name: "DeepSeek",
    description: "PhĂ¹ há»£p tá»‘i Æ°u chi phĂ­ khi dĂ¹ng thÆ°á»ng xuyĂªn.",
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
      if (result.valid) showToast("Ăp dá»¥ng mÄ‚Â£ giáº£m giÄ‚Â¡ thÄ‚Â nh cÄ‚Â´ng!", "success");
      else showToast(result.message || "MÄ‚Â£ giáº£m giÄ‚Â¡ khÄ‚Â´ng há»£p lá»‡.", "error");
    } catch {
      showToast("LĂ¡Â»â€”i kiá»ƒm tra mÄ‚Â£ giáº£m giÄ‚Â¡.", "error");
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
      showToast("KhÄ‚Â´ng thá»ƒ táº£i kho mÄ‚Â£.", "error");
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
        showToast("Mua gÄ‚Â³i thÄ‚Â nh cÄ‚Â´ng! GÄ‚Â³i Ă„'Ä‚Â£ Ä‘Æ°á»£c kÄ‚Â­ch hoáº¡t.", "success");
        setIsConfirmBuyOpen(false);
        setSelectedPlanToBuy(null);
        if (result.data.creditBucketId) router.push(`/api-keys?bucketId=${result.data.creditBucketId}`);
        else router.push("/my-plans");
        return;
      }
      showToast("ÄÆ¡n hÄ‚Â ng Ă„'Ä‚Â£ Ä‘Æ°á»£c táº¡o.", "success");
      setIsConfirmBuyOpen(false);
      setSelectedPlanToBuy(null);
      router.push("/billing");
    } catch (error) {
      console.error(error);
      showToast("KhÄ‚Â´ng thá»ƒ táº¡o Ä‘Æ¡n hÄ‚Â ng.", "error");
    } finally {
      setIsCreatingOrder(false);
    }
  }

  return (
    <div className="space-y-8 overflow-x-hidden" aria-busy={isLoadingPlans}>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <ShoppingCart className="h-4 w-4" /> CĂ¡Â»Â­a hÄ‚Â ng credits
            </div>
            <TextFadeInUp as="h1" className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Mua credits</TextFadeInUp>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Chá»n gÄ‚Â³i phÄ‚Â¹ há»£p vĂ¡Â»â€ºi nhu cáº§u sĂ¡Â»Â­ dá»¥ng AI cĂ¡Â»Â§a báº¡n. Credits Ä‘Æ°á»£c quáº£n lÄ‚Â½ rĂµ rÄ‚Â ng trong tÄ‚Â i khoáº£n.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CosmicButton href="/my-plans">GÄ‚Â³i cĂ¡Â»Â§a tÄ‚Â´i</CosmicButton>
            <CosmicButton href="/billing" variant="secondary">Lá»‹ch sĂ¡Â»Â­ thanh toÄ‚Â¡n</CosmicButton>
          </div>
        </div>
      </section>

      {isLoadingPlans ? (
        <PlansPageSkeleton />
      ) : plansError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-950">KhÄ‚Â´ng thá»ƒ táº£i danh sÄ‚Â¡ch gÄ‚Â³i</h3>
          <p className="mt-2 text-sm text-slate-600">Vui lÄ‚Â²ng thĂ¡Â»Â­ láº¡i sau Ä‚Â­t phÄ‚Âºt.</p>
          <button onClick={loadPlans} className={`${secondaryBtnClass} mt-6`}>
            <RefreshCw className="mr-2 h-4 w-4" />Thá»­ láº¡i
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Hiá»‡u lá»±c</p>
                <div className="flex flex-wrap gap-2">
                  {durationTabs.map((tab) => (
                    <FilterChip key={tab.value} active={selectedDuration === tab.value} onClick={() => { setSelectedDuration(tab.value); setCurrentPage(1); }}>
                      {tab.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Loáº¡i gĂ³i</p>
                <div className="flex flex-wrap gap-2">
                  {packageTypeTabs.map((tab) => (
                    <FilterChip key={tab.value} active={selectedPackageType === tab.value} onClick={() => { setSelectedPackageType(tab.value); setCurrentPage(1); }}>
                      {tab.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sáº¯p xáº¿p</p>
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
                  <TextFadeInUp as="h3" className="text-xl font-bold text-slate-950">ChÆ°a cÄ‚Â³ gÄ‚Â³i credits phÄ‚Â¹ há»£p</TextFadeInUp>
                  <p className="mt-2 text-sm text-slate-600">Báº¡n cÄ‚Â³ thá»ƒ Ä‘á»•i bĂ¡Â»â„¢ lá»c hoáº·c quay láº¡i sau khi TzoShop cáº­p nháº­t thÄ‚Âªm gÄ‚Â³i mĂ¡Â»â€ºi.</p>
                  <button type="button" onClick={() => { setSelectedFamily("ALL_MODELS"); setSelectedDuration("all"); setSelectedPackageType("all"); setCurrentPage(1); }} className={`${secondaryBtnClass} mt-6`}>
                    Quay vá» All Models
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Search className="h-7 w-7" />
                  </div>
                  <TextFadeInUp as="h3" className="text-xl font-bold text-slate-950">KhÄ‚Â´ng tĂ¬m tháº¥y gÄ‚Â³i phÄ‚Â¹ há»£p</TextFadeInUp>
                  <p className="mt-2 text-sm text-slate-600">HÄ‚Â£y thĂ¡Â»Â­ Ä‘á»•i bĂ¡Â»â„¢ lá»c Ä‘á»ƒ tĂ¬m gÄ‚Â³i phÄ‚Â¹ há»£p hĂ†Â¡n.</p>
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
                              <Star className="h-3.5 w-3.5" /> Phá»• biáº¿n
                            </span>
                          )}
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {plan.slug.endsWith("_trial")
                              ? "Trial 7 ngĂ y"
                              : plan.slug.endsWith("_monthly")
                                ? "1 thĂ¡ng"
                                : plan.slug.endsWith("_quarterly")
                                  ? "3 thĂ¡ng"
                                  : plan.slug.endsWith("_yearly")
                                    ? "1 nÄƒm"
                                    : "GĂ³i credits"}
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
                          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" /> Thá»i háº¡n</span>
                          <span className="font-semibold text-slate-900">{getDurationLabel(plan)}</span>
                        </p>
                        <p className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <span className="inline-flex items-center gap-2"><KeyRound className="h-4 w-4 text-violet-500" /> API key</span>
                          <span className="font-semibold text-slate-900">{plan.apiKeyLimit} key</span>
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Models há»— trá»£</p>
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

                      <p className="mt-6 text-3xl font-extrabold text-slate-950">{isContactPlan(plan) ? "LiÄ‚Âªn há»‡" : formatCurrency(plan.priceVnd)}</p>

                      <CosmicButton
                        onClick={() => handleChoosePlan(plan)}
                        disabled={plan.allowedModels.length === 0 && !isContactPlan(plan)}
                        className={cn("mt-4 w-full", plan.allowedModels.length === 0 && !isContactPlan(plan) && "grayscale")}
                      >
                        {isContactPlan(plan) ? "LiÄ‚Âªn há»‡ tÆ° váº¥n" : "Mua gÄ‚Â³i"}
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
                      TrÆ°á»›c
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
            <h2 className="text-xl font-extrabold text-slate-950">XÄ‚Â¡c nháº­n mua gÄ‚Â³i</h2>
            <p className="mt-2 text-sm text-slate-600">
              {couponData?.valid && couponData.finalAmount === 0
                ? "Báº¡n Ă„'ang sĂ¡Â»Â­ dá»¥ng mÄ‚Â£ giáº£m giÄ‚Â¡ 100%. GÄ‚Â³i credits sáº½ Ä‘Æ°á»£c kÄ‚Â­ch hoáº¡t ngay láº­p tá»©c."
                : "Sau khi xÄ‚Â¡c nháº­n, há»‡ thá»‘ng sáº½ táº¡o Ä‘Æ¡n hÄ‚Â ng chá» thanh toÄ‚Â¡n."}
            </p>

            <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>GÄ‚Â³i: <b>{selectedPlanToBuy.name}</b></p>
              <p>DÄ‚Â²ng AI: <b>{getPlanFamilyLabel(selectedPlanToBuy)}</b></p>
              <p>Credits: <b>{formatCreditsWithUnit(selectedPlanToBuy.credits)}</b></p>
              <p>Hiá»‡u lĂ¡Â»Â±c: <b>{selectedPlanToBuy.durationDays && selectedPlanToBuy.durationDays > 0 ? `${selectedPlanToBuy.durationDays} ngÄ‚Â y` : "KhÄ‚Â´ng giĂ¡Â»â€ºi háº¡n"}</b></p>
              <p>API key: <b>{selectedPlanToBuy.apiKeyLimit} key</b></p>
              <p>GiÄ‚Â¡ gá»‘c: <b>{formatCurrency(selectedPlanToBuy.priceVnd)}</b></p>
              {couponData?.valid && <p>Giáº£m giÄ‚Â¡: <b>-{formatCurrency(couponData.discountAmount)}</b></p>}
              <p className="text-base">Tá»•ng thanh toÄ‚Â¡n: <b>{couponData?.valid ? formatCurrency(couponData.finalAmount) : formatCurrency(selectedPlanToBuy.priceVnd)}</b></p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">MÄ‚Â£ giáº£m giÄ‚Â¡ (náº¿u cÄ‚Â³)</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Nháº­p mÄ‚Â£ Æ°u Ă„'Ä‚Â£i..."
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
                  {isValidatingCoupon ? "..." : "Ăp dá»¥ng"}
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
                Chá»n tá»« kho mÄ‚Â£ giáº£m giÄ‚Â¡ cĂ¡Â»Â§a tÄ‚Â´i
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
                HĂ¡Â»Â§y
              </button>
              <CosmicButton type="button" onClick={handleConfirmBuyPlan} disabled={isCreatingOrder} className="w-full sm:w-auto">
                {isCreatingOrder ? "Äang xĂ¡Â»Â­ lÄ‚Â½..." : "Tiáº¿p tá»¥c thanh toÄ‚Â¡n"}
              </CosmicButton>
            </div>
          </div>
        </div>
      )}

      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.35)] sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-950">MÄ‚Â£ giáº£m giÄ‚Â¡ cĂ¡Â»Â§a tÄ‚Â´i</h2>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-500 hover:text-slate-700"><XCircle className="h-5 w-5" /></button>
            </div>

            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
              {isLoadingCoupons ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
              ) : myCoupons.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-600">Báº¡n chÆ°a cÄ‚Â³ mÄ‚Â£ giáº£m giÄ‚Â¡ nÄ‚Â o.</p>
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
                    <p className="mt-2 text-xs text-slate-500">ÄÆ¡n tá»« {formatCurrency(c.minOrderAmount)}</p>
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















