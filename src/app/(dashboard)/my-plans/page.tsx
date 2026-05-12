"use client";

import { PlanSetupInstructions } from "@/components/dashboard/plan-setup-instructions";

import { formatModelName } from "@/lib/model-display";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Zap,
  History,
  CheckCircle2,
  KeyRound,
  Clock3,
  Cpu,
  Plus,
  Settings
} from "lucide-react";
import DashboardSubNav from "@/components/dashboard/dashboard-sub-nav";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { StatCardsSkeleton, CardListSkeleton } from "@/components/ui/page-skeleton";

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

export default function MyPlansPage() {
  const [buckets, setBuckets] = useState<MyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModelBucketIds, setExpandedModelBucketIds] = useState<Set<string>>(new Set());
  const [openInstructionBucketId, setOpenInstructionBucketId] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useToast(3000);

  const toggleExpandModel = (id: string) => {
    setExpandedModelBucketIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleInstruction = (id: string) => {
    setOpenInstructionBucketId(prev => prev === id ? null : id);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/my-plans", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Lỗi tải dữ liệu.");
      setBuckets(data.data ?? []);
    } catch {
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
    const activeBuckets = buckets.filter(b => b.isActive);
    const totalRemaining = buckets.reduce((sum, b) => sum + Number(b.creditsRemaining), 0);
    const totalUsed = buckets.reduce((sum, b) => sum + Number(b.usedCredits), 0);
    const activeKeys = buckets.reduce((sum, b) => sum + b.activeApiKeys, 0);

    return { totalRemaining, totalUsed, activeCount: activeBuckets.length, activeKeys };
  }, [buckets]);



  return (
    <div className="space-y-10 pb-20">
      <DashboardSubNav 
        items={[
          { label: "Mua credits", href: "/plans" },
          { label: "Gói của tôi", href: "/my-plans" },
        ]} 
      />
      <PageHeader 
        title="Gói của tôi" 
        description="Theo dõi credits, thời hạn và quản lý các gói credits đã sở hữu."
        icon={<Package className="h-8 w-8" />}
      />

      {/* Stats Cards */}
      {isLoading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className={ui.statLabel}>Credits còn lại</p>
              <Zap className="h-4 w-4 text-[#00d4a4]" />
            </div>
            <p className={cn(ui.statValue, "text-[#00d4a4]")}>{formatCredits(stats.totalRemaining)}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className={ui.statLabel}>Credits đã dùng</p>
              <History className="h-4 w-4 text-[#8a9690]" />
            </div>
            <p className={ui.statValue}>{formatCredits(stats.totalUsed)}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className={ui.statLabel}>Gói hoạt động</p>
              <CheckCircle2 className="h-4 w-4 text-[#00d4a4]" />
            </div>
            <p className={ui.statValue}>{stats.activeCount}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className={ui.statLabel}>API Key đang dùng</p>
              <KeyRound className="h-4 w-4 text-[#8a9690]" />
            </div>
            <p className={ui.statValue}>{stats.activeKeys}</p>
          </AppCard>
        </div>
      )}

      {/* Buckets List */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={ui.h3}>Danh sách gói sở hữu</h2>
          <AppButton variant="accent" onClick={() => window.location.href = "/plans"}>
            <Plus className="h-4 w-4 mr-2" />
            Mua thêm credits
          </AppButton>
        </div>

        {isLoading ? (
          <CardListSkeleton count={2} />
        ) : buckets.length === 0 ? (
          <div className="rounded-[40px] border border-dashed border-[#dfe5e1] bg-[#fbfbf8] p-10 sm:p-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white border border-[#dfe5e1] text-[#8a9690] mb-6 shadow-sm">
              <Package className="h-8 w-8" />
            </div>
            <h3 className={ui.h3}>Bạn chưa sở hữu gói nào.</h3>
            <p className={ui.p}>Khám phá cửa hàng để chọn gói credits phù hợp ngay.</p>
            <div className="mt-8 flex justify-center">
              <AppButton variant="accent" onClick={() => window.location.href = "/plans"}>
                <Plus className="h-4 w-4 mr-2" />
                Mua gói đầu tiên ngay
              </AppButton>
            </div>
          </div>
        ) : (
          <div className="grid gap-8">
            {buckets.map((bucket) => {
              const status = getBucketStatus(bucket.creditsRemaining, bucket.expiresAt, bucket.isActive);
              const remainingNum = Number(bucket.creditsRemaining);
              const totalNum = Number(bucket.creditsTotal);
              const progress = totalNum > 0 ? Math.round((remainingNum / totalNum) * 100) : 0;
              const isInstructionOpen = openInstructionBucketId === bucket.id;

              return (
                <AppCard
                  key={bucket.id}
                  variant="interactive"
                  className="p-8 sm:p-10"
                >
                  <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_420px]">
                    {/* Left side: Plan info + Progress */}
                    <div className="space-y-8">
                      <div className="flex flex-wrap items-start gap-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-slate-950 text-white shrink-0 shadow-lg shadow-slate-950/20">
                          <Package className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 pt-1">
                          <div className="flex flex-wrap items-center gap-3 mb-1.5">
                            <h3 className="text-2xl font-black text-slate-950 tracking-tight">{bucket.product?.name ?? "Gói Tùy Chỉnh"}</h3>
                            <StatusBadge 
                              status={status === "ACTIVE" ? "Đang hoạt động" : status === "EXPIRED" ? "Hết hạn" : status === "DEPLETED" ? "Hết credits" : "Đã thu hồi"} 
                              variant={status === "ACTIVE" ? "success" : "danger"} 
                            />
                          </div>
                          <div className="flex items-center gap-2">
                             <p className={cn(ui.label, "bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-black")}>{getFamilyLabel(bucket.apiFamily)}</p>
                             <span className="h-1 w-1 rounded-full bg-slate-200" />
                             <p className="text-xs font-bold text-slate-400">ID: {bucket.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                             <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Zap className="h-4 w-4" />
                             </div>
                             <p className={cn(ui.label, "text-slate-950 font-black")}>Credits khả dụng</p>
                          </div>
                          <p className="text-sm font-black text-slate-950">{progress}%</p>
                        </div>
                        <div className="h-3.5 w-full rounded-full bg-white p-0.5 ring-1 ring-slate-100 overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${progress > 20 ? "bg-[#00d4a4]" : "bg-red-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Còn lại</span>
                             <span className="text-lg font-black text-emerald-600">{formatCredits(bucket.creditsRemaining)}</span>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tổng định mức</span>
                             <span className="text-lg font-black text-slate-400">/ {formatCredits(bucket.creditsTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Meta + Actions */}
                    <div className="flex flex-col gap-5 border-t border-slate-100 pt-8 xl:border-none xl:pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-[24px] bg-slate-50 p-4 border border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <KeyRound className="h-4 w-4 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Keys</p>
                          </div>
                          <p className="text-lg font-black text-slate-950">{bucket.activeApiKeys} / {bucket.apiKeyLimit}</p>
                        </div>
                        <div className="rounded-[24px] bg-slate-50 p-4 border border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock3 className="h-4 w-4 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiệu lực</p>
                          </div>
                          <p className="text-lg font-black text-slate-950">
                            {bucket.expiresAt 
                              ? new Date(bucket.expiresAt).toLocaleDateString("vi-VN") 
                              : "Vô hạn"
                            }
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[24px] bg-slate-50 p-5 border border-slate-100 flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Models được phép</p>
                          </div>
                        </div>

                        {bucket.allowedModels && bucket.allowedModels.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {(expandedModelBucketIds.has(bucket.id)
                                ? bucket.allowedModels
                                : bucket.allowedModels.slice(0, 6)
                              ).map((m) => (
                                <span
                                  key={m.publicName}
                                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm transition-all hover:border-slate-950 hover:text-slate-950"
                                >
                                  {formatModelName(m.publicName)}
                                </span>
                              ))}
                            </div>

                            {bucket.allowedModels.length > 6 && (
                              <button
                                onClick={() => toggleExpandModel(bucket.id)}
                                className="text-[11px] font-black text-slate-400 hover:text-slate-950 uppercase tracking-widest transition-colors"
                              >
                                {expandedModelBucketIds.has(bucket.id) ? "Thu gọn" : `+ ${bucket.allowedModels.length - 6} model khác`}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600">
                            <Cpu className="h-3.5 w-3.5" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Chưa có model khả dụng</p>
                          </div>
                        )}
                      </div>

                      <AppButton 
                        variant={isInstructionOpen ? "primary" : "secondary"}
                        className={cn(
                          "h-14 rounded-2xl font-black text-sm transition-all duration-300",
                          isInstructionOpen ? "bg-slate-950 text-white shadow-lg shadow-slate-400/20" : "bg-white border-slate-200 hover:border-slate-950 text-slate-950"
                        )}
                        onClick={() => toggleInstruction(bucket.id)}
                      >
                        <Settings className={cn("h-4 w-4 mr-2 transition-transform duration-500", isInstructionOpen && "rotate-90")} />
                        {isInstructionOpen ? "Thu gọn hướng dẫn" : "Hướng dẫn tích hợp"}
                      </AppButton>
                    </div>
                  </div>

                  {/* Integration Instructions Panel (Full Width) */}
                  <PlanSetupInstructions 
                    bucketId={bucket.id}
                    productName={bucket.product?.name ?? "Gói Tùy Chỉnh"}

                    allowedModels={bucket.allowedModels}
                    apiKeys={bucket.apiKeys}
                    isOpen={isInstructionOpen}
                    onClose={() => toggleInstruction(bucket.id)}
                  />
                </AppCard>
              );
            })}
          </div>
        )}
      </section>

      {/* Toast */}
      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}
