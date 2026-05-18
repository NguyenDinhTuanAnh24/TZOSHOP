"use client";


import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  ShieldCheck,
  History,
  Sparkles,
  Code2,
  Layers,
  Cpu,
  CreditCard,
  KeyRound,
  CalendarDays
} from "lucide-react";
import { formatModelName } from "@/lib/model-display";

type ApiFamily = "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";

type Product = {
  id: string;
  name: string;
  slug: string;
  apiFamily: ApiFamily;
  credits: bigint | number;
  durationDays: number | null;
  priceVnd: number;
  allowedModels: string[];
  apiKeyLimit?: number;
  isPopular?: boolean;
  isContactOnly?: boolean;
};

type PricingContainerProps = {
  products: Product[];
};

function isAllModelsProduct(product: Pick<Product, "slug">) {
  return product.slug.startsWith("all_models_");
}

const commonFeatures = [
  {
    icon: CheckCircle2,
    title: "Quản lý credits linh hoạt",
    desc: "Theo dõi số dư credits cho từng dòng AI của bạn."
  },
  {
    icon: ShieldCheck,
    title: "Tạo API key theo gói",
    desc: "Tạo key riêng biệt cho từng extension hoặc ứng dụng."
  },
  {
    icon: History,
    title: "Theo dõi lịch sử sử dụng",
    desc: "Xem chi tiết từng lượt gọi API và số credits đã dùng."
  }
];

function formatCredits(credits: bigint | number) {
  const num = Number(credits);
  if (Number.isInteger(num)) {
    return new Intl.NumberFormat("en-US").format(num);
  }
  return num.toFixed(6).replace(/\.?0+$/, "");
}

function formatCreditsWithUnit(credits: bigint | number) {
  return `${formatCredits(credits)} credits`;
}

function formatVnd(price: number) {
  return `${price.toLocaleString("vi-VN")} đ`;
}

function formatDuration(days: number | null) {
  if (days === 30) return "30 ngày";
  if (days === 365) return "1 năm";
  if (days && days > 0) return `${days} ngày`;
  return "Không giới hạn";
}

const MAX_VISIBLE_MODELS = 2;

export function PricingContainer({ products }: PricingContainerProps) {
  const router = useRouter();
  const { status } = useSession();

  // Ánh xạ chi tiết custom dựa theo slug sản phẩm như mong muốn
  const productsWithDetails = products.map((product) => {
    if (isAllModelsProduct(product)) {
      return {
        ...product,
        familyLabel: "Tất cả model",
        badge: "Đề xuất",
        badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
        description: "Dùng được toàn bộ model Codex, Claude, Gemini và DeepSeek trong một gói duy nhất.",
        accentClass: "border-indigo-300 ring-2 ring-indigo-100 bg-gradient-to-b from-indigo-50/10 via-white to-white shadow-[0_20px_50px_-12px_rgba(79,70,229,0.25)]",
        btnClass: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-[0_10px_25px_-10px_rgba(79,70,229,0.5)] focus:ring-indigo-500",
        icon: Sparkles,
        iconClass: "text-indigo-600 bg-indigo-50",
        previewChips:
          product.allowedModels.length > 0
            ? product.allowedModels.slice(0, MAX_VISIBLE_MODELS)
            : ["Codex", "Claude", "Gemini", "DeepSeek"],
        previewFallbackCount:
          product.allowedModels.length > 0
            ? product.allowedModels.length - Math.min(MAX_VISIBLE_MODELS, product.allowedModels.length)
            : 0,
        isFeatured: true
      };
    }

    if (product.slug.startsWith("codex_")) {
      return {
        ...product,
        familyLabel: "Codex",
        badge: "Lập trình",
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
        description: "Phù hợp cho lập trình, IDE, extension và các tác vụ xử lý code.",
        accentClass: "border-slate-200 hover:border-blue-300 hover:shadow-md bg-white shadow-sm",
        btnClass: "bg-slate-900 hover:bg-slate-800 text-white shadow-sm focus:ring-slate-900",
        icon: Code2,
        iconClass: "text-blue-600 bg-blue-50",
        previewChips: product.allowedModels.length > 0 ? product.allowedModels.slice(0, MAX_VISIBLE_MODELS) : ["CodexAI"],
        previewFallbackCount: product.allowedModels.length > MAX_VISIBLE_MODELS ? product.allowedModels.length - MAX_VISIBLE_MODELS : 0,
        isFeatured: false
      };
    }

    if (product.slug.startsWith("claude_")) {
      return {
        ...product,
        familyLabel: "Claude",
        badge: "Phân tích",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
        description: "Phù hợp cho phân tích tài liệu, viết nội dung và xử lý ngữ cảnh dài.",
        accentClass: "border-slate-200 hover:border-amber-300 hover:shadow-md bg-white shadow-sm",
        btnClass: "bg-slate-900 hover:bg-slate-800 text-white shadow-sm focus:ring-slate-900",
        icon: Layers,
        iconClass: "text-amber-600 bg-amber-50",
        previewChips: product.allowedModels.length > 0 ? product.allowedModels.slice(0, MAX_VISIBLE_MODELS) : ["Claude"],
        previewFallbackCount: product.allowedModels.length > MAX_VISIBLE_MODELS ? product.allowedModels.length - MAX_VISIBLE_MODELS : 0,
        isFeatured: false
      };
    }

    if (product.slug.startsWith("gemini_")) {
      return {
        ...product,
        familyLabel: "Gemini",
        badge: "Đa nhiệm",
        badgeClass: "bg-sky-100 text-sky-700 border-sky-200",
        description: "Phù hợp cho nhu cầu đa nhiệm, tốc độ nhanh và sử dụng hằng ngày.",
        accentClass: "border-slate-200 hover:border-sky-300 hover:shadow-md bg-white shadow-sm",
        btnClass: "bg-slate-900 hover:bg-slate-800 text-white shadow-sm focus:ring-slate-900",
        icon: Cpu,
        iconClass: "text-sky-600 bg-sky-50",
        previewChips: product.allowedModels.length > 0 ? product.allowedModels.slice(0, MAX_VISIBLE_MODELS) : ["Gemini"],
        previewFallbackCount: product.allowedModels.length > MAX_VISIBLE_MODELS ? product.allowedModels.length - MAX_VISIBLE_MODELS : 0,
        isFeatured: false
      };
    }

    if (product.slug.startsWith("deepseek_")) {
      return {
        ...product,
        familyLabel: "DeepSeek",
        badge: "Tiết kiệm",
        badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
        description: "Phù hợp khi cần tối ưu chi phí nhưng vẫn có hiệu năng tốt.",
        accentClass: "border-slate-200 hover:border-emerald-300 hover:shadow-md bg-white shadow-sm",
        btnClass: "bg-slate-900 hover:bg-slate-800 text-white shadow-sm focus:ring-slate-900",
        icon: CreditCard,
        iconClass: "text-emerald-600 bg-emerald-50",
        previewChips: product.allowedModels.length > 0 ? product.allowedModels.slice(0, MAX_VISIBLE_MODELS) : ["DeepSeek"],
        previewFallbackCount: product.allowedModels.length > MAX_VISIBLE_MODELS ? product.allowedModels.length - MAX_VISIBLE_MODELS : 0,
        isFeatured: false
      };
    }

    // Fallback mặc định phòng hờ
    return {
      ...product,
      familyLabel: String(product.apiFamily),
      badge: "Credits",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      description: "Gói credits phục vụ đắc lực các nhu cầu AI của bạn.",
      accentClass: "border-slate-200 hover:border-slate-300 bg-white shadow-sm",
      btnClass: "bg-slate-900 hover:bg-slate-800 text-white shadow-sm focus:ring-slate-900",
      icon: Sparkles,
      iconClass: "text-slate-600 bg-slate-50",
      previewChips: product.allowedModels.slice(0, MAX_VISIBLE_MODELS),
      previewFallbackCount: product.allowedModels.length > MAX_VISIBLE_MODELS ? product.allowedModels.length - MAX_VISIBLE_MODELS : 0,
      isFeatured: false
    };
  });

  function handlePurchase(productId: string) {
    const targetUrl = `/plans?product=${productId}`;
    if (status === "authenticated") {
      router.push(targetUrl);
    } else {
      router.push(`/login?callbackUrl=${encodeURIComponent(targetUrl)}`);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Tính năng nổi bật phía trên */}
      <div className="mb-16 grid gap-6 md:grid-cols-3">
        {commonFeatures.map((item) => (
          <div
            key={item.title}
            className="flex gap-4 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(148,163,184,0.12)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(148,163,184,0.18)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50/50 text-indigo-600">
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{item.title}</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid danh sách 5 gói cước */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {productsWithDetails.map((plan) => {
          const IconComponent = plan.icon;

          return (
            <article
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-7 transition-all duration-300 ${plan.accentClass}`}
            >
              <div>
                {/* Header Card: Icon, Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${plan.iconClass}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${plan.badgeClass}`}>
                      {plan.badge}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 uppercase">
                      {plan.familyLabel}
                    </span>
                  </div>
                </div>

                {/* Tên sản phẩm */}
                <h3 className="mt-5 text-xl font-extrabold text-slate-950 tracking-tight">
                  {plan.name}
                </h3>

                {/* Mô tả ngắn */}
                <p className="mt-2.5 text-sm text-slate-500 leading-relaxed font-medium">
                  {plan.description}
                </p>

                {/* Khối Credits nổi bật */}
                <div className="mt-6 rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hạn mức Credits
                  </span>
                  <p className="mt-1 text-3xl font-black text-slate-950 tracking-tight">
                    {formatCreditsWithUnit(plan.credits)}
                  </p>
                </div>

                {/* Chi tiết hiệu lực */}
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 px-3.5 py-2">
                    <span className="inline-flex items-center gap-2 text-slate-500 font-semibold text-xs">
                      <CalendarDays className="h-4 w-4 text-indigo-500 shrink-0" /> Hiệu lực
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {formatDuration(plan.durationDays)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 px-3.5 py-2">
                    <span className="inline-flex items-center gap-2 text-slate-500 font-semibold text-xs">
                      <KeyRound className="h-4 w-4 text-violet-500 shrink-0" /> API key tối đa
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {plan.apiKeyLimit || 1} key
                    </span>
                  </div>
                </div>

                {/* Model AI Hỗ trợ */}
                <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Dòng Model Hỗ trợ
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plan.previewChips.map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50/50 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                      >
                        {formatModelName(chip)}
                      </span>
                    ))}
                    {plan.previewFallbackCount > 0 && (
                      <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/40 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        +{plan.previewFallbackCount} model
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Phần chân Card: Giá & Nút chọn */}
              <div className="mt-7">
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-slate-950 tracking-tight">
                    {formatVnd(plan.priceVnd)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ gói</span>
                </div>

                <button
                  type="button"
                  onClick={() => handlePurchase(plan.id)}
                  className={`inline-flex w-full min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-extrabold tracking-wide transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] outline-none ${plan.btnClass}`}
                >
                  Chọn gói này
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
