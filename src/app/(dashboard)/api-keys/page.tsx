"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
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
  ShieldCheck
} from "lucide-react";
import DashboardSubNav from "@/components/dashboard/dashboard-sub-nav";
import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
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

import { Suspense } from "react";

function ApiKeysPageContent() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [plans, setPlans] = useState<MyPlanItem[]>([]);

  const [selectedCreditBucketId, setSelectedCreditBucketId] = useState("");
  const [keyName, setKeyName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [newKeyData, setNewKeyData] = useState<{ id: string, fullKey: string, name: string } | null>(null);
  const [visibleKeyIds, setVisibleKeyIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const { toast, showToast, clearToast } = useToast(3000);
  const {
    confirmState,
    isConfirming,
    askConfirm,
    closeConfirm,
    handleConfirm,
  } = useConfirm();

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

  const activePlans = useMemo(() => plans.filter(p => p.isActive), [plans]);
  const selectedBucket = useMemo(() => plans.find(p => p.id === selectedCreditBucketId), [plans, selectedCreditBucketId]);

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

  // Xử lý bucketId từ URL và đảm bảo không bị stale
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isLoading) return;
      
      if (activePlans.length > 0) {
        if (bucketIdFromUrl) {
          const exists = activePlans.find(p => p.id === bucketIdFromUrl);
          if (exists) {
            setSelectedCreditBucketId(bucketIdFromUrl);
          } else if (!selectedCreditBucketId) {
            // Nếu URL sai và chưa chọn gì thì chọn cái đầu tiên
            setSelectedCreditBucketId(activePlans[0].id);
          }
        } else if (!selectedCreditBucketId) {
          // Nếu không có URL và chưa chọn gì thì chọn cái đầu tiên
          setSelectedCreditBucketId(activePlans[0].id);
        } else {
          // Kiểm tra xem selection hiện tại còn hợp lệ không
          const currentValid = activePlans.find(p => p.id === selectedCreditBucketId);
          if (!currentValid) {
            setSelectedCreditBucketId(activePlans[0].id);
          }
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
      setNewKeyData({
        id: data.data.id,
        fullKey: data.data.fullKey,
        name: data.data.name,
      });
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
    setVisibleKeyIds(prev => 
      prev.includes(id) ? prev.filter(kid => kid !== id) : [...prev, id]
    );
  };

  const handleCopy = async (id: string, textToCopy: string | null | undefined) => {
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
      <DashboardSubNav 
        items={[
          { label: "API Keys", href: "/api-keys" },
          { label: "Tài liệu API", href: "/api-docs" },
          { label: "Lịch sử sử dụng", href: "/usage" },
        ]} 
      />
      <PageHeader 
        title="API Keys" 
        description="Tạo và quản lý API key để kết nối ứng dụng với hệ thống credits."
        icon={<KeyRound className="h-8 w-8" />}
      />

      <AppCard>
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h2 className={ui.h3}>Tạo API key mới</h2>
        </div>

        {isLoading ? (
          <div className="h-[200px] w-full animate-pulse rounded-[32px] bg-slate-50 ring-1 ring-slate-100" />
        ) : activePlans.length === 0 ? (
          <div className="rounded-[32px] bg-slate-50/50 p-6 sm:p-10 text-center ring-1 ring-slate-100">
            <p className="text-[#47524d] font-bold">Bạn cần mua gói credits trước khi tạo API key.</p>
            <div className="mt-6 flex justify-center">
              <AppButton variant="accent" onClick={() => window.location.href = "/plans"}>
                <Plus className="h-4 w-4 mr-2" />
                Mua credits
              </AppButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className={ui.label}>Tên API key</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Ví dụ: Extension Chrome, Cursor IDE..."
                  className={ui.input}
                />
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Chọn gói credits</label>
                <select
                  value={selectedCreditBucketId}
                  onChange={(e) => setSelectedCreditBucketId(e.target.value)}
                  className={ui.select}
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

            {selectedBucket && (
              <div className="flex flex-wrap gap-4 sm:gap-6 rounded-2xl bg-emerald-50/50 p-5 ring-1 ring-emerald-100/50">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span className={ui.label}>Dòng:</span>
                  <span className="text-sm font-black text-emerald-900">{getFamilyLabel(selectedBucket.apiFamily)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className={ui.label}>Credits:</span>
                  <span className="text-sm font-black text-emerald-600">{formatCredits(selectedBucket.creditsRemaining)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-emerald-600" />
                  <span className={ui.label}>Sức chứa:</span>
                  <span className="text-sm font-black text-emerald-900">{selectedBucket.activeApiKeys}/{selectedBucket.apiKeyLimit} keys</span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <AppButton
                variant="accent"
                onClick={handleCreate}
                isLoading={isCreating}
                disabled={!selectedCreditBucketId || !keyName.trim()}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo API key
              </AppButton>
            </div>
          </div>
        )}
      </AppCard>

      {/* List Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-emerald-600" />
            <h2 className={ui.h3}>Danh sách API keys</h2>
          </div>
          <AppButton 
            variant="secondary" 
            onClick={loadData} 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            {isLoading ? "Đang tải..." : "Làm mới"}
          </AppButton>
        </div>

        {isLoading ? (
          <CardListSkeleton count={3} />
        ) : apiKeys.length === 0 ? (
          <div className="rounded-[40px] border border-dashed border-[#dfe5e1] bg-[#fbfbf8] p-10 sm:p-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white border border-[#dfe5e1] text-[#8a9690] mb-6 shadow-sm">
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className={ui.h3}>Bạn chưa có API key nào.</h3>
            <p className={ui.p}>Sử dụng form bên trên để tạo key đầu tiên và bắt đầu kết nối.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => {
              const isVisible = visibleKeyIds.includes(apiKey.id);

              return (
                <AppCard
                  key={apiKey.id}
                  variant="interactive"
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-8 group"
                >
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className={ui.h3}>{apiKey.name}</h3>
                      <StatusBadge status={getFamilyLabel(apiKey.apiFamily)} variant="neutral" />
                      <StatusBadge 
                        status={apiKey.isActive ? "Active" : "Revoked"} 
                        variant={apiKey.isActive ? "success" : "neutral"} 
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbfbf8] px-4 py-3 sm:px-5 sm:py-3 ring-1 ring-[#edf1ee] max-w-full overflow-hidden">
                      <code className="flex-1 font-mono text-sm font-black text-[#0b0f0d] tracking-tight truncate">
                        {isVisible && apiKey.key ? apiKey.key : (apiKey.maskedKey ?? apiKey.keyPrefix)}
                      </code>
                      
                      {apiKey.isActive && (
                        <div className="flex items-center gap-1">
                          <IconButton 
                            onClick={(e) => { e.preventDefault(); toggleVisibility(apiKey.id); }} 
                            variant="ghost"
                            size="sm"
                            disabled={!apiKey.key}
                            title={isVisible ? "Ẩn" : "Hiện"}
                          >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </IconButton>
                          <IconButton 
                            onClick={(e) => { e.preventDefault(); handleCopy(apiKey.id, apiKey.key); }} 
                            variant="ghost"
                            size="sm"
                            title="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </IconButton>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-10 gap-y-3">
                      <div>
                        <p className={ui.label}>Gói:</p>
                        <p className="mt-1 text-sm font-bold text-[#0b0f0d]">
                          {apiKey.creditBucket?.productName ?? "Gói đã xóa"}
                        </p>
                      </div>
                      <div>
                        <p className={ui.label}>Tạo lúc:</p>
                        <p className="mt-1 text-sm font-bold text-[#0b0f0d]">
                          {new Date(apiKey.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div>
                        <p className={ui.label}>Dùng gần nhất:</p>
                        <p className="mt-1 text-sm font-bold text-[#0b0f0d]">
                          {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString("vi-VN") : "Chưa dùng"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#edf1ee] pt-5 lg:mt-0 lg:border-none lg:pt-0">
                    {apiKey.isActive && (
                      <AppButton
                        variant="danger"
                        size="sm"
                        onClick={() => askConfirm({
                          title: "Thu hồi API key?",
                          description: "API key này sẽ không thể sử dụng sau khi thu hồi. Hành động này không thể hoàn tác.",
                          confirmLabel: "Thu hồi ngay",
                          cancelLabel: "Hủy",
                          type: "danger",
                          onConfirm: () => handleRevoke(apiKey.id),
                        })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Thu hồi
                      </AppButton>
                    )}
                  </div>
                </AppCard>
              );
            })}
          </div>
        )}
      </section>

      {/* New Key Modal */}
      {newKeyData && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[2rem] bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-5">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className={ui.h3 + " text-center mb-6"}>Tạo API key thành công</h2>
            
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 mb-6 ring-1 ring-emerald-100">
              <p className={ui.label + " mb-2 text-center"}>{newKeyData.name}</p>
              <code className="block w-full text-center font-mono text-sm font-black text-emerald-900 tracking-tight break-all">
                {newKeyData.fullKey}
              </code>
            </div>

            <div className="flex flex-col gap-3">
              <AppButton variant="accent" onClick={copyNewKey}>
                <Copy className="h-4 w-4 mr-2" /> Sao chép API key
              </AppButton>
              <AppButton variant="secondary" onClick={() => setNewKeyData(null)}>
                Đóng
              </AppButton>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast & Confirm */}
      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}

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
