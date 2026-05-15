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

type AiModel = {
  id: string;
  publicName: string;
  upstreamModel: string;
  apiFamily: string;
  providerId: string;
  provider: { name: string };
  inputCreditRate: number;
  outputCreditRate: number;
  upstreamEndpointType: string;
  isActive: boolean;
};

type AiProvider = {
  id: string;
  name: string;
  apiFamily: string;
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
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
    isActive: true,
  });

  const { toast, showToast, clearToast } = useToast(3000);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [resModels, resProviders] = await Promise.all([fetch("/api/admin/models", { cache: "no-store" }), fetch("/api/admin/providers", { cache: "no-store" })]);
      const [modelsJson, providersJson] = await Promise.all([resModels.json(), resProviders.json()]);
      if (!resModels.ok || !modelsJson.success) throw new Error();
      setModels(modelsJson.data || []);
      if (providersJson.success) setProvidersList(providersJson.data || []);
    } catch {
      setLoadError("Vui lòng thử lại sau ít phút.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchModels(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchModels]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.publicName.trim()) errors.publicName = "Tên hiển thị là bắt buộc";
    if (!formData.upstreamModel.trim()) errors.upstreamModel = "Model ID là bắt buộc";
    if (!formData.apiFamily) errors.apiFamily = "Dòng AI là bắt buộc";
    if (!/^[a-z0-9/_\-.]+$/i.test(formData.upstreamModel)) errors.upstreamModel = "Model ID không đúng định dạng";
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
        inputCreditRate: model.inputCreditRate.toString(),
        outputCreditRate: model.outputCreditRate.toString(),
        upstreamEndpointType: model.upstreamEndpointType,
        isActive: model.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        publicName: "",
        upstreamModel: "",
        apiFamily: "CODEXAI",
        providerId: providersList.find((p) => p.apiFamily === "CODEXAI")?.id || "",
        inputCreditRate: "1",
        outputCreditRate: "1",
        upstreamEndpointType: "CHAT_COMPLETIONS",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const url = editingId ? `/api/admin/models/${editingId}` : "/api/admin/models";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(editingId ? "Đã lưu model" : "Đã tạo model", "success");
        setIsModalOpen(false);
        void fetchModels();
      } else {
        showToast(result?.error?.message || result?.message || "Không thể lưu model", "error");
      }
    } catch {
      showToast("Không thể lưu model", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = (model: AiModel) => {
    const isActivating = !model.isActive;
    askConfirm({
      title: isActivating ? "Bật model này?" : "Tắt model này?",
      description: isActivating
        ? "Model này sẽ có thể được sử dụng lại trong các gói credits."
        : "Model này sẽ không còn được hiển thị hoặc chọn cho các gói mới.",
      confirmLabel: isActivating ? "Bật model" : "Tắt model",
      type: isActivating ? "primary" : "warning",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/models/${model.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: isActivating }),
        });
        const result = await res.json();
        if (res.ok && result.success) {
          showToast(isActivating ? "Đã bật model" : "Đã tắt model", "success");
          void fetchModels();
        } else {
          showToast("Không thể lưu model", "error");
        }
      },
    });
  };

  const handleCopyModelId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast("Đã sao chép model id", "success");
    } catch {
      showToast("Không thể sao chép model id", "error");
    }
  };

  const filteredModels = useMemo(() => {
    const list = models
      .filter((m) => {
        const kw = search.trim().toLowerCase();
        if (!kw) return true;
        return (
          m.publicName.toLowerCase().includes(kw) ||
          m.upstreamModel.toLowerCase().includes(kw) ||
          m.apiFamily.toLowerCase().includes(kw)
        );
      })
      .filter((m) => (filterFamily === "ALL" ? true : m.apiFamily === filterFamily))
      .filter((m) => (filterProvider === "ALL" ? true : m.providerId === filterProvider))
      .filter((m) => (filterStatus === "ALL" ? true : filterStatus === "ACTIVE" ? m.isActive : !m.isActive));

    if (sortBy === "NAME_ASC") return [...list].sort((a, b) => a.publicName.localeCompare(b.publicName));
    if (sortBy === "FAMILY") return [...list].sort((a, b) => a.apiFamily.localeCompare(b.apiFamily));
    if (sortBy === "USAGE") return [...list].sort((a, b) => b.outputCreditRate - a.outputCreditRate);
    return [...list].sort((a, b) => a.publicName.localeCompare(b.publicName));
  }, [models, search, filterFamily, filterProvider, filterStatus, sortBy]);

  const summary = useMemo(() => {
    const total = models.length;
    const active = models.filter((m) => m.isActive).length;
    const inactive = total - active;
    const families = new Set(models.map((m) => m.apiFamily)).size;
    return { total, active, inactive, families };
  }, [models]);

  const providers = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of providersList) map.set(p.id, p.name);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [providersList]);

  const filteredProviders = providersList.filter((p) => p.apiFamily === formData.apiFamily);

  if (isLoading && !models.length) return <ModelsSkeleton />;

  if (loadError && !models.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải danh sách model</h2>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <button type="button" onClick={() => void fetchModels()} className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Thử lại</button>
      </section>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-1">
      <TextFadeInUp as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Quản trị model</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Model</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Quản lý danh sách model, dòng AI, trạng thái hiển thị và khả năng sử dụng trong các gói credits.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <CosmicButton onClick={() => handleOpenModal()}><Plus className="h-4 w-4" />Thêm model</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng model", value: summary.total, desc: "Tất cả model đang quản lý", cls: "bg-indigo-50 text-indigo-700" },
          { label: "Đang hoạt động", value: summary.active, desc: "Model sẵn sàng sử dụng", cls: "bg-emerald-50 text-emerald-700" },
          { label: "Đang tắt", value: summary.inactive, desc: "Model tạm ngưng", cls: "bg-slate-100 text-slate-700" },
          { label: "Dòng AI", value: summary.families, desc: "Số dòng AI hiện có", cls: "bg-violet-50 text-violet-700" },
        ].map((card, i) => (
          <TextFadeInUp key={card.label} delay={Math.min(i * 0.05, 0.25)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", card.cls)}><Bot className="h-5 w-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950">{card.value.toLocaleString("vi-VN")}</p>
            <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên model, slug hoặc dòng AI..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
          <select value={filterFamily} onChange={(e) => setFilterFamily(e.target.value as FamilyFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="ALL">Tất cả dòng AI</option><option value="CODEXAI">CodexAI</option><option value="CLAUDE">Claude</option><option value="GEMINI">Gemini</option><option value="DEEPSEEK">DeepSeek</option></select>
          <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="ALL">Tất cả provider</option>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <div className="grid grid-cols-2 gap-3"><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Đang tắt</option></select><select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="NEWEST">Mới nhất</option><option value="NAME_ASC">Theo tên A-Z</option><option value="FAMILY">Theo dòng AI</option><option value="USAGE">Đang dùng nhiều</option></select></div>
        </div>
      </TextFadeInUp>

      {filteredModels.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Bot className="h-7 w-7" /></div>
          <h2 className="text-2xl font-extrabold text-slate-950">Chưa có model</h2>
          <p className="mt-2 text-sm text-slate-600">Thêm model đầu tiên để gắn vào các gói credits và hiển thị trong tài liệu sử dụng.</p>
          <div className="mt-6 flex justify-center"><CosmicButton onClick={() => handleOpenModal()}><Plus className="h-4 w-4" />Thêm model</CosmicButton></div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredModels.map((model, i) => (
            <TextFadeInUp key={model.id} delay={Math.min(i * 0.04, 0.25)} as="article" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="truncate text-lg font-extrabold text-slate-950">{model.publicName}</h3><p className="mt-1 text-sm text-slate-600">{model.provider?.name || "Chưa gắn provider"}</p></div>
                <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", model.isActive ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600")}>{model.isActive ? "Đang hoạt động" : "Đang tắt"}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", familyClass(model.apiFamily))}>{familyLabel(model.apiFamily)}</span><span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{model.upstreamEndpointType === "RESPONSES" ? "Reasoning" : "Chat"}</span></div>

              <div className="mt-4 flex items-center gap-2">
                <code className="block max-w-full flex-1 truncate rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">{model.upstreamModel}</code>
                <button type="button" onClick={() => void handleCopyModelId(model.upstreamModel)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"><Copy className="h-4 w-4" /></button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"><p className="text-xs text-slate-500">Input rate</p><p className="mt-1 text-sm font-semibold text-slate-900">x {model.inputCreditRate}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"><p className="text-xs text-slate-500">Output rate</p><p className="mt-1 text-sm font-semibold text-slate-900">x {model.outputCreditRate}</p></div>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <button type="button" onClick={() => handleOpenModal(model)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Pencil className="h-4 w-4" />Sửa</button>
                <label className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3"><Switch checked={model.isActive} onCheckedChange={() => handleToggleActive(model)} /></label>
              </div>
            </TextFadeInUp>
          ))}
        </section>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Cập nhật model" : "Thêm model"}
        description="Quản lý model id, dòng AI, provider, trạng thái và hệ số credits."
        maxWidthClassName="max-w-3xl"
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
            <button type="submit" form="model-form" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60">{isSubmitting ? "Đang lưu..." : "Lưu model"}</button>
          </>
        }
      >
        <form id="model-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên hiển thị" error={formErrors.publicName}><input value={formData.publicName} onChange={(e) => setFormData((f) => ({ ...f, publicName: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950" /></Field>
            <Field label="Model ID" error={formErrors.upstreamModel}><input value={formData.upstreamModel} onChange={(e) => setFormData((f) => ({ ...f, upstreamModel: e.target.value }))} placeholder="codexai/gpt-5.3-codex" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950" /></Field>
            <Field label="Dòng AI" error={formErrors.apiFamily}><select value={formData.apiFamily} onChange={(e) => setFormData((f) => ({ ...f, apiFamily: e.target.value, providerId: "" }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="CODEXAI">CodexAI</option><option value="CLAUDE">Claude</option><option value="GEMINI">Gemini</option><option value="DEEPSEEK">DeepSeek</option></select></Field>
            <Field label="Provider"><select value={formData.providerId} onChange={(e) => setFormData((f) => ({ ...f, providerId: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="">Chọn provider</option>{filteredProviders.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Input credit rate"><input type="number" min={0} step="0.001" value={formData.inputCreditRate} onChange={(e) => setFormData((f) => ({ ...f, inputCreditRate: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950" /></Field>
            <Field label="Output credit rate"><input type="number" min={0} step="0.001" value={formData.outputCreditRate} onChange={(e) => setFormData((f) => ({ ...f, outputCreditRate: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950" /></Field>
            <Field label="Loại model" className="md:col-span-2"><select value={formData.upstreamEndpointType} onChange={(e) => setFormData((f) => ({ ...f, upstreamEndpointType: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="CHAT_COMPLETIONS">Chat</option><option value="RESPONSES">Reasoning</option></select></Field>
          </div>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700"><span>Đang hoạt động</span><Switch checked={formData.isActive} onCheckedChange={(v) => setFormData((f) => ({ ...f, isActive: v }))} /></label>
        </form>
      </Modal>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
      {confirmState ? <ConfirmDialog open={Boolean(confirmState)} title={confirmState.title} description={confirmState.description} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} type={confirmState.type} isLoading={isConfirming} onConfirm={handleConfirm} onCancel={closeConfirm} /> : null}
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
