"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Package, 
  Zap, 
  Clock3, 
  KeyRound, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Search,
  RefreshCw,
  XCircle,
  TicketPercent
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { CardListSkeleton } from "@/components/ui/page-skeleton";
import DashboardSubNav from "@/components/dashboard/dashboard-sub-nav";
import { cn } from "@/lib/utils";

type ApiPlan = {
  id: string;
  name: string;
  slug: string;
  apiFamily: "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
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

function getFamilyLabel(apiFamily: ApiPlan["apiFamily"]) {
  const familyMap: Record<ApiPlan["apiFamily"], string> = {
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

function hasRealPrice(plan: ApiPlan) {
  return !isContactPlan(plan) && typeof plan.priceVnd === "number" && plan.priceVnd > 0;
}

const familyTabs = ["CodexAI", "Claude", "Gemini", "DeepSeek"];

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
  { label: "Đề xuất", value: "recommended" },
  { label: "Giá thấp", value: "price-asc" },
  { label: "Giá cao", value: "price-desc" },
  { label: "Credits", value: "credits-desc" },
  { label: "Thời hạn", value: "duration-desc" },
  { label: "Gói liên hệ", value: "contact" },
];

const DEFAULT_VISIBLE_MODELS = 4;

import { useRouter, useSearchParams } from "next/navigation";

function PlansPageContent() {
  const router = useRouter();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState("");
  const { toast, showToast, clearToast } = useToast(3000);

  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState("Tất cả");
  const [selectedPlanType, setSelectedPlanType] = useState("Tất cả");
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<ApiPlan | null>(null);
  const [isConfirmBuyOpen, setIsConfirmBuyOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [expandedModelPlans, setExpandedModelPlans] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recommended");
  const [isExpanded, setIsExpanded] = useState(false);
  const searchParams = useSearchParams();
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
  type UserCoupon = {
    id: string;
    code: string;
    name: string;
    discountPercent: number;
    minOrderAmount: number;
  };

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

  // Xử lý query param product từ trang pricing công cộng
  useEffect(() => {
    if (hasHandledProductQuery || isLoadingPlans || plans.length === 0) return;

    const productIdFromPricing = searchParams.get("product");
    if (!productIdFromPricing) return;

    const targetPlan = plans.find((p) => p.id === productIdFromPricing);
    if (!targetPlan) return;

    const timer = window.setTimeout(() => {
      // Chuyển sang tab family tương ứng
      setSelectedFamily(getFamilyLabel(targetPlan.apiFamily));
      
      // Mở modal xác nhận mua
      setSelectedPlanToBuy(targetPlan);
      setIsConfirmBuyOpen(true);
      
      // Đánh dấu đã xử lý
      setHasHandledProductQuery(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [hasHandledProductQuery, isLoadingPlans, plans, searchParams]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const familyLabel = getFamilyLabel(plan.apiFamily);
      const isLongTerm = plan.slug.match(/-(3m|6m|year|enterprise)$/);
      
      const matchesFamily = selectedFamily === null || familyLabel === selectedFamily;
      const matchesTier = selectedTier === "Tất cả" || plan.tier === selectedTier;
      const matchesPlanType = selectedPlanType === "Tất cả" || 
        (selectedPlanType === "Gói chính" && !isLongTerm) || 
        (selectedPlanType === "Gói dài hạn" && isLongTerm);

      return matchesFamily && matchesTier && matchesPlanType;
    });
  }, [plans, selectedFamily, selectedTier, selectedPlanType]);

  const sortedPlans = useMemo(() => {
    let plansCopy = [...filteredPlans];

    if (sortBy === "price-asc" || sortBy === "price-desc") {
      plansCopy = plansCopy.filter(hasRealPrice);
    }

    if (sortBy === "contact") {
      plansCopy = plansCopy.filter(isContactPlan);
    }

    switch (sortBy) {
      case "price-asc": return plansCopy.sort((a, b) => a.priceVnd - b.priceVnd);
      case "price-desc": return plansCopy.sort((a, b) => b.priceVnd - a.priceVnd);
      case "credits-desc": return plansCopy.sort((a, b) => Number(b.credits) - Number(a.credits));
      case "duration-desc": return plansCopy.sort((a, b) => (b.durationDays ?? 0) - (a.durationDays ?? 0));
      default: return plansCopy.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }
  }, [filteredPlans, sortBy]);

  const displayedPlans = useMemo(() => isExpanded ? sortedPlans : sortedPlans.slice(0, 5), [sortedPlans, isExpanded]);

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
        body: JSON.stringify({
          code: couponCode,
          productId: selectedPlanToBuy.id
        })
      });
      type CouponValidateResponse = {
        valid?: boolean;
        message?: string;
        code?: string;
        discountPercent?: number;
        originalAmount?: number;
        discountAmount?: number;
        finalAmount?: number;
      };

      const result = (await res.json()) as CouponValidateResponse;
      setCouponData({
        valid: !!result.valid,
        discountAmount: result.discountAmount || 0,
        finalAmount: result.finalAmount || 0,
        message: result.message,
        code: result.code
      });
      if (result.valid) {
        showToast("Áp dụng mã giảm giá thành công!", "success");
      } else {
        showToast(result.message || "Mã giảm giá không hợp lệ.", "error");
      }
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
      if (result.success) {
        setMyCoupons(result.data.available);
      }
    } catch {
      showToast("Không thể tải kho mã.", "error");
    } finally {
      setIsLoadingCoupons(false);
    }
  }

  function handleSelectCoupon(code: string) {
    setCouponCode(code);
    setIsCouponModalOpen(false);
    // Tự động validate sau khi chọn
    // Cần dùng setTimeout hoặc useEffect để đảm bảo state updated
  }

  // Effect để tự động validate khi couponCode thay đổi từ modal chọn mã
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedPlanToBuy.id,
          couponCode: couponData?.valid ? couponData.code : undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error?.message ?? "Cannot create order");
      }

      if (result.data?.freeOrder) {
        showToast("Mua gói thành công! Gói đã được kích hoạt.", "success");
        setIsConfirmBuyOpen(false);
        setSelectedPlanToBuy(null);
        
        // Chuyển sang trang API keys với bucket mới
        if (result.data.creditBucketId) {
          router.push(`/api-keys?bucketId=${result.data.creditBucketId}`);
        } else {
          router.push("/my-plans");
        }
        return;
      }

      showToast("Đơn hàng đã được tạo.", "success");

      setIsConfirmBuyOpen(false);
      setSelectedPlanToBuy(null);

      // Chuyển sang trang billing
      router.push("/billing");
    } catch (error) {
      console.error(error);
      showToast("Không thể tạo đơn hàng.", "error");
    } finally {
      setIsCreatingOrder(false);
    }
  }

  const btnPrimary = "rounded-full bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2";
  const btnSecondary = "rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2 text-sm font-bold transition-all flex items-center justify-center gap-2";

  return (
    <div className="space-y-8 pb-20">
      <DashboardSubNav 
        items={[
          { label: "Mua credits", href: "/plans" },
          { label: "Gói của tôi", href: "/my-plans" },
        ]} 
      />
      {/* Header Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-sm shrink-0">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Cửa hàng credits</p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {selectedFamily === null ? "Tất cả gói credits" : selectedFamily}
              </h1>
            </div>
          </div>
          <Link href="/my-plans" className={btnSecondary + " w-full sm:w-auto"}>
            <AppIcon icon={Package} className="h-4 w-4" />
            Xem gói của tôi
          </Link>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
          {familyTabs.map((family) => {
            const isActive = selectedFamily === family;
            return (
              <button
                key={family}
                onClick={() => {
                  setSelectedFamily(isActive ? null : family);
                  setIsExpanded(false);
                }}
                className={`flex flex-col rounded-2xl border p-4 sm:p-5 text-left transition-all ${
                  isActive 
                    ? "border-emerald-300 bg-emerald-50 shadow-sm ring-1 ring-emerald-500/20" 
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                }`}
              >
                <div className={`h-1.5 w-10 rounded-full mb-4 bg-gradient-to-r ${
                  family === "CodexAI" ? "from-emerald-900 to-emerald-500" :
                  family === "Claude" ? "from-orange-800 to-amber-400" :
                  family === "Gemini" ? "from-blue-800 to-cyan-400" :
                  "from-slate-900 to-blue-500"
                }`} />
                <p className="text-base sm:text-lg font-black text-slate-900">{family}</p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">Khám phá</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Filter Bar */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">
                    <AppIcon icon={Clock3} className="h-3.5 w-3.5" />
                    Hiệu lực:
                  </span>
                {durationTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedPlanType(tab.value)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      selectedPlanType === tab.value ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">
                  <AppIcon icon={Zap} className="h-3.5 w-3.5" />
                  Cấp độ:
                </span>
                {tierTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedTier(tab.value)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      selectedTier === tab.value ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">
                  <AppIcon icon={ArrowUpDown} className="h-3.5 w-3.5" />
                  Sắp xếp:
                </span>
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      sortBy === opt.value ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Plans List */}
          <div className="space-y-4">
            {isLoadingPlans ? (
              <CardListSkeleton count={5} />
            ) : plansError ? (
              <div className="rounded-[40px] border border-rose-100 bg-rose-50/50 p-16 text-center ring-1 ring-rose-100">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 text-rose-600 mb-6">
                  <AppIcon icon={XCircle} className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-rose-900">Không thể tải dữ liệu</h3>
                <p className="mt-2 text-rose-600 font-medium">Đã có lỗi xảy ra khi kết nối tới máy chủ.</p>
                <div className="mt-8 flex justify-center">
                  <button onClick={loadPlans} className="flex items-center gap-2 rounded-full bg-rose-600 px-8 py-3 text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
                    <AppIcon icon={RefreshCw} className="h-4 w-4" />
                    Thử lại ngay
                  </button>
                </div>
              </div>
            ) : displayedPlans.length === 0 ? (
              <div className="rounded-[40px] border border-dashed border-slate-300 bg-slate-50/50 p-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 mb-6">
                  <AppIcon icon={Search} className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Không có gói phù hợp.</h3>
                <p className="mt-2 text-slate-500 font-medium">Hãy thay đổi bộ lọc hoặc chọn dòng AI khác để khám phá thêm.</p>
              </div>
            ) : (
              displayedPlans.map((plan) => (
                <article
                  key={plan.id}
                  className="group relative flex flex-col gap-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 lg:flex-row lg:items-center"
                >
                  <div className="w-full shrink-0 lg:w-[220px]">
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-1 rounded-full ${
                        plan.apiFamily === "CODEXAI" ? "bg-emerald-500" :
                        plan.apiFamily === "CLAUDE" ? "bg-orange-500" :
                        plan.apiFamily === "GEMINI" ? "bg-blue-500" :
                        "bg-slate-900"
                      }`} />
                      <h3 className="text-lg font-black text-slate-900 truncate">{plan.name}</h3>
                      {plan.isPopular && (
                        <span className="flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black text-white uppercase">
                          <AppIcon icon={Sparkles} className="h-2.5 w-2.5" />
                          HOT
                        </span>
                      )}
                    </div>
                    <p className="ml-3 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{getFamilyLabel(plan.apiFamily)}</p>
                  </div>

                  <div className="flex flex-col gap-1 w-full shrink-0 lg:w-[150px]">
                    <p className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
                      <AppIcon icon={Zap} className="h-3.5 w-3.5" />
                      {formatCreditAmount(plan.credits)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      {plan.durationDays && plan.durationDays > 0 ? `${plan.durationDays} ngày` : "Dùng đến khi hết credits"} · {plan.apiKeyLimit} keys
                    </p>
                  </div>

                  <div className="min-w-[420px] flex-1">
                    <div className="flex flex-wrap gap-2">
                      {plan.allowedModels.length > 0 ? (
                        <>
                          {plan.allowedModels.slice(0, expandedModelPlans.includes(plan.id) ? undefined : DEFAULT_VISIBLE_MODELS).map((m) => (
                            <span
                              key={m}
                              title={m}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[13px] font-semibold text-slate-700"
                            >
                              {m}
                            </span>
                          ))}
                          {plan.allowedModels.length > DEFAULT_VISIBLE_MODELS && (
                            <button
                              onClick={() => setExpandedModelPlans(prev => prev.includes(plan.id) ? prev.filter(id => id !== plan.id) : [...prev, plan.id])}
                              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[13px] font-bold text-emerald-700"
                            >
                              <AppIcon icon={expandedModelPlans.includes(plan.id) ? ChevronUp : ChevronDown} className="h-3 w-3 mr-1" />
                              {expandedModelPlans.includes(plan.id) ? "Thu gọn" : `+${plan.allowedModels.length - DEFAULT_VISIBLE_MODELS}`}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[13px] font-black text-amber-700">
                          <AppIcon icon={Clock3} className="h-3.5 w-3.5" />
                          Đang cập nhật model...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 border-t border-slate-50 pt-6 lg:border-none lg:pt-0">
                    <p className="text-xl font-black text-slate-900">{isContactPlan(plan) ? "Liên hệ" : formatCurrency(plan.priceVnd)}</p>
                    <button 
                      onClick={() => handleChoosePlan(plan)} 
                      disabled={plan.allowedModels.length === 0 && !isContactPlan(plan)}
                      className={cn(
                        btnPrimary,
                        plan.allowedModels.length === 0 && !isContactPlan(plan) && "opacity-50 cursor-not-allowed grayscale"
                      )}
                    >
                      {isContactPlan(plan) ? (
                        <>
                          <AppIcon icon={Clock3} className="h-4 w-4" />
                          Liên hệ tư vấn
                        </>
                      ) : plan.allowedModels.length === 0 ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Tạm ngưng
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Chọn gói
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))
            )}
            
            {!isLoadingPlans && sortedPlans.length > 5 && (
              <div className="flex justify-center pt-6">
                <button onClick={() => setIsExpanded(!isExpanded)} className={btnSecondary}>
                  <AppIcon icon={isExpanded ? ChevronUp : ChevronDown} className="h-4 w-4" />
                  {isExpanded ? "Thu gọn danh sách" : `Xem thêm ${sortedPlans.length - 5} gói`}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/30 p-6 ring-1 ring-emerald-100/50">
            <div className="flex items-center gap-2 mb-4">
              <AppIcon icon={Sparkles} className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-900">Gợi ý chuyên gia</h3>
            </div>
            <p className="text-sm font-medium text-slate-500 leading-6">
              Dòng AI <b>{selectedFamily === null ? "Đa dạng" : selectedFamily}</b> đang có các gói cân bằng nhất, phù hợp cho đa số nhu cầu sử dụng cá nhân và doanh nghiệp nhỏ.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AppIcon icon={KeyRound} className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-black text-slate-900">Gói theo cấp</h3>
            </div>
            <div className="space-y-4 text-xs font-bold text-slate-500 leading-5">
              <p>• <b>Trial:</b> Trải nghiệm tính năng</p>
              <p>• <b>Mini/Plus:</b> Dùng cá nhân</p>
              <p>• <b>Pro/Max:</b> Tần suất cao</p>
              <p>• <b>Enterprise:</b> Quy mô lớn</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {isConfirmBuyOpen && selectedPlanToBuy && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <AppIcon icon={ShoppingCart} className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-black text-slate-950 tracking-tight">
                Xác nhận mua gói
              </h2>
            </div>

            <p className="text-sm font-medium leading-6 text-slate-500">
              {couponData?.valid && couponData.finalAmount === 0 
                ? "Bạn đang sử dụng mã giảm giá 100%. Gói credits sẽ được kích hoạt ngay lập tức." 
                : "Sau khi xác nhận, hệ thống sẽ tạo đơn hàng chờ thanh toán."}
            </p>

            <div className="mt-6 space-y-3.5 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gói</span>
                <span className="text-sm font-black text-slate-900">
                  {selectedPlanToBuy.name}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Dòng AI</span>
                <span className="text-sm font-black text-slate-900">
                  {getFamilyLabel(selectedPlanToBuy.apiFamily)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Credits</span>
                <span className="text-sm font-black text-emerald-600">
                  {formatCreditAmount(selectedPlanToBuy.credits)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Hiệu lực</span>
                <span className="text-sm font-black text-slate-900">
                  {selectedPlanToBuy.durationDays && selectedPlanToBuy.durationDays > 0 ? `${selectedPlanToBuy.durationDays} ngày` : "Không giới hạn thời gian"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">API key</span>
                <span className="text-sm font-black text-slate-900">
                  {selectedPlanToBuy.apiKeyLimit} key
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                <span className="text-sm font-black text-slate-600">Giá gốc</span>
                <span className={cn("text-lg font-black", couponData?.valid ? "text-slate-400 line-through" : "text-slate-900")}>
                  {formatCurrency(selectedPlanToBuy.priceVnd)}
                </span>
              </div>

              {couponData?.valid && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-black text-emerald-600">Giảm giá ({couponData.code})</span>
                  <span className="text-lg font-black text-emerald-600">
                    -{formatCurrency(couponData.discountAmount)}
                  </span>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between gap-4 border-t border-dashed border-slate-200 pt-4">
                <span className="text-base font-black text-slate-900">Tổng thanh toán</span>
                <span className="text-2xl font-black text-emerald-600">
                  {couponData?.valid && couponData.finalAmount === 0 
                    ? "Miễn phí" 
                    : formatCurrency(couponData?.valid ? couponData.finalAmount : selectedPlanToBuy.priceVnd)}
                </span>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="mt-6 space-y-3">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mã giảm giá (nếu có)</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponData(null);
                  }}
                  className={cn("w-full rounded-2xl border border-[#dfe5e1] bg-white px-5 py-3.5 text-sm font-bold text-[#0b0f0d] outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4] transition-all placeholder:text-[#8a9690]", "h-11 text-sm font-black uppercase tracking-widest")}
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={!couponCode || isValidatingCoupon}
                  className="rounded-2xl bg-slate-900 px-4 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50 transition-all shrink-0"
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
                className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest ml-1"
              >
                Chọn từ kho mã giảm giá của tôi →
              </button>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isCreatingOrder}
                onClick={() => {
                  setIsConfirmBuyOpen(false);
                  setSelectedPlanToBuy(null);
                }}
                className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmBuyPlan}
                disabled={isCreatingOrder}
                className="rounded-full bg-emerald-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
              >
                {isCreatingOrder ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </>
                ) : (
                  couponData?.valid && couponData.finalAmount === 0 ? "Nhận gói ngay" : "Xác nhận mua"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Coupons Selection Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TicketPercent className="h-4 w-4" />
                </div>
                <h2 className="text-xl font-black text-slate-950 tracking-tight">
                  Mã giảm giá của tôi
                </h2>
              </div>
              <button 
                onClick={() => setIsCouponModalOpen(false)}
                className="rounded-full p-2 hover:bg-slate-100 transition-colors"
              >
                <XCircle className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {isLoadingCoupons ? (
                [1, 2, 3].map(i => <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-slate-50" />)
              ) : myCoupons.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-slate-400">Bạn chưa có mã giảm giá nào.</p>
                </div>
              ) : (
                myCoupons.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCoupon(c.code)}
                    className="w-full text-left p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{c.name}</p>
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-0.5">{c.code}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-emerald-600">-{c.discountPercent}%</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400">
                        Đơn từ {formatCurrency(c.minOrderAmount)}
                      </p>
                      <span className="text-[10px] font-black text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        DÙNG NGAY →
                      </span>
                    </div>
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
    <Suspense fallback={<CardListSkeleton count={5} />}>
      <PlansPageContent />
    </Suspense>
  );
}
