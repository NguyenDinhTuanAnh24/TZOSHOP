"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Copy, Pencil, Plus, Search } from "lucide-react";
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

type AiModel = {
  id: string;
  publicName: string;
  upstreamModel: string;
  apiFamily: string;
  providerId: string;
  provider?: { name: string };
  inputCreditRate: number;
  outputCreditRate: number;
  upstreamEndpointType: string;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsAgent: boolean;
  isActive: boolean;
};

type AiProvider = {
  id: string;
  name: string;
  apiFamily: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ModelSummary = {
  totalModels: number;
  activeModels: number;
  inactiveModels: number;
  familyCount: number;
};

type FamilyFilter = "ALL" | "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortFilter = "NEWEST" | "NAME_ASC" | "FAMILY" | "USAGE";

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

function ModelsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="mt-4 h-10 w-44 rounded-xl" />
        <Skeleton className="mt-3 h-5 w-[580px] max-w-full rounded-full" />
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

export default function AdminModelsPage() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [providersList, setProvidersList] = useState<AiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState<FamilyFilter>("ALL");
  const [filterProvider, setFilterProvider] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortFilter>("NEWEST");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<ModelSummary | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    publicName: "",
    upstreamModel: "",
    apiFamily: "CODEXAI",
    providerId: "",
    inputCreditRate: "1",
    outputCreditRate: "1",
    upstreamEndpointType: "CHAT_COMPLETIONS",
    supportsStreaming: true,
    supportsTools: false,
    supportsAgent: false,
    isActive: true,
  });

  const { toast, showToast, clearToast } = useToast(3000);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        family: filterFamily,
        provider: filterProvider,
        status: filterStatus,
        sort: sortBy,
      });

      const [modelsRes, providersRes] = await Promise.all([
        fetch(`/api/admin/models?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/admin/providers?page=1&pageSize=100&status=ALL", { cache: "no-store" }),
      ]);

      const [modelsJson, providersJson] = await Promise.all([modelsRes.json(), providersRes.json()]);

      if (!modelsRes.ok || !modelsJson.success) {
        throw new Error("LOAD_MODELS_FAILED");
      }

      setModels((modelsJson.items ?? modelsJson.models ?? modelsJson.data ?? []) as AiModel[]);
      setPagination((modelsJson.pagination ?? null) as Pagination | null);
      setSummary((modelsJson.summary ?? null) as ModelSummary | null);

      if (providersRes.ok) {
        setProvidersList((providersJson.items ?? providersJson.providers ?? providersJson.data ?? []) as AiProvider[]);
      }
    } catch {
      setLoadError("Không thể tải danh sách model. Vui lòng thử lại sau ít phút.");
    } finally {
      setIsLoading(false);
    }
  }, [filterFamily, filterProvider, filterStatus, page, pageSize, search, sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchModels(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchModels]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.publicName.trim()) errors.publicName = "Tên hiển thị là bắt buộc.";
    if (!formData.upstreamModel.trim()) errors.upstreamModel = "Model ID là bắt buộc.";
    if (!formData.apiFamily) errors.apiFamily = "Dòng AI là bắt buộc.";
    if (!formData.providerId) errors.providerId = "Provider là bắt buộc.";
    if (!/^[a-z0-9/_.-]+$/i.test(formData.upstreamModel)) {
      errors.upstreamModel = "Model ID không đúng định dạng.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (model?: AiModel) => {
    setFormErrors({});
    if (model) {
      setEditingId(model.id);
      setFormData({
        publicName: model.publicName,
        upstreamModel: model.upstreamModel,
        apiFamily: model.apiFamily,
        providerId: model.providerId,
        inputCreditRate: String(model.inputCreditRate),
        outputCreditRate: String(model.outputCreditRate),
        upstreamEndpointType: model.upstreamEndpointType,
        supportsStreaming: model.supportsStreaming,
        supportsTools: model.supportsTools,
        supportsAgent: model.supportsAgent,
        isActive: model.isActive,
      });
    } else {
      const defaultProviderId = providersList.find((provider) => provider.apiFamily === "CODEXAI")?.id ?? "";
      setEditingId(null);
      setFormData({
        publicName: "",
        upstreamModel: "",
        apiFamily: "CODEXAI",
        providerId: defaultProviderId,
        inputCreditRate: "1",
        outputCreditRate: "1",
        upstreamEndpointType: "CHAT_COMPLETIONS",
        supportsStreaming: true,
        supportsTools: false,
        supportsAgent: false,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const url = editingId ? `/api/admin/models/${editingId}` : "/api/admin/models";
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || result?.message || "SAVE_MODEL_FAILED");
      }

      showToast(editingId ? "Đã cập nhật model." : "Đã tạo model.", "success");
      setIsModalOpen(false);
      void fetchModels();
    } catch {
      showToast("Không thể lưu model.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = (model: AiModel) => {
    const isActivating = !model.isActive;
    askConfirm({
      title: isActivating ? "Bật model này?" : "Tắt model này?",
      description: isActivating
        ? "Model sẽ được sử dụng lại trong các gói credits và API tương ứng."
        : "Model sẽ không còn được chọn cho các gói mới cho đến khi được bật lại.",
      confirmLabel: isActivating ? "Bật model" : "Tắt model",
      type: isActivating ? "primary" : "warning",
      onConfirm: async () => {
        const response = await fetch(`/api/admin/models/${model.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: isActivating }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          showToast(isActivating ? "Đã bật model." : "Đã tắt model.", "success");
          void fetchModels();
        } else {
          showToast("Không thể cập nhật model.", "error");
        }
      },
    });
  };

  const handleCopyModelId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast("Đã sao chép model ID.", "success");
    } catch {
      showToast("Không thể sao chép model ID.", "error");
    }
  };

  const providerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const provider of providersList) {
      map.set(provider.id, provider.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [providersList]);

  const filteredProviders = useMemo(
    () => providersList.filter((provider) => provider.apiFamily === formData.apiFamily),
    [formData.apiFamily, providersList]
  );

  if (isLoading && !models.length) return <ModelsSkeleton />;

  if (loadError && !models.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải danh sách model</h2>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <button
          type="button"
          onClick={() => void fetchModels()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Thử lại
        </button>
      </section>
    );
  }

  const summaryCards = [
    {
      label: "Tổng model",
      value: summary?.totalModels ?? 0,
      desc: "Tất cả model trong cơ sở dữ liệu",
      cls: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Đang hoạt động",
      value: summary?.activeModels ?? 0,
      desc: "Model sẵn sàng sử dụng",
      cls: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Đang tắt",
      value: summary?.inactiveModels ?? 0,
      desc: "Model tạm thời vô hiệu hóa",
      cls: "bg-slate-100 text-slate-700",
    },
    {
      label: "Dòng AI",
      value: summary?.familyCount ?? 0,
      desc: "Số dòng AI hiện có",
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
              Quản trị model
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Model</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Quản lý model, provider, khả năng streaming, tool calling và agent mode.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <CosmicButton onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4" />
              Thêm model
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
              <Bot className="h-5 w-5" />
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
              placeholder="Tìm theo tên model hoặc model ID..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
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
          <select
            value={filterProvider}
            onChange={(event) => {
              setFilterProvider(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
          >
            <option value="ALL">Tất cả provider</option>
            {providerOptions.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
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
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortFilter);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
            >
              <option value="NEWEST">Mới nhất</option>
              <option value="NAME_ASC">Theo tên A-Z</option>
              <option value="FAMILY">Theo dòng AI</option>
              <option value="USAGE">Theo output rate</option>
            </select>
          </div>
        </div>
      </TextFadeInUp>

      {models.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Bot className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950">Chưa có model</h2>
          <p className="mt-2 text-sm text-slate-600">
            Thêm model để gắn vào gói credits và cung cấp cho API Gateway.
          </p>
          <div className="mt-6 flex justify-center">
            <CosmicButton onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4" />
              Thêm model
            </CosmicButton>
          </div>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {models.map((model, index) => (
              <TextFadeInUp
                key={model.id}
                delay={Math.min(index * 0.04, 0.25)}
                as="article"
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold text-slate-950">{model.publicName}</h3>
                    <p className="mt-1 text-sm text-slate-600">{model.provider?.name || "Chưa gắn provider"}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      model.isActive
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    )}
                  >
                    {model.isActive ? "Đang hoạt động" : "Đang tắt"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", familyClass(model.apiFamily))}>
                    {familyLabel(model.apiFamily)}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {model.upstreamEndpointType === "RESPONSES" ? "Reasoning" : "Chat"}
                  </span>
                  {model.supportsStreaming ? (
                    <span className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      Streaming
                    </span>
                  ) : null}
                  {model.supportsTools ? (
                    <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Tools
                    </span>
                  ) : null}
                  {model.supportsAgent ? (
                    <span className="inline-flex rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      Agent
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <code className="block max-w-full flex-1 truncate rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                    {model.upstreamModel}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopyModelId(model.upstreamModel)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-xs text-slate-500">Input rate</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">x {model.inputCreditRate}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-xs text-slate-500">Output rate</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">x {model.outputCreditRate}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(model)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Pencil className="h-4 w-4" />
                    Sửa
                  </button>
                  <label className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3">
                    <Switch checked={model.isActive} onCheckedChange={() => handleToggleActive(model)} />
                  </label>
                </div>
              </TextFadeInUp>
            ))}
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
        title={editingId ? "Cập nhật model" : "Thêm model"}
        description="Quản lý model ID, dòng AI, provider và các capability của model."
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
              form="model-form"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu model"}
            </button>
          </>
        }
      >
        <form id="model-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên hiển thị" error={formErrors.publicName}>
              <input
                value={formData.publicName}
                onChange={(event) => setFormData((prev) => ({ ...prev, publicName: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />
            </Field>
            <Field label="Model ID" error={formErrors.upstreamModel}>
              <input
                value={formData.upstreamModel}
                onChange={(event) => setFormData((prev) => ({ ...prev, upstreamModel: event.target.value }))}
                placeholder="codexai/gpt-5.3-codex"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />
            </Field>
            <Field label="Dòng AI" error={formErrors.apiFamily}>
              <select
                value={formData.apiFamily}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    apiFamily: event.target.value,
                    providerId: providersList.find((provider) => provider.apiFamily === event.target.value)?.id ?? "",
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              >
                <option value="CODEXAI">CodexAI</option>
                <option value="CLAUDE">Claude</option>
                <option value="GEMINI">Gemini</option>
                <option value="DEEPSEEK">DeepSeek</option>
              </select>
            </Field>
            <Field label="Provider" error={formErrors.providerId}>
              <select
                value={formData.providerId}
                onChange={(event) => setFormData((prev) => ({ ...prev, providerId: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              >
                <option value="">Chọn provider</option>
                {filteredProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Input credit rate">
              <input
                type="number"
                min={0}
                step="0.001"
                value={formData.inputCreditRate}
                onChange={(event) => setFormData((prev) => ({ ...prev, inputCreditRate: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />
            </Field>
            <Field label="Output credit rate">
              <input
                type="number"
                min={0}
                step="0.001"
                value={formData.outputCreditRate}
                onChange={(event) => setFormData((prev) => ({ ...prev, outputCreditRate: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              />
            </Field>
            <Field label="Loại endpoint" className="md:col-span-2">
              <select
                value={formData.upstreamEndpointType}
                onChange={(event) => setFormData((prev) => ({ ...prev, upstreamEndpointType: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              >
                <option value="CHAT_COMPLETIONS">Chat</option>
                <option value="RESPONSES">Reasoning</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Hỗ trợ streaming</span>
              <Switch checked={formData.supportsStreaming} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, supportsStreaming: value }))} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Hỗ trợ tool calling</span>
              <Switch checked={formData.supportsTools} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, supportsTools: value }))} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Hỗ trợ agent mode</span>
              <Switch checked={formData.supportsAgent} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, supportsAgent: value }))} />
            </label>
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
