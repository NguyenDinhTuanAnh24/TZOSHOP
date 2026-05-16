"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Plus, RefreshCw, Search, Server } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { AdminPagination } from "@/components/admin/admin-pagination";

type AiProvider = {
  id: string;
  name: string;
  apiFamily: string;
  baseUrl: string;
  encryptedApiKey: string;
  isActive: boolean;
  updatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ProviderSummary = {
  totalProviders: number;
  activeProviders: number;
  disabledProviders: number;
};

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type FamilyFilter = "ALL" | "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";

function familyLabel(family: string) {
  if (family === "CODEXAI") return "CodexAI";
  if (family === "CLAUDE") return "Claude";
  if (family === "GEMINI") return "Gemini";
  if (family === "DEEPSEEK") return "DeepSeek";
  return family;
}

function familyClass(family: string) {
  if (family === "CODEXAI") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (family === "CLAUDE") return "border-orange-100 bg-orange-50 text-orange-700";
  if (family === "GEMINI") return "border-sky-100 bg-sky-50 text-sky-700";
  if (family === "DEEPSEEK") return "border-violet-100 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function ProvidersSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="mt-4 h-10 w-48 rounded-xl" />
        <Skeleton className="mt-3 h-5 w-[620px] max-w-full rounded-full" />
      </section>
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="mt-5 h-4 w-24 rounded-full" />
            <Skeleton className="mt-3 h-8 w-20 rounded-xl" />
          </div>
        ))}
      </section>
    </div>
  );
}

export default function AdminProvidersPage() {
  const emptyProviderForm = {
    name: "",
    apiFamily: "CODEXAI",
    baseUrl: "",
    apiKey: "",
    isActive: true,
  };

  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState<FamilyFilter>("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<ProviderSummary | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(emptyProviderForm);

  const { toast, showToast, clearToast } = useToast(3000);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        family: filterFamily,
        status: filterStatus,
      });

      const response = await fetch(`/api/admin/providers?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("LOAD_PROVIDERS_FAILED");
      }

      setProviders((result.items ?? result.providers ?? result.data ?? []) as AiProvider[]);
      setPagination((result.pagination ?? null) as Pagination | null);
      setSummary((result.summary ?? null) as ProviderSummary | null);
    } catch {
      setLoadError("Không thể tải danh sách provider. Vui lòng thử lại sau ít phút.");
    } finally {
      setIsLoading(false);
    }
  }, [filterFamily, filterStatus, page, pageSize, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchProviders(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchProviders]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Tên provider là bắt buộc.";
    if (!formData.apiFamily) errors.apiFamily = "Dòng AI là bắt buộc.";
    if (!formData.baseUrl.trim()) errors.baseUrl = "Base URL là bắt buộc.";
    try {
      if (formData.baseUrl.trim()) {
        new URL(formData.baseUrl);
      }
    } catch {
      errors.baseUrl = "Base URL không hợp lệ.";
    }
    if (!editingId && !formData.apiKey.trim()) {
      errors.apiKey = "API key là bắt buộc.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (provider?: AiProvider) => {
    setFormErrors({});
    if (provider) {
      setEditingId(provider.id);
      setFormData({
        name: provider.name,
        apiFamily: provider.apiFamily,
        baseUrl: provider.baseUrl,
        apiKey: "",
        isActive: provider.isActive,
      });
    } else {
      setEditingId(null);
      setFormData(emptyProviderForm);
    }
    setIsModalOpen(true);
  };

  const handleToggleActive = (provider: AiProvider) => {
    const isActivating = !provider.isActive;
    askConfirm({
      title: isActivating ? "Bật provider này?" : "Tắt provider này?",
      description: isActivating
        ? "Provider sẽ được sử dụng lại cho các model tương ứng."
        : "Các model dùng provider này có thể không xử lý request mới cho đến khi được bật lại.",
      confirmLabel: isActivating ? "Bật provider" : "Tắt provider",
      type: isActivating ? "primary" : "warning",
      onConfirm: async () => {
        const response = await fetch(`/api/admin/providers/${provider.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: isActivating }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          showToast(isActivating ? "Đã bật provider." : "Đã tắt provider.", "success");
          void fetchProviders();
        } else {
          showToast("Không thể cập nhật provider.", "error");
        }
      },
    });
  };

  const handleCopyBaseUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Đã sao chép Base URL.", "success");
    } catch {
      showToast("Không thể sao chép Base URL.", "error");
    }
  };

  if (isLoading && !providers.length) return <ProvidersSkeleton />;

  if (loadError && !providers.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải danh sách provider</h2>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <button
          type="button"
          onClick={() => void fetchProviders()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Thử lại
        </button>
      </section>
    );
  }

  const summaryCards = [
    {
      label: "Tổng provider",
      value: summary?.totalProviders ?? 0,
      desc: "Tất cả provider trong cơ sở dữ liệu",
      cls: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Đang hoạt động",
      value: summary?.activeProviders ?? 0,
      desc: "Provider sẵn sàng phục vụ",
      cls: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Đang tắt",
      value: summary?.disabledProviders ?? 0,
      desc: "Provider đang bị vô hiệu hóa",
      cls: "bg-slate-100 text-slate-700",
    },
    {
      label: "Trang hiện tại",
      value: providers.length,
      desc: "Số provider đang hiển thị ở page hiện tại",
      cls: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="space-y-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-1">
      <TextFadeInUp
        as="section"
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8"
      >
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
              Quản trị provider
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Providers</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Quản lý base URL, API key và trạng thái hoạt động của các provider AI.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <CosmicButton onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4" />
              Thêm provider
            </CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <TextFadeInUp
            key={card.label}
            delay={Math.min(index * 0.05, 0.25)}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200"
          >
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", card.cls)}>
              <Server className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950">{card.value.toLocaleString("vi-VN")}</p>
            <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên provider hoặc base URL..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(event) => {
              setFilterStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đang tắt</option>
          </select>
          <select
            value={filterFamily}
            onChange={(event) => {
              setFilterFamily(event.target.value as FamilyFilter);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
          >
            <option value="ALL">Tất cả dòng AI</option>
            <option value="CODEXAI">CodexAI</option>
            <option value="CLAUDE">Claude</option>
            <option value="GEMINI">Gemini</option>
            <option value="DEEPSEEK">DeepSeek</option>
          </select>
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => void fetchProviders()}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Làm mới
            </button>
          </div>
        </div>
      </TextFadeInUp>

      {providers.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Server className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950">Chưa có provider</h2>
          <p className="mt-2 text-sm text-slate-600">
            Thêm provider để kết nối model tới nguồn upstream tương ứng.
          </p>
          <div className="mt-6 flex justify-center">
            <CosmicButton onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4" />
              Thêm provider
            </CosmicButton>
          </div>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {providers.map((provider, index) => {
              const secretShown = showSecrets[provider.id] || false;
              return (
                <TextFadeInUp
                  key={provider.id}
                  delay={Math.min(index * 0.04, 0.25)}
                  as="article"
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-extrabold text-slate-950">{provider.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{new Date(provider.updatedAt).toLocaleString("vi-VN")}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        provider.isActive
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      )}
                    >
                      {provider.isActive ? "Đang hoạt động" : "Đang tắt"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", familyClass(provider.apiFamily))}>
                      {familyLabel(provider.apiFamily)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <code className="block max-w-full flex-1 truncate rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                      {provider.baseUrl}
                    </code>
                    <button
                      type="button"
                      onClick={() => void handleCopyBaseUrl(provider.baseUrl)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API key</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="block flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-600">
                        {secretShown ? provider.encryptedApiKey : provider.encryptedApiKey.replace(/.(?=.{4})/g, "•")}
                      </code>
                      <button
                        type="button"
                        onClick={() => setShowSecrets((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {secretShown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(provider)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Sửa
                    </button>
                    <label className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3">
                      <Switch checked={provider.isActive} onCheckedChange={() => handleToggleActive(provider)} />
                    </label>
                  </div>
                </TextFadeInUp>
              );
            })}
          </section>

          {pagination ? (
            <AdminPagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Cập nhật provider" : "Thêm provider"}
        description="Quản lý base URL, API key và trạng thái hoạt động của provider."
        maxWidthClassName="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="provider-form"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu provider"}
            </button>
          </>
        }
      >
        <form
          id="provider-form"
          autoComplete="off"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!validateForm()) return;
            try {
              setIsSubmitting(true);
              const url = editingId ? `/api/admin/providers/${editingId}` : "/api/admin/providers";
              const method = editingId ? "PATCH" : "POST";
              const payload = {
                name: formData.name.trim(),
                apiFamily: formData.apiFamily,
                baseUrl: formData.baseUrl.trim(),
                isActive: formData.isActive,
                ...(!editingId || formData.apiKey.trim() ? { apiKey: formData.apiKey.trim() } : {}),
              };
              const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const result = await response.json();
              if (!response.ok || !result.success) {
                throw new Error(result?.error?.message || result?.message || "SAVE_PROVIDER_FAILED");
              }
              showToast(editingId ? "Đã cập nhật provider." : "Đã tạo provider.", "success");
              setIsModalOpen(false);
              void fetchProviders();
            } catch {
              showToast("Không thể lưu provider.", "error");
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên provider" error={formErrors.name}>
              <input
                name="provider-display-name"
                autoComplete="off"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ví dụ: OpenAI Gateway"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />
            </Field>
            <Field label="Dòng AI" error={formErrors.apiFamily}>
              <select
                value={formData.apiFamily}
                onChange={(event) => setFormData((prev) => ({ ...prev, apiFamily: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              >
                <option value="CODEXAI">CodexAI</option>
                <option value="CLAUDE">Claude</option>
                <option value="GEMINI">Gemini</option>
                <option value="DEEPSEEK">DeepSeek</option>
              </select>
            </Field>
            <Field label="Base URL" className="md:col-span-2" error={formErrors.baseUrl}>
              <input
                name="provider-base-url"
                autoComplete="off"
                type="url"
                value={formData.baseUrl}
                onChange={(event) => setFormData((prev) => ({ ...prev, baseUrl: event.target.value }))}
                placeholder="https://api.example.com/v1"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />
            </Field>
            <Field label="API key" className="md:col-span-2" error={formErrors.apiKey}>
              <input
                name="provider-api-key-new"
                autoComplete="new-password"
                type="password"
                value={formData.apiKey}
                onChange={(event) => setFormData((prev) => ({ ...prev, apiKey: event.target.value }))}
                placeholder={editingId ? "Nhập API key mới nếu muốn thay đổi" : "Nhập API key của provider"}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />
            </Field>
          </div>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
            <span>Đang hoạt động</span>
            <Switch checked={formData.isActive} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))} />
          </label>
        </form>
      </Modal>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
      {confirmState ? (
        <ConfirmDialog
          open={Boolean(confirmState)}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      ) : null}
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
