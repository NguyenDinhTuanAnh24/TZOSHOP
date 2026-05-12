"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Zap,
  History,
  CheckCircle2,
  KeyRound,
  Clock3,
  AlertCircle,
  Cpu,
  Plus
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
  allowedModels: string[];
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
  const { toast, showToast, clearToast } = useToast(3000);

  const toggleExpandModel = (id: string) => {
    setExpandedModelBucketIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/my-plans", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Lỗi tải dữ liệu.");
      setBuckets(data.data ?? []);
    } catch (error) {
      showToast("Không thể tải dữ liệu gói.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
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
          <div className="grid gap-6">
            {buckets.map((bucket) => {
              const status = getBucketStatus(bucket.creditsRemaining, bucket.expiresAt, bucket.isActive);
              const remainingNum = Number(bucket.creditsRemaining);
              const totalNum = Number(bucket.creditsTotal);
              const progress = totalNum > 0 ? Math.round((remainingNum / totalNum) * 100) : 0;

              return (
                <AppCard
                  key={bucket.id}
                  variant="interactive"
                  className="flex flex-col gap-6 lg:flex-row lg:items-center group p-8"
                >
                  <div className="flex-1 min-w-0 space-y-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7fff7] text-[#00d4a4] shrink-0 border border-[#00d4a4]/20">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className={ui.h3}>{bucket.product?.name ?? "Gói Tùy Chỉnh"}</h3>
                          <StatusBadge 
                            status={status === "ACTIVE" ? "Đang hoạt động" : status === "EXPIRED" ? "Hết hạn" : status === "DEPLETED" ? "Hết credits" : "Đã thu hồi"} 
                            variant={status === "ACTIVE" ? "success" : "danger"} 
                          />
                        </div>
                        <p className={cn(ui.label, "mt-1")}>{getFamilyLabel(bucket.apiFamily)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(ui.label, "flex items-center gap-2")}>
                          <Zap className="h-3.5 w-3.5" />
                          Credits còn lại
                        </p>
                        <p className="text-sm font-black text-[#0b0f0d]">{progress}%</p>
                      </div>
                      <div className="h-3 w-full rounded-full bg-[#fbfbf8] p-0.5 ring-1 ring-[#edf1ee] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progress > 20 ? "bg-[#00d4a4]" : "bg-red-500"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm font-black gap-2">
                        <span className="text-[#00d4a4] truncate">{formatCredits(bucket.creditsRemaining)}</span>
                        <span className="text-[#8a9690] truncate">/ {formatCredits(bucket.creditsTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:w-[400px] border-t border-[#edf1ee] pt-6 lg:border-none lg:pt-0">
                    <div className="rounded-2xl bg-[#fbfbf8] p-4 ring-1 ring-[#edf1ee]">
                      <div className="flex items-center gap-2 mb-2">
                        <KeyRound className="h-3.5 w-3.5 text-[#8a9690]" />
                        <p className={ui.label}>API Keys</p>
                      </div>
                      <p className="text-base font-black text-[#0b0f0d]">{bucket.activeApiKeys} / {bucket.apiKeyLimit}</p>
                    </div>
                    <div className="rounded-2xl bg-[#fbfbf8] p-4 ring-1 ring-[#edf1ee]">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock3 className="h-3.5 w-3.5 text-[#8a9690]" />
                        <p className={ui.label}>
                          {bucket.expiresAt ? "Ngày hết hạn" : "Hiệu lực"}
                        </p>
                      </div>
                      <p className="text-base font-black text-[#0b0f0d]">
                        {bucket.expiresAt 
                          ? new Date(bucket.expiresAt).toLocaleDateString("vi-VN") 
                          : "Không giới hạn thời gian"
                        }
                      </p>
                    </div>
                    <div className="col-span-full rounded-2xl bg-[#fbfbf8] p-4 sm:p-5 ring-1 ring-[#edf1ee]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-[#8a9690]" />
                          <p className={ui.label}>Models được phép</p>
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
                                  key={m}
                                  className="inline-flex items-center rounded-full border border-[#dfe5e1] bg-white px-3 py-1.5 text-xs font-bold text-[#47524d] shadow-sm transition-colors hover:border-[#00d4a4]"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>

                            {bucket.allowedModels.length > 6 && (
                              <AppButton
                                onClick={() => toggleExpandModel(bucket.id)}
                                variant="secondary"
                                size="sm"
                              >
                                {expandedModelBucketIds.has(bucket.id) ? (
                                  "Thu gọn"
                                ) : (
                                  `Xem tất cả ${bucket.allowedModels.length} model`
                                )}
                              </AppButton>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-slate-500 italic">
                            Chưa có model được cấu hình.
                          </p>
                        )}
                      </div>
                    </div>
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
