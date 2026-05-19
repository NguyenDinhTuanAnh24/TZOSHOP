"use client";


import { PlanSetupInstructions } from "@/components/dashboard/plan-setup-instructions";
import { formatModelName } from "@/lib/model-display";
import { formatCredits } from "@/lib/credits";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  CalendarClock,
  KeyRound,
  Wallet,
  Plus,
  Settings,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAiLineFromProductSlug, getAiLineLabelFromSlug, getAiLineLabelFromApiFamily, type AiLine } from "@/lib/ai-line";
import { CosmicButton } from "@/components/ui/cosmic-button";
import {
  FilterBarSkeleton,
  PageHeaderSkeleton,
  PlanGridSkeleton,
  SummaryCardsSkeleton,
} from "@/components/skeletons/dashboard-skeletons";
import { AdminPagination } from "@/components/admin/admin-pagination";

type StatusFilter = "all" | "active" | "expiring" | "expired";

const MAX_VISIBLE_MODELS = 3;
const EXPIRING_DAYS = 3;

type MyPlanItem = {
  id: string;
  apiFamily: "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
  creditsTotal: string;
  creditsRemaining: string;
  usedCredits: string;
  newApiQuotaRemaining?: string | null;
  newApiQuotaTotal?: string | null;
  newApiQuotaUsed?: string | null;
  quotaSource?: "DB" | "NEWAPI";
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

function getDisplayAiFamily(bucket: { product?: { slug: string } | null; apiFamily: string }) {
  if (bucket.product?.slug) return getAiLineLabelFromSlug(bucket.product.slug);
  return getAiLineLabelFromApiFamily(bucket.apiFamily);
}



function getPlanStatus(bucket: MyPlanItem, nowTs: number): "active" | "expiring" | "expired" {
  if (!bucket.isActive) return "expired";
  if (bucket.expiresAt && new Date(bucket.expiresAt).getTime() < nowTs) return "expired";
  const remaining = Number(bucket.creditsRemaining);
  if (remaining <= 0) return "expired";
  if (bucket.expiresAt) {
    const diff = new Date(bucket.expiresAt).getTime() - nowTs;
    if (diff <= EXPIRING_DAYS * 24 * 60 * 60 * 1000) return "expiring";
  }
  return "active";
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
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

function MyPlansPageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <PageHeaderSkeleton />
      <SummaryCardsSkeleton count={4} />
      <FilterBarSkeleton />
      <PlanGridSkeleton count={4} />
    </div>
  );
}

export default function MyPlansPage() {
  const [buckets, setBuckets] = useState<MyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedModelBucketIds, setExpandedModelBucketIds] = useState<Set<string>>(new Set());
  const [openInstructionBucketId, setOpenInstructionBucketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [familyFilter, setFamilyFilter] = useState<AiLine | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [createModalBucket, setCreateModalBucket] = useState<MyPlanItem | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  const [nowTs] = useState(() => Date.now());
  const { toast, showToast, clearToast } = useToast(3000);

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

  const handleCreateApiKey = async () => {
    if (!createModalBucket || !newKeyName.trim()) return;
    try {
      setIsCreatingKey(true);
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          creditBucketId: createModalBucket.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Không thể tạo API key.");
      showToast("Đã tạo API key thành công.", "success");
      setCreateModalBucket(null);
      setNewKeyName("");
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể tạo API key.", "error");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const stats = useMemo(() => {
    const withStatus = buckets.map((b) => ({ ...b, status: getPlanStatus(b, nowTs) }));
    const activeCount = withStatus.filter((b) => b.status === "active").length;
    const expiringCount = withStatus.filter((b) => b.status === "expiring").length;
    const totalRemaining = withStatus.reduce((sum, b) => {
      const isNewApi = b.quotaSource === "NEWAPI";
      const rem = isNewApi && b.newApiQuotaRemaining != null
        ? Number(b.newApiQuotaRemaining)
        : Number(b.creditsRemaining);
      return sum + rem;
    }, 0);
    const activeKeys = withStatus.reduce((sum, b) => sum + b.activeApiKeys, 0);
    return { activeCount, expiringCount, totalRemaining, activeKeys };
  }, [buckets, nowTs]);

  const availableFamilies = useMemo(() => {
    const set = new Set<AiLine>();
    buckets.forEach((b) => {
      const line = b.product?.slug ? getAiLineFromProductSlug(b.product.slug) : null;
      if (line) set.add(line);
    });
    return Array.from(set);
  }, [buckets]);

  const filteredBuckets = useMemo(() => {
    return buckets.filter((bucket) => {
      const status = getPlanStatus(bucket, nowTs);
      const statusMatched = statusFilter === "all" ? status !== "expired" : status === statusFilter;
      const line = bucket.product?.slug ? getAiLineFromProductSlug(bucket.product.slug) : null;
      const familyMatched = familyFilter === "all" ? true : line === familyFilter;
      return statusMatched && familyMatched;
    });
  }, [buckets, familyFilter, nowTs, statusFilter]);

  const totalPages = useMemo(() => Math.max(Math.ceil(filteredBuckets.length / pageSize), 1), [filteredBuckets.length, pageSize]);
  const currentPage = Math.min(page, totalPages);

  const paginatedBuckets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBuckets.slice(start, start + pageSize);
  }, [currentPage, filteredBuckets, pageSize]);

  return (
    <div className="space-y-8 overflow-x-hidden" aria-busy={isLoading}>

      {isLoading ? (
        <MyPlansPageSkeleton />
      ) : loadError ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-950">Không thể tải gói của bạn</h3>
          <p className="mt-2 text-sm text-slate-600">Vui lòng thử lại sau ít phút.</p>
          <CosmicButton variant="secondary" className="mt-5" onClick={() => void loadData()}>
            <RefreshCw className="h-4 w-4" /> Thử lại
          </CosmicButton>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Gói đang hoạt động",
                value: String(stats.activeCount),
                sub: "Đang sử dụng",
                icon: Package,
                iconClass: "bg-indigo-50 text-indigo-600",
              },
              {
                label: "Tổng credits còn lại",
                value: `${formatCredits(stats.totalRemaining)} credits`,
                sub: "Có thể dùng",
                icon: Wallet,
                iconClass: "bg-violet-50 text-violet-600",
              },
              {
                label: "API keys đang dùng",
                value: String(stats.activeKeys),
                sub: "Đang hoạt động",
                icon: KeyRound,
                iconClass: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "Gói sắp hết hạn",
                value: String(stats.expiringCount),
                sub: `Trong ${EXPIRING_DAYS} ngày`,
                icon: CalendarClock,
                iconClass: "bg-amber-50 text-amber-600",
              },
            ].map((s) => (
              <article
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{s.label}</p>
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.iconClass)}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{s.value}</p>
                <p className="mt-2 text-xs text-slate-600">{s.sub}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex gap-2 overflow-x-auto">
              <FilterChip active={statusFilter === "all"} onClick={() => { setStatusFilter("all"); setPage(1); }}>Tất cả</FilterChip>
              <FilterChip active={statusFilter === "active"} onClick={() => { setStatusFilter("active"); setPage(1); }}>Đang hoạt động</FilterChip>
              <FilterChip active={statusFilter === "expiring"} onClick={() => { setStatusFilter("expiring"); setPage(1); }}>Sắp hết hạn</FilterChip>
              <FilterChip active={statusFilter === "expired"} onClick={() => { setStatusFilter("expired"); setPage(1); }}>Đã hết hạn</FilterChip>
            </div>
            {availableFamilies.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto border-t border-slate-100 pt-2">
                <FilterChip active={familyFilter === "all"} onClick={() => { setFamilyFilter("all"); setPage(1); }}>Tất cả dòng AI</FilterChip>
                {availableFamilies.map((family) => (
                  <FilterChip key={family} active={familyFilter === family} onClick={() => { setFamilyFilter(family); setPage(1); }}>
                    {family === "ALL_MODELS" ? "All Models" : getAiLineLabelFromApiFamily(family)}
                  </FilterChip>
                ))}
              </div>
            )}
          </div>

          {buckets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-950">Bạn chưa có gói credits nào</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
                Hãy chọn một gói phù hợp để bắt đầu sử dụng AI với TzoShop.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CosmicButton href="/plans">Xem gói credits</CosmicButton>
                <CosmicButton href="/api-docs" variant="secondary">Tài liệu API</CosmicButton>
              </div>
            </div>
          ) : filteredBuckets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h3 className="text-xl font-bold text-slate-950">Không có gói phù hợp bộ lọc</h3>
              <p className="mt-2 text-sm text-slate-600">Hãy thử đổi trạng thái hoặc dòng AI.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {paginatedBuckets.map((bucket) => {
                const status = getPlanStatus(bucket, nowTs);
                const isNewApi = bucket.quotaSource === "NEWAPI";
                const remainingNum = isNewApi && bucket.newApiQuotaRemaining != null
                  ? Number(bucket.newApiQuotaRemaining)
                  : Number(bucket.creditsRemaining);
                const totalNum = isNewApi && bucket.newApiQuotaTotal != null
                  ? Number(bucket.newApiQuotaTotal)
                  : Number(bucket.creditsTotal);
                const usedNum = isNewApi && bucket.newApiQuotaUsed != null
                  ? Number(bucket.newApiQuotaUsed)
                  : Math.max(totalNum - remainingNum, 0);
                const usedPercent = totalNum > 0 ? Math.min(100, Math.round((usedNum / totalNum) * 100)) : 0;
                const isInstructionOpen = openInstructionBucketId === bucket.id;
                const isExpandedModel = expandedModelBucketIds.has(bucket.id);
                const modelNames = bucket.allowedModels.map((m) => formatModelName(m.publicName));
                const visibleModels = isExpandedModel ? modelNames : modelNames.slice(0, MAX_VISIBLE_MODELS);
                const hiddenCount = Math.max(modelNames.length - MAX_VISIBLE_MODELS, 0);

                const statusBadgeClass =
                  status === "active"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : status === "expiring"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-100 text-slate-600";

                return (
                  <article
                    key={bucket.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]"
                  >
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-950">{bucket.product?.name ?? "Gói tùy chỉnh"}</h3>
                      <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {getDisplayAiFamily(bucket)}
                      </span>
                      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusBadgeClass)}>
                        {status === "active" ? "Đang hoạt động" : status === "expiring" ? "Sắp hết hạn" : "Đã hết hạn"}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credits còn lại / tổng</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {`${formatCredits(remainingNum)} / ${formatCredits(totalNum)} credits`}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credits đã dùng</p>
                        <p className="mt-1 text-xl font-bold text-slate-950">
                          {`${formatCredits(usedNum)} credits`}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hạn dùng</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {bucket.expiresAt ? new Date(bucket.expiresAt).toLocaleDateString("vi-VN") : "Không giới hạn"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API key đã dùng / giới hạn</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{bucket.activeApiKeys} / {bucket.apiKeyLimit}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-2.5 rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            remainingNum <= 0
                              ? "bg-slate-300"
                              : remainingNum <= totalNum * 0.15
                              ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-gradient-to-r from-indigo-600 to-violet-600"
                          )}
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        {formatCredits(remainingNum)} / {formatCredits(totalNum)} credits còn lại
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Models hỗ trợ</p>
                      <button
                        type="button"
                        onClick={() =>
                          hiddenCount > 0 &&
                          setExpandedModelBucketIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(bucket.id)) next.delete(bucket.id);
                            else next.add(bucket.id);
                            return next;
                          })
                        }
                        className={cn(
                          "mt-2 w-full rounded-xl border border-transparent p-1 text-left transition-colors",
                          hiddenCount > 0
                            ? "cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30"
                            : "cursor-default"
                        )}
                      >
                        <div className="flex flex-wrap gap-2">
                          {modelNames.length > 0 ? (
                            visibleModels.map((m) => (
                              <span key={m} className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                {m}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic font-medium">Chưa có model khả dụng</span>
                          )}
                          {!isExpandedModel && hiddenCount > 0 && (
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">+{hiddenCount} model</span>
                          )}
                        </div>
                      </button>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <CosmicButton variant="secondary" onClick={() => {
                        setCreateModalBucket(bucket);
                        setNewKeyName("");
                      }}>
                        Tạo API key
                      </CosmicButton>
                      <CosmicButton variant="secondary" onClick={() => toggleInstruction(bucket.id)}>
                        <Settings className={cn("h-4 w-4", isInstructionOpen && "rotate-90")} />
                        {isInstructionOpen ? "Thu gọn" : "Xem chi tiết"}
                      </CosmicButton>
                      <CosmicButton href="/plans" variant="secondary">
                        {status === "expired" ? "Gia hạn" : "Mua thêm"}
                      </CosmicButton>
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

          {filteredBuckets.length > 0 ? (
            <AdminPagination
              page={currentPage}
              pageSize={pageSize}
              total={filteredBuckets.length}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}

      {createModalBucket && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.35)] sm:p-8">
            <h2 className="text-xl font-extrabold text-slate-950">Tạo API key</h2>
            <p className="mt-2 text-sm text-slate-600">
              Gói: <span className="font-semibold text-slate-900">{createModalBucket.product?.name ?? "Gói tùy chỉnh"}</span>
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tên key</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Ví dụ: CodexAPI"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:bg-indigo-50/30"
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <CosmicButton
                variant="secondary"
                onClick={() => {
                  setCreateModalBucket(null);
                  setNewKeyName("");
                }}
                className="w-full sm:w-auto"
              >
                Hủy
              </CosmicButton>
              <CosmicButton
                onClick={handleCreateApiKey}
                disabled={isCreatingKey || !newKeyName.trim()}
                className="w-full sm:w-auto"
              >
                {isCreatingKey ? "Đang tạo..." : "Tạo API key"}
              </CosmicButton>
            </div>
          </div>
        </div>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
