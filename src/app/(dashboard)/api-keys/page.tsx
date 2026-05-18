"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { getAiLineFromProductSlug, getAiLineLabelFromApiFamily, getAiLineLabelFromSlug, type AiLine } from "@/lib/ai-line";

type ApiFamily = "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
type StatusFilter = "all" | "active" | "revoked";

type ApiKeyItem = {
  id: string;
  name: string;
  apiFamily: "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
  keyPrefix: string;
  maskedKey?: string;
  key?: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  creditBucket: {
    id: string;
    productName: string;
    productSlug?: string | null;
    creditsTotal: string;
    creditsRemaining: string;
  } | null;
};

type MyPlanItem = {
  id: string;
  apiFamily: "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
  creditsTotal: string;
  creditsRemaining: string;
  usedCredits: string;
  apiKeyLimit: number;
  activeApiKeys: number;
  allowedModels: string[];
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    tier: string;
  } | null;
};

function getDisplayAiFamily(apiKey: { apiFamily: ApiFamily; creditBucket?: { productSlug?: string | null } | null }) {
  if (apiKey.creditBucket?.productSlug) return getAiLineLabelFromSlug(apiKey.creditBucket.productSlug);
  return getAiLineLabelFromApiFamily(apiKey.apiFamily);
}

function getBucketDisplayAiFamily(bucket: { apiFamily: ApiFamily; product?: { slug?: string } | null }) {
  if (bucket.product?.slug) return getAiLineLabelFromSlug(bucket.product.slug);
  return getAiLineLabelFromApiFamily(bucket.apiFamily);
}

function formatCredits(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isInteger(num)) {
    return new Intl.NumberFormat("en-US").format(num);
  }
  return num.toFixed(6).replace(/\.?0+$/, "");
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

function ApiKeysSkeleton() {
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
            <div className="mt-3 h-12 w-full rounded-xl bg-slate-100" />
            <div className="mt-6 h-10 w-full rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiKeysPageContent() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [plans, setPlans] = useState<MyPlanItem[]>([]);

  const [selectedCreditBucketId, setSelectedCreditBucketId] = useState("");
  const [keyName, setKeyName] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [newKeyData, setNewKeyData] = useState<{ id: string; fullKey: string; name: string } | null>(null);
  const [visibleKeyIds, setVisibleKeyIds] = useState<string[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [isCopiedNewKey, setIsCopiedNewKey] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [familyFilter, setFamilyFilter] = useState<AiLine | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [revokeTarget, setRevokeTarget] = useState<ApiKeyItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const { toast, showToast, clearToast } = useToast(3000);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const [plansRes, keysRes] = await Promise.all([
        fetch("/api/my-plans", { cache: "no-store" }),
        fetch("/api/api-keys", { cache: "no-store" }),
      ]);

      const plansData = await plansRes.json();
      const keysData = await keysRes.json();

      if (!plansRes.ok) throw new Error(plansData?.error?.message ?? "Lỗi tải gói credits.");
      if (!keysRes.ok) throw new Error(keysData?.error?.message ?? "Lỗi tải API keys.");

      setPlans(plansData.data ?? []);
      setApiKeys(keysData.data ?? []);
    } catch {
      setHasError(true);
      showToast("Không thể tải dữ liệu.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const searchParams = useSearchParams();
  const bucketIdFromUrl = searchParams.get("bucketId");

  const activePlans = useMemo(() => plans.filter((p) => p.isActive), [plans]);
  const selectedBucket = useMemo(() => plans.find((p) => p.id === selectedCreditBucketId), [plans, selectedCreditBucketId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isLoading || activePlans.length === 0) return;
      if (bucketIdFromUrl) {
        const exists = activePlans.find((p) => p.id === bucketIdFromUrl);
        if (exists) {
          setSelectedCreditBucketId(bucketIdFromUrl);
          return;
        }
      }
      if (!selectedCreditBucketId) {
        setSelectedCreditBucketId(activePlans[0].id);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [bucketIdFromUrl, activePlans, isLoading, selectedCreditBucketId]);

  const handleCreate = async () => {
    if (!selectedCreditBucketId || !keyName.trim()) return;

    try {
      setIsCreating(true);
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim(),
          creditBucketId: selectedCreditBucketId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Lỗi tạo API key.");

      showToast("API key đã được tạo", "success");
      setNewKeyData({ id: data.data.id, fullKey: data.data.fullKey, name: data.data.name });
      setIsCopiedNewKey(false);
      setKeyName("");
      setIsCreateModalOpen(false);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Lỗi tạo API key.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      setIsRevoking(true);
      const response = await fetch(`/api/api-keys/${revokeTarget.id}/revoke`, { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Lỗi thu hồi API key.");

      showToast("API key đã được thu hồi", "success");
      setRevokeTarget(null);
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Lỗi thu hồi API key.", "error");
    } finally {
      setIsRevoking(false);
    }
  };

  const toggleVisibility = async (apiKey: ApiKeyItem) => {
    const id = apiKey.id;
    if (visibleKeyIds.includes(id)) {
      setVisibleKeyIds((prev) => prev.filter((kid) => kid !== id));
      return;
    }

    if (!apiKey.isActive) {
      showToast("Key đã thu hồi, không thể xem.", "error");
      return;
    }

    try {
      if (!revealedKeys[id]) {
        const response = await fetch(`/api/api-keys/${id}/reveal`, { cache: "no-store" });
        const resData = await response.json();
        if (!response.ok || !resData.data?.fullKey) {
          throw new Error(resData?.error?.message ?? "Không thể hiển thị key");
        }
        const fullKey = resData.data.fullKey;
        setRevealedKeys((prev) => ({ ...prev, [id]: fullKey }));
      }
      setVisibleKeyIds((prev) => [...prev, id]);
    } catch {
      showToast("Không thể hiển thị key này.", "error");
    }
  };

  const handleCopy = async (apiKey: ApiKeyItem) => {
    if (!apiKey.isActive) {
      showToast("Key đã thu hồi, không thể sao chép.", "error");
      return;
    }

    try {
      let fullKey = revealedKeys[apiKey.id];

      if (!fullKey) {
        const response = await fetch(`/api/api-keys/${apiKey.id}/reveal`, { cache: "no-store" });
        const resData = await response.json();
        if (!response.ok || !resData.data?.fullKey) {
          throw new Error(resData?.error?.message ?? "Không thể hiển thị key");
        }
        fullKey = resData.data.fullKey;
        setRevealedKeys((prev) => ({ ...prev, [apiKey.id]: fullKey }));
      }

      await navigator.clipboard.writeText(fullKey);
      showToast("Đã sao chép API key", "success");
    } catch {
      showToast("Không thể sao chép key này.", "error");
    }
  };

  const copyNewKey = async () => {
    if (!newKeyData) return;
    await navigator.clipboard.writeText(newKeyData.fullKey);
    setIsCopiedNewKey(true);
    showToast("Đã sao chép API key", "success");
  };

  const families = useMemo(
    () =>
      Array.from(
        new Set(
          apiKeys
            .map((k) => (k.creditBucket?.productSlug ? getAiLineFromProductSlug(k.creditBucket.productSlug) : null))
            .filter((v): v is AiLine => Boolean(v)),
        ),
      ),
    [apiKeys],
  );

  const filteredKeys = useMemo(() => {
    return apiKeys.filter((k) => {
      const statusMatch = statusFilter === "all" ? true : statusFilter === "active" ? k.isActive : !k.isActive;
      const line = k.creditBucket?.productSlug ? getAiLineFromProductSlug(k.creditBucket.productSlug) : null;
      const familyMatch = familyFilter === "all" ? true : line === familyFilter;
      const text = searchText.trim().toLowerCase();
      const searchMatch = !text
        ? true
        : k.name.toLowerCase().includes(text) ||
          k.keyPrefix.toLowerCase().includes(text) ||
          (k.maskedKey ?? "").toLowerCase().includes(text);
      return statusMatch && familyMatch && searchMatch;
    });
  }, [apiKeys, familyFilter, searchText, statusFilter]);

  const totalPages = useMemo(() => Math.max(Math.ceil(filteredKeys.length / pageSize), 1), [filteredKeys.length, pageSize]);
  const currentPage = Math.min(page, totalPages);

  const paginatedKeys = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredKeys.slice(start, start + pageSize);
  }, [currentPage, filteredKeys, pageSize]);

  const stats = useMemo(() => {
    const total = apiKeys.length;
    const active = apiKeys.filter((k) => k.isActive).length;
    const revoked = total - active;
    const availablePlans = activePlans.length;
    return { total, active, revoked, availablePlans };
  }, [activePlans.length, apiKeys]);

  if (isLoading) {
    return (
      <main className="space-y-8" aria-busy="true">
        <ApiKeysSkeleton />
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-950">Không thể tải API keys</h2>
          <p className="mt-2 text-sm text-slate-600">Vui lòng thử lại sau ít phút.</p>
          <button
            type="button"
            onClick={() => void loadData()}
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
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">API Keys</h1>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Tạo, quản lý và thu hồi key sử dụng cho từng gói credits của bạn.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CosmicButton onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" /> Tạo API key
            </CosmicButton>
            <CosmicButton href="/api-docs" variant="secondary">Tài liệu API</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <TextFadeInUp as="section" delay={0.05} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng API keys", value: String(stats.total), icon: KeyRound, iconClass: "bg-indigo-50 text-indigo-600" },
          { label: "Key đang hoạt động", value: String(stats.active), icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-600" },
          { label: "Key đã thu hồi", value: String(stats.revoked), icon: Trash2, iconClass: "bg-rose-50 text-rose-600" },
          { label: "Gói có thể tạo key", value: String(stats.availablePlans), icon: Wallet, iconClass: "bg-violet-50 text-violet-600" },
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

      <TextFadeInUp as="section" delay={0.1} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên key hoặc prefix..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <FilterChip active={statusFilter === "all"} onClick={() => { setStatusFilter("all"); setPage(1); }}>Tất cả</FilterChip>
            <FilterChip active={statusFilter === "active"} onClick={() => { setStatusFilter("active"); setPage(1); }}>Đang hoạt động</FilterChip>
            <FilterChip active={statusFilter === "revoked"} onClick={() => { setStatusFilter("revoked"); setPage(1); }}>Đã thu hồi</FilterChip>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <FilterChip active={familyFilter === "all"} onClick={() => { setFamilyFilter("all"); setPage(1); }}>Tất cả dòng AI</FilterChip>
            {families.map((family) => (
              <FilterChip key={family} active={familyFilter === family} onClick={() => { setFamilyFilter(family); setPage(1); }}>
                {family === "ALL_MODELS" ? "All Models" : getAiLineLabelFromApiFamily(family)}
              </FilterChip>
            ))}
          </div>
        </div>
      </TextFadeInUp>

      {apiKeys.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <KeyRound className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-950">
            {activePlans.length === 0 ? "Bạn cần có gói credits trước" : "Bạn chưa có API key nào"}
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            {activePlans.length === 0
              ? "Hãy mua hoặc kích hoạt một gói credits để tạo API key."
              : "Tạo key đầu tiên để bắt đầu sử dụng credits với công cụ AI quen thuộc."}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {activePlans.length === 0 ? (
              <CosmicButton href="/plans">Mua credits</CosmicButton>
            ) : (
              <>
                <CosmicButton onClick={() => setIsCreateModalOpen(true)}>Tạo API key</CosmicButton>
                <CosmicButton href="/my-plans" variant="secondary">Xem gói của tôi</CosmicButton>
              </>
            )}
          </div>
        </section>
      ) : filteredKeys.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-xl font-bold text-slate-950">Không có API key phù hợp bộ lọc</h3>
          <p className="mt-2 text-sm text-slate-600">Hãy thử đổi trạng thái, dòng AI hoặc từ khóa tìm kiếm.</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {paginatedKeys.map((apiKey) => {
            const isVisible = visibleKeyIds.includes(apiKey.id);
            const revealedKey = revealedKeys[apiKey.id];
            const displayKey = isVisible && revealedKey ? revealedKey : apiKey.maskedKey ?? apiKey.keyPrefix;
            return (
              <article
                key={apiKey.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-950">{apiKey.name}</h3>
                  <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {getDisplayAiFamily(apiKey)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      apiKey.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    )}
                  >
                    {apiKey.isActive ? "Đang hoạt động" : "Đã thu hồi"}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 overflow-x-auto break-all font-mono text-sm text-slate-700">{displayKey}</code>
                    <button
                      type="button"
                      onClick={() => void toggleVisibility(apiKey)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
                    >
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCopy(apiKey)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Gói credits: <span className="font-semibold text-slate-900">{apiKey.creditBucket?.productName ?? "Gói đã xóa"}</span></p>
                  <p>Prefix: <span className="font-mono font-semibold text-slate-900">{apiKey.keyPrefix}</span></p>
                  <p>Ngày tạo: <span className="font-semibold text-slate-900">{new Date(apiKey.createdAt).toLocaleDateString("vi-VN")}</span></p>
                  <p>Lần dùng gần nhất: <span className="font-semibold text-slate-900">{apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString("vi-VN") : "Chưa sử dụng"}</span></p>
                </div>

                {apiKey.isActive ? (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(apiKey)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-all duration-200 hover:bg-rose-100 active:scale-[0.98]"
                    >
                      <Trash2 className="h-4 w-4" /> Thu hồi key
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      {filteredKeys.length > 0 ? (
        <AdminPagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredKeys.length}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      ) : null}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.45)] sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Tạo API key mới</h2>
            <p className="mt-1 text-sm text-slate-600">Chọn gói credits và đặt tên để tạo key sử dụng.</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tên key</label>
                <input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Ví dụ: CodexAPI"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Chọn gói credits</label>
                <select
                  value={selectedCreditBucketId}
                  onChange={(e) => setSelectedCreditBucketId(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Chọn gói credits đang dùng</option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id} disabled={plan.activeApiKeys >= plan.apiKeyLimit}>
                      {plan.product?.name ?? getAiLineLabelFromApiFamily(plan.apiFamily)} ({plan.activeApiKeys}/{plan.apiKeyLimit} keys)
                    </option>
                  ))}
                </select>
              </div>

              {selectedBucket ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p>Dòng AI: <span className="font-semibold text-slate-900">{getBucketDisplayAiFamily(selectedBucket)}</span></p>
                  <p className="mt-1">Credits còn lại: <span className="font-semibold text-slate-900">{formatCredits(selectedBucket.creditsRemaining)}</span></p>
                  <p className="mt-1">Giới hạn key: <span className="font-semibold text-slate-900">{selectedBucket.activeApiKeys}/{selectedBucket.apiKeyLimit}</span></p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
              >
                Hủy
              </button>
              <CosmicButton onClick={handleCreate} disabled={isCreating || !selectedCreditBucketId || !keyName.trim()}>
                {isCreating ? "Đang tạo..." : "Tạo API key"}
              </CosmicButton>
            </div>
          </div>
        </div>
      )}

      {newKeyData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.45)] sm:p-8">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
              <p className="font-semibold">API key đã được tạo</p>
              <p className="mt-1 text-sm">Hãy sao chép key ngay. Vì lý do bảo mật, key đầy đủ có thể chỉ hiển thị một lần.</p>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-900">{newKeyData.name}</p>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <code className="break-all font-mono text-sm text-slate-700">{newKeyData.fullKey}</code>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setNewKeyData(null)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
              >
                Đóng
              </button>
              <CosmicButton onClick={() => void copyNewKey()}>{isCopiedNewKey ? "Đã sao chép" : "Sao chép key"}</CosmicButton>
            </div>
          </div>
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.45)] sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">Thu hồi API key?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Key này sẽ không thể tiếp tục sử dụng sau khi bị thu hồi. Hành động này không ảnh hưởng đến các key khác.
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">{revokeTarget.name}</p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleRevoke()}
                disabled={isRevoking}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-all duration-200 hover:bg-rose-100 active:scale-[0.98] disabled:opacity-60"
              >
                {isRevoking ? "Đang thu hồi..." : "Thu hồi key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

export default function ApiKeysPage() {
  return (
    <Suspense fallback={<ApiKeysSkeleton />}>
      <ApiKeysPageContent />
    </Suspense>
  );
}
