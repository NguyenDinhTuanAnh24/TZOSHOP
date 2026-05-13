"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Clock3,
  RefreshCw,
  Search,
  ShoppingCart,
  XCircle,
  Zap,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

function getFamilyLabel(apiFamily: ApiFamily) {
  const familyMap: Record<ApiFamily, string> = {
    CODEXAI: "CodexAI",
    CLAUDE: "Claude",
    GEMINI: "Gemini",
    DEEPSEEK: "DeepSeek",
  };
  return familyMap[apiFamily];
}

function formatCreditAmount(value: string) {
  const amount = Number(value);
  if (amount >= 1_000_000_000) return `${amount / 1_000_000_000}B`;
  if (amount >= 1_000_000) return `${amount / 1_000_000}M`;
  if (amount >= 1_000) return `${amount / 1_000}K`;
  return amount.toLocaleString("vi-VN");
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

const tierTabs = [
  { label: "Tất cả", value: "Tất cả" },
  { label: "Trial", value: "Trial" },
  { label: "Mini", value: "Mini" },
  { label: "Plus", value: "Plus" },
  { label: "Pro", value: "Pro" },
  { label: "Max", value: "Max" },
  { label: "Ultra", value: "Ultra" },
  { label: "Enterprise", value: "Enterprise" },
];

const durationTabs = [
  { label: "Tất cả", value: "Tất cả" },
  { label: "Gói chính", value: "Gói chính" },
  { label: "Gói dài hạn", value: "Gói dài hạn" },
];

const sortOptions = [
  { label: "Giá thấp", value: "price-asc" },
  { label: "Giá cao", value: "price-desc" },
  { label: "Credits", value: "credits-desc" },
  { label: "Thời hạn", value: "duration-desc" },
  { label: "Gói liên hệ", value: "contact" },
];

const ITEMS_PER_PAGE = 6;

const brutalBtn =
  "inline-flex items-center justify-center border-4 border-black text-black font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

const aiFamilies: Array<{
  id: ApiFamily;
  name: string;
  description: string;
  color: string;
  logoSrc: string;
}> = [
  {
    id: "CODEXAI",
    name: "CodexAI",
    description: "Phù hợp lập trình, IDE và extension.",
    logoSrc: "/logos/codexai.svg",
    color: "bg-[#C7F0D8]",
  },
  {
    id: "CLAUDE",
    name: "Claude",
    description: "Phù hợp viết nội dung, phân tích và xử lý văn bản.",
    logoSrc: "/logos/claude.svg",
    color: "bg-[#FFD93D]",
  },
  {
    id: "GEMINI",
    name: "Gemini",
    description: "Phù hợp đa nhiệm, tốc độ tốt và chi phí cân bằng.",
    logoSrc: "/logos/gemini.svg",
    color: "bg-[#A78BFA]",
  },
  {
    id: "DEEPSEEK",
    name: "DeepSeek",
    description: "Phù hợp tối ưu chi phí khi dùng thường xuyên.",
    logoSrc: "/logos/deepseek.svg",
    color: "bg-[#FF6B6B]",
  },
];

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 max-w-full items-center justify-center whitespace-nowrap border-2 border-black px-3 text-center text-xs font-black text-black shadow-[2px_2px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:bg-[#FFF3B0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:px-4 sm:text-sm",
        active
          ? "bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000]"
          : "bg-white"
      )}
    >
      {children}
    </button>
  );
}

function FilterRow({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-5">
      <div className="flex items-center gap-2 text-sm font-black uppercase text-black md:min-w-[120px]">
        <span className="flex h-8 w-8 items-center justify-center border-2 border-black bg-[#FFD93D] shadow-[2px_2px_0px_0px_#000]">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PlansPageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-full max-w-[460px]" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-h-[180px] border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000]">
              <Skeleton className="h-14 w-14" />
              <Skeleton className="mt-5 h-7 w-24" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlansGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex min-h-[360px] flex-col border-4 border-black bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_0px_#000] md:p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-5 h-20 w-full border-4 border-black" />
          <Skeleton className="mt-4 h-14 w-full border-2 border-black" />
          <Skeleton className="mt-auto h-8 w-28" />
          <Skeleton className="mt-4 h-12 w-full" />
        </div>
      ))}
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

  const [selectedFamily, setSelectedFamily] = useState<ApiFamily | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTier, setSelectedTier] = useState("Tất cả");
  const [selectedPlanType, setSelectedPlanType] = useState("Tất cả");
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<ApiPlan | null>(null);
  const [isConfirmBuyOpen, setIsConfirmBuyOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [expandedModelPlans, setExpandedModelPlans] = useState<string[]>([]);
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
      setSelectedFamily(targetPlan.apiFamily);
      setCurrentPage(1);
      setSelectedPlanToBuy(targetPlan);
      setIsConfirmBuyOpen(true);
      setHasHandledProductQuery(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasHandledProductQuery, isLoadingPlans, plans, searchParams]);

  const filteredPlans = useMemo(() => {
    if (!selectedFamily) return [];
    return plans.filter((plan) => {
      const isLongTerm = plan.slug.match(/-(3m|6m|year|enterprise)$/);
      const matchesFamily = plan.apiFamily === selectedFamily;
      const matchesTier = selectedTier === "Tất cả" || plan.tier === selectedTier;
      const matchesPlanType =
        selectedPlanType === "Tất cả" ||
        (selectedPlanType === "Gói chính" && !isLongTerm) ||
        (selectedPlanType === "Gói dài hạn" && isLongTerm);
      return matchesFamily && matchesTier && matchesPlanType;
    });
  }, [plans, selectedFamily, selectedTier, selectedPlanType]);

  const sortedPlans = useMemo(() => {
    let plansCopy = [...filteredPlans];
    if (sortBy === "contact") plansCopy = plansCopy.filter(isContactPlan);

    if (sortBy === "price-asc") {
      return plansCopy.sort((a, b) => {
        const priceA = Number(a.priceVnd ?? 0);
        const priceB = Number(b.priceVnd ?? 0);
        if (priceA === 0 && priceB !== 0) return 1;
        if (priceA !== 0 && priceB === 0) return -1;
        return priceA - priceB;
      });
    }

    switch (sortBy) {
      case "price-desc":
        return plansCopy.sort((a, b) => Number(b.priceVnd ?? 0) - Number(a.priceVnd ?? 0));
      case "credits-desc":
        return plansCopy.sort((a, b) => getPlanCredits(b) - getPlanCredits(a));
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

  const featuredPlanId = useMemo(() => {
    const popular = sortedPlans.find((p) => p.isPopular);
    if (popular) return popular.id;
    const fallback = sortedPlans.find((p) => !isContactPlan(p));
    return fallback?.id ?? null;
  }, [sortedPlans]);

  const activeFamilyMeta = useMemo(() => aiFamilies.find((f) => f.id === selectedFamily) ?? null, [selectedFamily]);
  const fromItem = sortedPlans.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const toItem = Math.min(safeCurrentPage * ITEMS_PER_PAGE, sortedPlans.length);

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
      if (!response.ok) throw new Error(result?.error?.message ?? "Cannot create order");
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
    <div className="space-y-8 overflow-x-hidden px-5 py-6 md:px-6 lg:px-8 lg:py-8" aria-busy={isLoadingPlans}>
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <ShoppingCart className="h-7 w-7 text-black" />
              </div>
              <span className="border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-wide text-black">CỬA HÀNG CREDITS</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black md:text-4xl">MUA CREDITS</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Chọn dòng AI trước, sau đó chọn gói credits phù hợp với nhu cầu của bạn.</p>
          </div>
          <Link href="/my-plans" className={`${brutalBtn} h-11 bg-white px-5 hover:bg-[#FFD93D]`}>XEM GÓI CỦA TÔI</Link>
        </div>
      </section>

      {isLoadingPlans ? (
        <PlansPageSkeleton />
      ) : plansError ? (
        <div className="border-4 border-black bg-[#FF6B6B] p-10 text-center shadow-[8px_8px_0px_0px_#000]">
          <h3 className="text-xl font-black text-black">KHÔNG THỂ TẢI DỮ LIỆU</h3>
          <p className="mt-2 text-sm font-bold text-black/80">{plansError}</p>
          <button onClick={loadPlans} className={`${brutalBtn} mt-6 h-11 bg-white px-6 hover:bg-[#FFD93D]`}>
            <RefreshCw className="mr-2 h-4 w-4" />THỬ LẠI
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedFamily === null ? (
            <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-8">
              <h2 className="text-2xl font-black uppercase text-black md:text-3xl">VUI LÒNG CHỌN DÒNG AI</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-black/70 md:text-base">Chọn dòng AI bạn muốn sử dụng, TzoShop sẽ hiển thị các gói credits phù hợp.</p>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {aiFamilies.map((family) => (
                  <button
                    key={family.id}
                    type="button"
                    onClick={() => {
                      setSelectedFamily(family.id);
                      setCurrentPage(1);
                    }}
                    className="min-h-[180px] cursor-pointer border-4 border-black bg-white p-5 text-left shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    <div className={cn("flex h-14 w-14 items-center justify-center border-4 border-black text-black shadow-[4px_4px_0px_0px_#000]", family.color)}>
                      <Image
                        src={family.logoSrc}
                        alt={`${family.name} logo`}
                        width={36}
                        height={36}
                        className="h-9 w-9 object-contain"
                      />
                    </div>
                    <p className="mt-5 text-2xl font-black text-black">{family.name}</p>
                    <p className="mt-2 text-sm font-bold leading-relaxed text-black/70">{family.description}</p>
                    <span className="mt-4 inline-flex font-black uppercase text-black">XEM GÓI</span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              <section className="border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-black/70">ĐANG XEM DÒNG AI</p>
                    <p className="mt-1 text-2xl font-black text-black">{activeFamilyMeta?.name}</p>
                    <p className="mt-1 text-sm font-bold text-black/70">{activeFamilyMeta?.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFamily(null);
                      setCurrentPage(1);
                    }}
                    className={`${brutalBtn} h-11 bg-[#FFD93D] px-5`}
                  >
                    ĐỔI DÒNG AI
                  </button>
                </div>
              </section>

              <section className="rounded-[10px] border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000] md:p-6">
                <div className="space-y-4">
                  <FilterRow title="Hiệu lực" icon={Clock3}>
                    {durationTabs.map((tab) => (
                      <FilterChip key={tab.value} active={selectedPlanType === tab.value} onClick={() => { setSelectedPlanType(tab.value); setCurrentPage(1); }}>
                        {tab.label}
                      </FilterChip>
                    ))}
                  </FilterRow>
                  <FilterRow title="Cấp độ" icon={Zap}>
                    {tierTabs.map((tab) => (
                      <FilterChip key={tab.value} active={selectedTier === tab.value} onClick={() => { setSelectedTier(tab.value); setCurrentPage(1); }}>
                        <span className={cn(
                          "inline-flex h-9 items-center justify-center whitespace-nowrap px-3 text-center text-[12px] font-black uppercase leading-none sm:min-w-[56px]",
                          selectedTier === tab.value && "text-black"
                        )}>
                          {tab.label}
                        </span>
                      </FilterChip>
                    ))}
                  </FilterRow>
                  <FilterRow title="Sắp xếp" icon={ArrowUpDown}>
                    {sortOptions.map((opt) => (
                      <FilterChip key={opt.value} active={sortBy === opt.value} onClick={() => { setSortBy(opt.value); setCurrentPage(1); }}>
                        {opt.label}
                      </FilterChip>
                    ))}
                  </FilterRow>
                </div>
              </section>

              {isLoadingPlans ? (
                <PlansGridSkeleton />
              ) : paginatedPlans.length === 0 ? (
                <div className="min-h-[240px] border-4 border-black bg-[#FFFDF5] p-10 text-center shadow-[8px_8px_0px_0px_#000]">
                  {filteredPlans.length === 0 ? (
                    <>
                      <h3 className="text-xl font-black text-black">CHƯA CÓ GÓI CHO DÒNG AI NÀY</h3>
                      <p className="mt-2 font-bold text-black/70">Vui lòng chọn dòng AI khác hoặc quay lại sau.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFamily(null);
                          setCurrentPage(1);
                        }}
                        className={`${brutalBtn} mt-6 h-11 bg-[#FFD93D] px-6`}
                      >
                        ĐỔI DÒNG AI
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                        <Search className="h-8 w-8 text-black" />
                      </div>
                      <h3 className="text-xl font-black text-black">KHÔNG TÌM THẤY GÓI PHÙ HỢP</h3>
                      <p className="mt-2 font-bold text-black/70">Hãy thử đổi bộ lọc hoặc chọn dòng AI khác.</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {paginatedPlans.map((plan) => {
                      const isFeatured = featuredPlanId === plan.id;
                      const isExpandedModel = expandedModelPlans.includes(plan.id);
                      const modelCount = plan.allowedModels.length;
                      return (
                        <article
                          key={plan.id}
                          className={cn(
                            "relative flex min-h-[360px] flex-col overflow-visible border-4 border-black bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[9px_9px_0px_0px_#000] md:p-6",
                            isFeatured && "shadow-[9px_9px_0px_0px_#000]"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-xl font-black leading-tight text-black md:text-2xl">{plan.name}</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="inline-flex border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                                {getFamilyLabel(plan.apiFamily)}
                              </span>
                              <span className="inline-flex border-2 border-black bg-[#FFD93D] px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                                {plan.tier}
                              </span>
                            </div>
                          </div>

                          <p className="mt-3 text-sm font-bold leading-relaxed text-black/70">{getPlanAudienceText(plan)}</p>

                          <div className="mt-5 border-4 border-black bg-[#C7F0D8] p-4 shadow-[4px_4px_0px_0px_#000]">
                            <p className="text-3xl font-black leading-none text-black">{formatCreditAmount(plan.credits)}</p>
                            <p className="mt-1 text-xs font-black uppercase text-black/70">
                              {plan.tier === "Enterprise" ? "Gói dung lượng lớn" : "Dùng đến khi hết credits"}
                            </p>
                          </div>

                          <div className="mt-4 space-y-2 font-bold text-black">
                            <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
                              <span className="text-xs font-black uppercase text-black/70">API keys</span>
                              <span className="font-black text-black">{plan.apiKeyLimit} keys</span>
                            </div>
                            <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
                              <span className="text-xs font-black uppercase text-black/70">Hiệu lực</span>
                              <span className="font-black text-black">{getDurationLabel(plan)}</span>
                            </div>
                          </div>

                          <div className="mt-4 border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
                            <p className="text-xs font-black uppercase text-black/70">Models hỗ trợ</p>
                            <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                              <div className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap border-2 border-black bg-[#BFECCF] px-4 text-center text-sm font-black text-black shadow-[2px_2px_0px_0px_#000] sm:w-auto">
                                {modelCount === 0 ? "Chưa có model" : `Hỗ trợ ${modelCount} model`}
                              </div>
                            {modelCount > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedModelPlans((prev) =>
                                    prev.includes(plan.id) ? prev.filter((id) => id !== plan.id) : [...prev, plan.id]
                                  )
                                }
                                className="inline-flex h-10 w-full items-center justify-center border-2 border-black bg-[#FFD93D] px-4 text-sm font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:w-auto"
                              >
                                <AppIcon icon={isExpandedModel ? ChevronUp : ChevronDown} className="mr-1 h-3.5 w-3.5" />
                                {isExpandedModel ? "Thu gọn" : "Xem chi tiết"}
                              </button>
                            )}
                            </div>
                            {isExpandedModel && modelCount > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {plan.allowedModels.map((m) => (
                                  <span key={m} className="inline-flex break-all border-2 border-black bg-white px-2 py-1 text-xs font-bold text-black">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <p className="mt-auto pt-5 text-3xl font-black text-black">{isContactPlan(plan) ? "Liên hệ" : formatCurrency(plan.priceVnd)}</p>
                          <button
                            onClick={() => handleChoosePlan(plan)}
                            disabled={plan.allowedModels.length === 0 && !isContactPlan(plan)}
                            className={cn(
                              `${brutalBtn} mt-4 h-12 w-full justify-center px-5`,
                              isContactPlan(plan) ? "bg-[#FFD93D]" : "bg-[#FF6B6B]",
                              plan.allowedModels.length === 0 && !isContactPlan(plan) && "cursor-not-allowed opacity-50 grayscale"
                            )}
                          >
                            {isContactPlan(plan) ? "LIÊN HỆ TƯ VẤN" : "CHỌN GÓI"}
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col items-center gap-3">
                      <button
                        type="button"
                        disabled={safeCurrentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="h-11 border-4 border-black bg-[#FFFDF5] px-5 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-y-0.5 hover:bg-[#FFD93D] disabled:cursor-not-allowed disabled:bg-[#E9E1D0] disabled:text-black/50 disabled:shadow-none"
                      >
                        TRƯỚC
                      </button>

                      <div className="w-full overflow-x-auto">
                        <div className="flex min-w-max items-center justify-center gap-3 px-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={cn(
                                "h-11 border-4 border-black px-4 font-black text-black shadow-[4px_4px_0px_0px_#000]",
                                safeCurrentPage === page ? "bg-[#FFD93D]" : "bg-white"
                              )}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="h-11 border-4 border-black bg-[#FFFDF5] px-5 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-y-0.5 hover:bg-[#FFD93D] disabled:cursor-not-allowed disabled:bg-[#E9E1D0] disabled:text-black/50 disabled:shadow-none"
                      >
                        SAU
                      </button>

                      <p className="w-full text-center text-sm font-black text-black">Trang {safeCurrentPage} / {totalPages}</p>
                      <p className="w-full text-center text-xs font-bold text-black/70">Hiển thị {fromItem}-{toItem} trong {sortedPlans.length} gói</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {isConfirmBuyOpen && selectedPlanToBuy && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000]">
            <h2 className="text-xl font-black uppercase text-black">XÁC NHẬN MUA GÓI</h2>
            <p className="mt-2 text-sm font-bold text-black/70">
              {couponData?.valid && couponData.finalAmount === 0
                ? "Bạn đang sử dụng mã giảm giá 100%. Gói credits sẽ được kích hoạt ngay lập tức."
                : "Sau khi xác nhận, hệ thống sẽ tạo đơn hàng chờ thanh toán."}
            </p>

            <div className="mt-5 space-y-2 border-4 border-black bg-[#FFFDF5] p-4 text-sm font-bold text-black">
              <p>Gói: <b>{selectedPlanToBuy.name}</b></p>
              <p>Dòng AI: <b>{getFamilyLabel(selectedPlanToBuy.apiFamily)}</b></p>
              <p>Credits: <b>{formatCreditAmount(selectedPlanToBuy.credits)}</b></p>
              <p>Hiệu lực: <b>{selectedPlanToBuy.durationDays && selectedPlanToBuy.durationDays > 0 ? `${selectedPlanToBuy.durationDays} ngày` : "Không giới hạn"}</b></p>
              <p>API key: <b>{selectedPlanToBuy.apiKeyLimit} key</b></p>
              <p>Giá gốc: <b>{formatCurrency(selectedPlanToBuy.priceVnd)}</b></p>
              {couponData?.valid && <p>Giảm giá: <b>-{formatCurrency(couponData.discountAmount)}</b></p>}
              <p className="text-base">Tổng thanh toán: <b>{couponData?.valid ? formatCurrency(couponData.finalAmount) : formatCurrency(selectedPlanToBuy.priceVnd)}</b></p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-black uppercase text-black/70">Mã giảm giá (nếu có)</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponData(null);
                  }}
                  className="h-11 w-full border-4 border-black bg-white px-3 text-sm font-bold text-black outline-none focus:bg-[#FFD93D]/25"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={!couponCode || isValidatingCoupon}
                  className={`${brutalBtn} h-11 bg-[#FFD93D] px-4 text-xs disabled:opacity-50`}
                >
                  {isValidatingCoupon ? "..." : "ÁP DỤNG"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCouponModalOpen(true);
                  loadMyCoupons();
                }}
                className="text-xs font-black uppercase text-black underline"
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
                className={`${brutalBtn} h-11 w-full bg-white px-6 hover:bg-[#FFD93D] sm:w-auto`}
              >
                HỦY
              </button>
              <button type="button" onClick={handleConfirmBuyPlan} disabled={isCreatingOrder} className={`${brutalBtn} h-11 w-full bg-[#FF6B6B] px-6 disabled:opacity-50 sm:w-auto`}>
                {isCreatingOrder ? "ĐANG XỬ LÝ..." : "XÁC NHẬN MUA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase text-black">MÃ GIẢM GIÁ CỦA TÔI</h2>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-black"><XCircle className="h-5 w-5" /></button>
            </div>

            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
              {isLoadingCoupons ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : myCoupons.length === 0 ? (
                <p className="py-10 text-center text-sm font-bold text-black/70">Bạn chưa có mã giảm giá nào.</p>
              ) : (
                myCoupons.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCoupon(c.code)}
                    className="w-full border-4 border-black bg-[#FFFDF5] p-4 text-left shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-black">{c.name}</p>
                        <p className="text-xs font-black uppercase text-black/70">{c.code}</p>
                      </div>
                      <p className="text-lg font-black text-black">-{c.discountPercent}%</p>
                    </div>
                    <p className="mt-2 text-[10px] font-bold uppercase text-black/70">Đơn từ {formatCurrency(c.minOrderAmount)}</p>
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
