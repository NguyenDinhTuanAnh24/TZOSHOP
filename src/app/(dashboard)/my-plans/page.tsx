"use client";

import { PlanSetupInstructions } from "@/components/dashboard/plan-setup-instructions";
import { formatModelName } from "@/lib/model-display";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { Package, PackageCheck, Zap, History, CheckCircle2, KeyRound, Plus, Settings, RefreshCw } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ApiFamily = "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";

type MyPlanItem = {
  id: string;
  apiFamily: ApiFamily;
  creditsTotal: string;
  creditsRemaining: string;
  usedCredits: string;
  apiKeyLimit: number;
  activeApiKeys: number;
  apiKeys: import("@/components/dashboard/plan-setup-instructions").ApiKey[];
  allowedModels: import("@/components/dashboard/plan-setup-instructions").AllowedModel[];
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    tier: string;
  } | null;
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

function formatCredits(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("vi-VN").format(num);
}

function getBucketStatus(remaining: string, expiresAt: string | null, isActive: boolean) {
  const now = new Date();
  const rem = Number(remaining);
  if (!isActive) return "REVOKED";
  if (expiresAt && new Date(expiresAt) < now) return "EXPIRED";
  if (rem <= 0) return "DEPLETED";
  return "ACTIVE";
}

function MyPlansPageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14" />
              <Skeleton className="h-9 w-52" />
            </div>
            <Skeleton className="h-4 w-full max-w-[500px]" />
          </div>
          <Skeleton className="h-12 w-44" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-h-[120px] border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-9" />
            </div>
            <Skeleton className="mt-5 h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-6 w-56" />
          </div>
          <Skeleton className="h-11 w-44" />
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000]">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[...Array(4)].map((__, j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </div>
              <Skeleton className="mt-5 h-5 w-full" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function MyPlansPage() {
  const [buckets, setBuckets] = useState<MyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedModelBucketIds, setExpandedModelBucketIds] = useState<Set<string>>(new Set());
  const [openInstructionBucketId, setOpenInstructionBucketId] = useState<string | null>(null);
  const [nowTs] = useState(() => Date.now());
  const { toast, showToast, clearToast } = useToast(3000);

  const toggleExpandModel = (id: string) => {
    setExpandedModelBucketIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleInstruction = (id: string) => {
    setOpenInstructionBucketId((prev) => (prev === id ? null : id));
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const response = await fetch("/api/my-plans", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Lỗi tải dữ liệu.");
      setBuckets(data.data ?? []);
    } catch {
      setLoadError(true);
      showToast("Không thể tải dữ liệu gói.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const stats = useMemo(() => {
    const activeBuckets = buckets.filter((b) => b.isActive);
    const totalRemaining = buckets.reduce((sum, b) => sum + Number(b.creditsRemaining), 0);
    const totalUsed = buckets.reduce((sum, b) => sum + Number(b.usedCredits), 0);
    const activeKeys = buckets.reduce((sum, b) => sum + b.activeApiKeys, 0);
    return { totalRemaining, totalUsed, activeCount: activeBuckets.length, activeKeys };
  }, [buckets]);

  return (
    <div className="space-y-8 overflow-x-hidden px-5 py-6 md:px-6 lg:px-8 lg:py-8" aria-busy={isLoading}>
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <PackageCheck className="h-7 w-7 text-black" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-black md:text-4xl">GÓI CỦA TÔI</h1>
            </div>
            <p className="text-sm font-bold text-black/70 md:text-base">
              Theo dõi credits, thời hạn và quản lý các gói credits đã sở hữu.
            </p>
          </div>
          <AppButton variant="accent" onClick={() => window.location.href = "/plans"} className="h-12 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Mua thêm credits
          </AppButton>
        </div>
      </section>

      {isLoading ? (
        <MyPlansPageSkeleton />
      ) : loadError ? (
        <div className="border-4 border-black bg-[#FF6B6B] p-6 shadow-[8px_8px_0px_0px_#000]">
          <h3 className="text-xl font-black uppercase text-black">KHÔNG THỂ TẢI GÓI CỦA BẠN</h3>
          <p className="mt-2 text-sm font-bold text-black/80">
            Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu lỗi tiếp tục xảy ra.
          </p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-5 inline-flex h-11 items-center justify-center border-4 border-black bg-white px-5 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:bg-[#FFD93D]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            THỬ LẠI
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Credits còn lại",
                value: formatCredits(stats.totalRemaining),
                sub: "Có thể sử dụng",
                icon: Zap,
                bg: "bg-[#C7F0D8]",
              },
              {
                label: "Credits đã dùng",
                value: formatCredits(stats.totalUsed),
                sub: "Đã tiêu thụ",
                icon: History,
                bg: "bg-[#A78BFA]",
              },
              {
                label: "Gói hoạt động",
                value: String(stats.activeCount),
                sub: "Đang hoạt động",
                icon: CheckCircle2,
                bg: "bg-[#FFD93D]",
              },
              {
                label: "API key đang dùng",
                value: String(stats.activeKeys),
                sub: "Đang sử dụng",
                icon: KeyRound,
                bg: "bg-[#FF6B6B]",
              },
            ].map((s) => (
              <article
                key={s.label}
                className="min-h-[120px] border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black">{s.label}</p>
                  <div className={`flex h-9 w-9 items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_#000] ${s.bg}`}>
                    <s.icon className="h-4 w-4 text-black" />
                  </div>
                </div>
                <p className="mt-5 text-3xl font-black leading-none text-black">{s.value}</p>
                <p className="mt-2 text-xs font-bold uppercase text-black/70">{s.sub}</p>
              </article>
            ))}
          </div>

          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#FFD93D] shadow-[2px_2px_0px_0px_#000]">
                  <Package className="h-5 w-5 text-black" />
                </span>
                <h2 className="text-2xl font-black text-black">DANH SÁCH GÓI SỞ HỮU</h2>
              </div>
              <AppButton variant="accent" onClick={() => window.location.href = "/plans"} className="h-11 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Mua thêm credits
              </AppButton>
            </div>

            {buckets.length === 0 ? (
              <div className="relative flex min-h-[320px] flex-col items-center justify-center overflow-visible border-4 border-black bg-[#FFFDF5] p-10 text-center shadow-[8px_8px_0px_0px_#000]">
                <div className="pointer-events-none absolute -bottom-3 -right-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                    <Package className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-xl font-black leading-tight text-black md:text-2xl">BẠN CHƯA SỞ HỮU GÓI NÀO</h3>
                  <p className="mt-3 max-w-[520px] text-sm font-bold text-black/70 md:text-base">
                    Khám phá cửa hàng để chọn gói credits phù hợp ngay.
                  </p>
                  <AppButton variant="accent" onClick={() => window.location.href = "/plans"} className="mt-6 h-12 px-8">
                    <Plus className="mr-2 h-4 w-4" />
                    Mua gói đầu tiên ngay
                  </AppButton>
                </div>
              </div>
            ) : (
              <div className="grid gap-5">
                {buckets.map((bucket) => {
                  const status = getBucketStatus(bucket.creditsRemaining, bucket.expiresAt, bucket.isActive);
                  const remainingNum = Number(bucket.creditsRemaining);
                  const totalNum = Number(bucket.creditsTotal);
                  const usedPercent = totalNum > 0 ? Math.round(((totalNum - remainingNum) / totalNum) * 100) : 0;
                  const isInstructionOpen = openInstructionBucketId === bucket.id;

                  return (
                    <article
                      key={bucket.id}
                      className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6"
                    >
                      <div className="mb-5 flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black text-black">{bucket.product?.name ?? "Gói tùy chỉnh"}</h3>
                        <span className="inline-flex border-2 border-black bg-[#FFFDF5] px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                          {getFamilyLabel(bucket.apiFamily)}
                        </span>
                        <StatusBadge
                          status={
                            status === "ACTIVE"
                              ? "ĐANG HOẠT ĐỘNG"
                              : status === "EXPIRED"
                                ? "ĐÃ HẾT HẠN"
                                : status === "DEPLETED"
                                  ? "ĐÃ HẾT HẠN"
                                  : "ĐÃ HẾT HẠN"
                          }
                          variant={status === "ACTIVE" ? "success" : "danger"}
                        />
                        {status === "ACTIVE" && bucket.expiresAt && new Date(bucket.expiresAt).getTime() - nowTs < 7 * 24 * 60 * 60 * 1000 && (
                          <StatusBadge status="SẮP HẾT HẠN" variant="warning" />
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="w-full min-w-0 border-4 border-black bg-[#C7F0D8] px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
                          <p className="text-[11px] font-bold uppercase text-black/70">Credits còn lại</p>
                          <p className="text-xl font-black text-black">{formatCredits(bucket.creditsRemaining)}</p>
                        </div>
                        <div className="w-full min-w-0 border-4 border-black bg-[#E9E1D0] px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
                          <p className="text-[11px] font-bold uppercase text-black/70">Credits đã dùng</p>
                          <p className="text-xl font-black text-black">{formatCredits(bucket.usedCredits)}</p>
                        </div>
                        <div className="w-full min-w-0 border-4 border-black bg-[#FFFDF5] px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
                          <p className="text-[11px] font-bold uppercase text-black/70">Hiệu lực</p>
                          <p className="text-base font-black text-black">{bucket.expiresAt ? new Date(bucket.expiresAt).toLocaleDateString("vi-VN") : "Vô hạn"}</p>
                        </div>
                        <div className="w-full min-w-0 border-4 border-black bg-[#FFFDF5] px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
                          <p className="text-[11px] font-bold uppercase text-black/70">API key đang dùng</p>
                          <p className="text-xl font-black text-black">{bucket.activeApiKeys}/{bucket.apiKeyLimit}</p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="mb-2 text-xs font-black uppercase text-black">Tiến độ sử dụng {usedPercent}%</p>
                        <div className="h-5 overflow-hidden border-4 border-black bg-[#E9E1D0] shadow-[2px_2px_0px_0px_#000]" aria-label={`Đã dùng ${usedPercent}%`}>
                          <div className="h-full bg-[#FFD93D]" style={{ width: `${usedPercent}%` }} />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <AppButton variant="primary" onClick={() => window.location.href = "/api-keys"} className="h-11">
                          Tạo API key
                        </AppButton>
                        <AppButton variant="secondary" onClick={() => window.location.href = "/api-keys"} className="h-11">
                          Xem API Keys
                        </AppButton>
                        <AppButton
                          variant={isInstructionOpen ? "primary" : "secondary"}
                          className="h-11"
                          onClick={() => toggleInstruction(bucket.id)}
                        >
                          <Settings className={cn("mr-2 h-4 w-4 transition-transform", isInstructionOpen && "rotate-90")} />
                          {isInstructionOpen ? "Thu gọn" : "Xem chi tiết"}
                        </AppButton>
                      </div>

                      <div className="mt-5 rounded-[8px] border-4 border-black bg-[#FFFDF5] p-4">
                        <p className="mb-3 text-[11px] font-black uppercase text-black/70">Models được phép</p>
                        {bucket.allowedModels && bucket.allowedModels.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(expandedModelBucketIds.has(bucket.id) ? bucket.allowedModels : bucket.allowedModels.slice(0, 6)).map((m) => (
                              <span
                                key={m.publicName}
                                className="inline-flex items-center border-2 border-black bg-white px-3 py-1.5 text-[11px] font-black text-black shadow-[2px_2px_0px_0px_#000]"
                              >
                                {formatModelName(m.publicName)}
                              </span>
                            ))}
                            {bucket.allowedModels.length > 6 && (
                              <button
                                onClick={() => toggleExpandModel(bucket.id)}
                                className="inline-flex items-center border-2 border-black bg-[#C7F0D8] px-3 py-1.5 text-[11px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]"
                              >
                                {expandedModelBucketIds.has(bucket.id) ? "Thu gọn" : `+${bucket.allowedModels.length - 6}`}
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-black/70">Chưa có model khả dụng.</p>
                        )}
                      </div>

                      <PlanSetupInstructions
                        bucketId={bucket.id}
                        productName={bucket.product?.name ?? "Gói tùy chỉnh"}
                        allowedModels={bucket.allowedModels}
                        apiKeys={bucket.apiKeys}
                        isOpen={isInstructionOpen}
                        onClose={() => toggleInstruction(bucket.id)}
                      />
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
