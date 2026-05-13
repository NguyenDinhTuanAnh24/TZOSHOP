"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { useConfirm } from "@/hooks/use-confirm";
import {
  KeyRound,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  CheckCircle2,
  Zap,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { CardListSkeleton } from "@/components/ui/page-skeleton";

type ApiFamily = "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";

type ApiKeyItem = {
  id: string;
  name: string;
  apiFamily: ApiFamily;
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
    creditsTotal: string;
    creditsRemaining: string;
  } | null;
};

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
  expiresAt: string;
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

function ApiKeysPageContent() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [plans, setPlans] = useState<MyPlanItem[]>([]);

  const [selectedCreditBucketId, setSelectedCreditBucketId] = useState("");
  const [keyName, setKeyName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [newKeyData, setNewKeyData] = useState<{ id: string; fullKey: string; name: string } | null>(null);
  const [visibleKeyIds, setVisibleKeyIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const { toast, showToast, clearToast } = useToast(3000);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setMounted(true);
      void loadData();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      setMounted(false);
    };
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isLoading) return;

      if (activePlans.length > 0) {
        if (bucketIdFromUrl) {
          const exists = activePlans.find((p) => p.id === bucketIdFromUrl);
          if (exists) {
            setSelectedCreditBucketId(bucketIdFromUrl);
          } else if (!selectedCreditBucketId) {
            setSelectedCreditBucketId(activePlans[0].id);
          }
        } else if (!selectedCreditBucketId) {
          setSelectedCreditBucketId(activePlans[0].id);
        } else {
          const currentValid = activePlans.find((p) => p.id === selectedCreditBucketId);
          if (!currentValid) setSelectedCreditBucketId(activePlans[0].id);
        }
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

      showToast("API key mới đã được tạo.", "success");
      setNewKeyData({ id: data.data.id, fullKey: data.data.fullKey, name: data.data.name });
      setKeyName("");
      setSelectedCreditBucketId("");
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Lỗi tạo API key.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const response = await fetch(`/api/api-keys/${id}/revoke`, { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Lỗi thu hồi API key.");

      showToast("Đã thu hồi API key.", "success");
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Lỗi thu hồi API key.", "error");
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeyIds((prev) => (prev.includes(id) ? prev.filter((kid) => kid !== id) : [...prev, id]));
  };

  const handleCopy = async (_id: string, textToCopy: string | null | undefined) => {
    if (!textToCopy) {
      showToast("Không thể copy full API key. Vui lòng tạo key mới.", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast("Đã copy API key.", "success");
    } catch {
      showToast("Không thể copy API key.", "error");
    }
  };

  const copyNewKey = async () => {
    if (!newKeyData) return;
    await navigator.clipboard.writeText(newKeyData.fullKey);
    showToast("Đã copy API key.", "success");
  };

  return (
    <div className="space-y-10 pb-20">
      <PageHeader
        title="API KEYS"
        description="Tạo và quản lý API key để kết nối ứng dụng với hệ thống credits."
        icon={<KeyRound className="h-8 w-8" />}
      />

      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#C7F0D8] text-black shadow-[3px_3px_0px_0px_#000]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black uppercase text-black md:text-2xl">Tạo API key mới</h2>
        </div>

        {isLoading ? (
          <div className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-[180px] w-full animate-pulse bg-[#E9E1D0]" />
          </div>
        ) : activePlans.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-8 text-center shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[4px_4px_0px_0px_#000]">
              <KeyRound className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-black uppercase text-black md:text-xl">Bạn cần mua gói credits trước khi tạo API key</h3>
            <p className="mt-2 text-sm font-bold text-black/70">
              Sau khi có gói credits, bạn có thể tạo API key để kết nối với API TzoShop.
            </p>
            <AppButton variant="accent" className="mt-5 h-12 px-6" onClick={() => (window.location.href = "/plans")}>
              <Plus className="mr-2 h-4 w-4" />
              MUA CREDITS
            </AppButton>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wide text-black">Tên API key</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Ví dụ: Extension Chrome, Cursor IDE..."
                  className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black placeholder:text-black/40 outline-none shadow-[3px_3px_0px_0px_#000] transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wide text-black">Chọn gói credits</label>
                <select
                  value={selectedCreditBucketId}
                  onChange={(e) => setSelectedCreditBucketId(e.target.value)}
                  className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black outline-none shadow-[3px_3px_0px_0px_#000] transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                >
                  <option value="">Chọn gói credits đang dùng</option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id} disabled={plan.activeApiKeys >= plan.apiKeyLimit}>
                      {plan.product?.name ?? getFamilyLabel(plan.apiFamily)} ({plan.activeApiKeys}/{plan.apiKeyLimit} keys)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedBucket ? (
              <div className="flex flex-wrap gap-4 border-4 border-black bg-[#C7F0D8] p-4 shadow-[4px_4px_0px_0px_#000]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-black" />
                  <span className="text-xs font-black uppercase text-black">Dòng:</span>
                  <span className="text-sm font-black text-black">{getFamilyLabel(selectedBucket.apiFamily)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-black" />
                  <span className="text-xs font-black uppercase text-black">Credits:</span>
                  <span className="text-sm font-black text-black">{formatCredits(selectedBucket.creditsRemaining)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-black" />
                  <span className="text-xs font-black uppercase text-black">Sức chứa:</span>
                  <span className="text-sm font-black text-black">
                    {selectedBucket.activeApiKeys}/{selectedBucket.apiKeyLimit} keys
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <AppButton
                variant="accent"
                onClick={handleCreate}
                isLoading={isCreating}
                disabled={!selectedCreditBucketId || !keyName.trim()}
                className="h-12 w-full px-6 sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                TẠO API KEY
              </AppButton>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[3px_3px_0px_0px_#000]">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black uppercase text-black md:text-2xl">Danh sách API keys</h2>
          </div>
          <AppButton variant="secondary" onClick={loadData} className="h-11 px-5" disabled={isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            {isLoading ? "Đang tải..." : "LÀM MỚI"}
          </AppButton>
        </div>

        {isLoading ? (
          <CardListSkeleton count={3} />
        ) : apiKeys.length === 0 ? (
          <div className="relative flex min-h-[320px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-8 text-center shadow-[8px_8px_0px_0px_#000] md:p-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[5px_5px_0px_0px_#000]">
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-black md:text-2xl">Bạn chưa có API key nào</h3>
            <p className="mt-3 max-w-[520px] text-sm font-bold text-black/70 md:text-base">
              {activePlans.length === 0
                ? "Mua gói credits trước, sau đó bạn có thể tạo API key để sử dụng."
                : "Sử dụng form bên trên để tạo key đầu tiên và bắt đầu kết nối."}
            </p>
            {activePlans.length === 0 ? (
              <AppButton variant="accent" className="mt-6 h-12 px-6" onClick={() => (window.location.href = "/plans")}>
                MUA CREDITS
              </AppButton>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const formTop = window.scrollY + 120;
                  window.scrollTo({ top: formTop, behavior: "smooth" });
                }}
                className="mt-6 h-12 border-4 border-black bg-[#FFD93D] px-6 text-sm font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                TẠO API KEY
              </button>
            )}
            <div className="absolute -bottom-3 -right-3 h-7 w-7 border-4 border-black bg-[#A78BFA]" />
          </div>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => {
              const isVisible = visibleKeyIds.includes(apiKey.id);
              return (
                <article
                  key={apiKey.id}
                  className="border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] md:p-6"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black text-black md:text-xl">{apiKey.name}</h3>
                      <StatusBadge status={getFamilyLabel(apiKey.apiFamily)} variant="neutral" />
                      <StatusBadge status={apiKey.isActive ? "Đang hoạt động" : "Đã thu hồi"} variant={apiKey.isActive ? "success" : "danger"} />
                    </div>

                    <div className="flex flex-col gap-3 border-4 border-black bg-black p-3 sm:flex-row sm:items-center">
                      <code className="min-w-0 flex-1 overflow-x-auto break-all font-mono text-sm font-bold text-[#FFFDF5]">
                        {isVisible && apiKey.key ? apiKey.key : (apiKey.maskedKey ?? apiKey.keyPrefix)}
                      </code>

                      {apiKey.isActive ? (
                        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleVisibility(apiKey.id)}
                            disabled={!apiKey.key}
                            className="flex h-10 items-center justify-center border-4 border-black bg-white px-3 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                          >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(apiKey.id, apiKey.key)}
                            className="flex h-10 items-center justify-center border-4 border-black bg-white px-3 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-black/70">Gói</p>
                        <p className="mt-1 font-bold text-black">{apiKey.creditBucket?.productName ?? "Gói đã xóa"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-black/70">Tạo lúc</p>
                        <p className="mt-1 font-bold text-black">{new Date(apiKey.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-black/70">Dùng gần nhất</p>
                        <p className="mt-1 font-bold text-black">
                          {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString("vi-VN") : "Chưa dùng"}
                        </p>
                      </div>
                    </div>

                    {apiKey.isActive ? (
                      <div className="pt-1">
                        <AppButton
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            askConfirm({
                              title: "Thu hồi API key?",
                              description: "API key này sẽ không thể sử dụng sau khi thu hồi. Hành động này không thể hoàn tác.",
                              confirmLabel: "Thu hồi ngay",
                              cancelLabel: "Hủy",
                              type: "danger",
                              onConfirm: () => handleRevoke(apiKey.id),
                            })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          THU HỒI
                        </AppButton>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {newKeyData && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6">
          <div className="w-full max-w-md border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] sm:p-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#C7F0D8] text-black shadow-[4px_4px_0px_0px_#000]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mb-6 text-center text-xl font-black uppercase text-black">Tạo API key thành công</h2>

            <div className="mb-6 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
              <p className="mb-2 text-center text-xs font-black uppercase tracking-wide text-black/70">{newKeyData.name}</p>
              <code className="block break-all text-center font-mono text-sm font-black text-black">{newKeyData.fullKey}</code>
            </div>

            <div className="flex flex-col gap-3">
              <AppButton variant="accent" onClick={copyNewKey}>
                <Copy className="mr-2 h-4 w-4" /> SAO CHÉP API KEY
              </AppButton>
              <AppButton variant="secondary" onClick={() => setNewKeyData(null)}>
                ĐÓNG
              </AppButton>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}

      {confirmState && (
        <ConfirmDialog
          open={!!confirmState}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}

export default function ApiKeysPage() {
  return (
    <Suspense fallback={<CardListSkeleton count={5} />}>
      <ApiKeysPageContent />
    </Suspense>
  );
}
