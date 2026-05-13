"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bot,
  Search,
  Plus,
  Server,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  RefreshCw,
  Layers,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { AiFamilyLogo, familyIconBoxClass } from "@/components/admin/ai-family-logo";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { Switch } from "@/components/ui/switch";

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

function familyBadgeClass(family: string) {
  if (family === "CODEXAI") return "bg-[#C7F0D8]";
  if (family === "CLAUDE") return "bg-[#FFD93D]";
  if (family === "GEMINI") return "bg-[#A78BFA]";
  if (family === "DEEPSEEK") return "bg-[#FF6B6B]";
  return "bg-[#DBEAFE]";
}

function familyLabel(family: string) {
  if (family === "CODEXAI") return "CodexAI";
  if (family === "CLAUDE") return "Claude";
  if (family === "GEMINI") return "Gemini";
  if (family === "DEEPSEEK") return "DeepSeek";
  return family;
}

function ModelsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="h-8 w-64 animate-pulse bg-[#E9E1D0]" />
        <div className="mt-3 h-4 w-full max-w-[560px] animate-pulse bg-[#E9E1D0]" />
      </section>

      <section className="border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="h-20 animate-pulse bg-[#E9E1D0]" />
      </section>

      <section className="border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] md:p-5">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 border-2 border-black bg-[#E9E1D0] animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [providersList, setProvidersList] = useState<AiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState("ALL");
  const [filterProvider, setFilterProvider] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/models");
      const result = await res.json();
      if (result.success) setModels(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/providers");
      const result = await res.json();
      if (result.success) setProvidersList(result.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchModels();
      void fetchProviders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchModels, fetchProviders]);

  const handleOpenModal = (model?: AiModel) => {
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
        providerId: providersList.length > 0 ? providersList[0].id : "",
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
    try {
      if (!editingId && models.some((m) => m.publicName.toLowerCase() === formData.publicName.toLowerCase())) {
        showToast("Tên Public Name này đã tồn tại.", "error");
        return;
      }

      if (!formData.providerId) {
        showToast("Vui lòng chọn Provider.", "error");
        return;
      }

      const url = editingId ? `/api/admin/models/${editingId}` : "/api/admin/models";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        showToast(editingId ? "Đã cập nhật model." : "Đã tạo model mới.", "success");
        setIsModalOpen(false);
        void fetchModels();
      } else {
        showToast(result.error?.message || result.message || "Lỗi khi lưu.", "error");
      }
    } catch (err) {
      showToast("Lỗi khi lưu model", "error");
      console.error(err);
    }
  };

  const handleToggleActive = (model: AiModel) => {
    const isActivating = !model.isActive;
    const action = isActivating ? "Bật" : "Tắt";

    askConfirm({
      title: `${action} model ${model.publicName}?`,
      description: isActivating
        ? "Người dùng sẽ có thể gọi API sử dụng model này."
        : "Model này sẽ tạm thời bị ẩn khỏi danh sách hỗ trợ của hệ thống.",
      confirmLabel: `Xác nhận ${action}`,
      cancelLabel: "Hủy",
      type: isActivating ? "warning" : "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/models/${model.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: isActivating }),
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Đã ${action.toLowerCase()} model.`, "success");
          void fetchModels();
        } else {
          showToast("Có lỗi xảy ra.", "error");
        }
      },
    });
  };

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.publicName.toLowerCase().includes(search.toLowerCase()) ||
      m.upstreamModel.toLowerCase().includes(search.toLowerCase());
    const matchesFamily = filterFamily === "ALL" || m.apiFamily === filterFamily;
    const matchesProvider = filterProvider === "ALL" || m.providerId === filterProvider;
    const matchesActive = filterActive === "ALL" || (filterActive === "ACTIVE" ? m.isActive : !m.isActive);

    return matchesSearch && matchesFamily && matchesProvider && matchesActive;
  });

  const totalPages = Math.max(1, Math.ceil(filteredModels.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedModels = filteredModels.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE);

  const families = Array.from(new Set(models.map((m) => m.apiFamily)));
  const uniqueProviders = Array.from(new Set(models.map((m) => m.providerId))).map((id) => {
    const model = models.find((m) => m.providerId === id);
    return { id, name: model?.provider?.name || "Unknown" };
  });

  const activeCount = models.filter((m) => m.isActive).length;
  const inactiveCount = Math.max(0, models.length - activeCount);
  const providerCount = new Set(models.map((m) => m.providerId)).size;

  const brutalInput =
    "h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none";

  if (isLoading && models.length === 0) {
    return <ModelsSkeleton />;
  }

  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <Bot className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">
                MODEL REGISTRY
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">AI MODELS</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">
              Quản lý model public, model upstream và mức quy đổi credits.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-end lg:w-auto">
            <div className="border-4 border-black bg-[#C7F0D8] px-4 py-3 text-black shadow-[4px_4px_0px_0px_#000]">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Đang sẵn sàng</p>
              <p className="text-xl font-black text-black">
                {activeCount} / {models.length}
              </p>
            </div>
            <AppButton
              onClick={() => handleOpenModal()}
              className="h-12 border-4 border-black bg-[#FFD93D] px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 hover:bg-[#FF6B6B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              THÊM MODEL
            </AppButton>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng models", value: models.length, bg: "bg-[#DBEAFE]", icon: Layers },
          { label: "Đang bật", value: activeCount, bg: "bg-[#C7F0D8]", icon: Bot },
          { label: "Đang tắt", value: inactiveCount, bg: "bg-[#FF6B6B]", icon: Bot },
          { label: "Providers", value: providerCount, bg: "bg-[#FFD93D]", icon: Server },
        ].map((item) => (
          <article key={item.label} className="min-h-[110px] border-4 border-black bg-[#FFFDF5] p-4 shadow-[5px_5px_0px_0px_#000]">
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${item.bg}`}>
                <item.icon className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/70">{item.label}</p>
                <p className="mt-2 text-2xl font-black leading-none text-black">{item.value.toLocaleString("vi-VN")}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4 border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_190px_220px_170px]">
          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
              <input
                type="text"
                placeholder="Tìm theo tên model hoặc upstream..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className={cn(brutalInput, "pl-10")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Dòng AI</label>
            <select
              value={filterFamily}
              onChange={(e) => {
                setFilterFamily(e.target.value);
                setCurrentPage(1);
              }}
              className={brutalInput}
            >
              <option value="ALL">Tất cả dòng AI</option>
              {families.map((f) => (
                <option key={f} value={f}>
                  {familyLabel(f)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Provider</label>
            <select
              value={filterProvider}
              onChange={(e) => {
                setFilterProvider(e.target.value);
                setCurrentPage(1);
              }}
              className={brutalInput}
            >
              <option value="ALL">Tất cả provider</option>
              {uniqueProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Trạng thái</label>
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setCurrentPage(1);
              }}
              className={brutalInput}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bật</option>
              <option value="INACTIVE">Đang tắt</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-black/70">
            Đang hiển thị <span className="font-black text-black">{filteredModels.length}</span> models
          </p>
          <div className="flex flex-wrap gap-2">
            <AppButton
              onClick={() => {
                setSearch("");
                setFilterFamily("ALL");
                setFilterProvider("ALL");
                setFilterActive("ALL");
                setCurrentPage(1);
              }}
              className="h-11 border-4 border-black bg-white px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
            >
              XÓA LỌC
            </AppButton>
            <AppButton
              onClick={() => {
                void fetchModels();
                void fetchProviders();
              }}
              className="h-11 border-4 border-black bg-[#FFD93D] px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              LÀM MỚI
            </AppButton>
          </div>
        </div>
      </section>

      <section className="min-w-0 hidden overflow-hidden border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] lg:block md:p-5">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b-4 border-black bg-[#FFFDF5]">
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Tên hiển thị</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Dòng AI</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Nhà cung cấp</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Model gốc upstream</th>
                <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Hệ số input</th>
                <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Hệ số output</th>
                <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Trạng thái</th>
                <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedModels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
                        <Bot className="h-7 w-7 text-black" />
                      </div>
                      <p className="text-xl font-black text-black">KHÔNG TÌM THẤY MODEL</p>
                      <p className="mt-1 text-sm font-bold text-black/60">Thử đổi bộ lọc hoặc thêm model mới.</p>
                      <AppButton
                        onClick={() => handleOpenModal()}
                        className="mt-4 h-11 border-4 border-black bg-[#FFD93D] px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
                      >
                        THÊM MODEL
                      </AppButton>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedModels.map((model) => (
                  <tr key={model.id} className="border-b-2 border-black/10 align-middle transition-colors hover:bg-[#FFF8D6]">
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={cn("h-10 w-10 shrink-0", familyIconBoxClass(model.apiFamily))}>
                          <AiFamilyLogo family={model.apiFamily} className="h-6 w-6 object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="break-all text-sm font-black text-black">{model.publicName}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex border-2 border-black px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${familyBadgeClass(model.apiFamily)}`}>
                        {familyLabel(model.apiFamily)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <Server className="h-4 w-4 shrink-0 text-black/70" />
                        <span className="max-w-[240px] truncate text-sm font-bold text-black" title={model.provider?.name || "Chưa gán provider"}>
                          {model.provider?.name || "Chưa gán provider"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className="inline-flex max-w-[280px] truncate border-2 border-black bg-[#FFFDF5] px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000]"
                        title={model.upstreamModel}
                      >
                        {model.upstreamModel}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000]">
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        × {model.inputCreditRate}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 border-2 border-black bg-[#DBEAFE] px-3 py-1 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000]">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        × {model.outputCreditRate}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={model.isActive}
                          onCheckedChange={() => handleToggleActive(model)}
                          className="border-2 border-black data-[state=checked]:bg-[#C7F0D8] data-[state=unchecked]:bg-[#FF6B6B]"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(model)}
                        title="Sửa model"
                        aria-label="Sửa model"
                        className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000] transition-all duration-100 hover:bg-[#FFD93D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredModels.length > 0 && totalPages > 1 ? (
          <div className="mt-4 flex flex-col gap-4 border-t-2 border-black/20 pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-bold text-black/70">
              Hiển thị <span className="font-black text-black">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> -{" "}
              <span className="font-black text-black">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredModels.length)}</span> trong tổng{" "}
              <span className="font-black text-black">{filteredModels.length}</span> models
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <AppButton
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="h-11 border-4 border-black bg-white px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Trước
              </AppButton>
              <div className="h-11 border-4 border-black bg-[#FFD93D] px-4 text-sm font-black text-black shadow-[4px_4px_0px_0px_#000] inline-flex items-center">
                {safeCurrentPage} / {totalPages}
              </div>
              <AppButton
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="h-11 border-4 border-black bg-white px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Sau
              </AppButton>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:hidden">
        {paginatedModels.length === 0 ? (
          <article className="flex min-h-[260px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-6 text-center shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
              <Bot className="h-7 w-7 text-black" />
            </div>
            <p className="text-lg font-black text-black">KHÔNG TÌM THẤY MODEL</p>
            <p className="mt-1 text-sm font-bold text-black/60">Thử đổi bộ lọc hoặc thêm model mới.</p>
          </article>
        ) : (
          paginatedModels.map((model) => (
            <article key={model.id} className="space-y-4 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all text-base font-black text-black">{model.publicName}</p>
                  <p className="mt-1 break-all text-xs font-bold text-black/60">{model.provider?.name || "Chưa gán provider"}</p>
                </div>
                <span className={`inline-flex border-2 border-black px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${familyBadgeClass(model.apiFamily)}`}>
                  {familyLabel(model.apiFamily)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="border-2 border-black bg-white p-2">
                  <p className="text-[11px] font-black uppercase text-black/60">Upstream</p>
                  <p className="mt-1 break-all font-mono text-xs font-bold text-black">{model.upstreamModel}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-2 border-black bg-[#C7F0D8] p-2 text-center">
                    <p className="text-[11px] font-black uppercase text-black/60">Input</p>
                    <p className="text-sm font-black text-black">× {model.inputCreditRate}</p>
                  </div>
                  <div className="border-2 border-black bg-[#DBEAFE] p-2 text-center">
                    <p className="text-[11px] font-black uppercase text-black/60">Output</p>
                    <p className="text-sm font-black text-black">× {model.outputCreditRate}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Switch
                  checked={model.isActive}
                  onCheckedChange={() => handleToggleActive(model)}
                  className="border-2 border-black data-[state=checked]:bg-[#C7F0D8] data-[state=unchecked]:bg-[#FF6B6B]"
                />
                <button
                  type="button"
                  onClick={() => handleOpenModal(model)}
                  className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <Modal
        open={isModalOpen}
        title={editingId ? "Cập nhật AI Model" : "Thêm AI Model mới"}
        onClose={() => setIsModalOpen(false)}
        maxWidthClassName="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="max-h-[90vh] space-y-6 overflow-y-auto bg-[#FFFDF5] p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Tên model public</label>
              <input
                type="text"
                required
                value={formData.publicName}
                onChange={(e) => setFormData({ ...formData, publicName: e.target.value })}
                placeholder="Ví dụ: claude/claude-haiku-4.5"
                className={brutalInput}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Dòng AI</label>
              <select
                value={formData.apiFamily}
                onChange={(e) => setFormData({ ...formData, apiFamily: e.target.value })}
                className={brutalInput}
              >
                <option value="CODEXAI">CodexAI</option>
                <option value="CLAUDE">Claude</option>
                <option value="GEMINI">Gemini</option>
                <option value="DEEPSEEK">DeepSeek</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Provider</label>
              <select
                required
                value={formData.providerId}
                onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                className={brutalInput}
              >
                <option value="" disabled>
                  Chọn Provider
                </option>
                {providersList
                  .filter((p) => p.apiFamily === formData.apiFamily)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                {providersList.filter((p) => p.apiFamily === formData.apiFamily).length === 0 ? (
                  <option value="" disabled>
                    Không có provider cho family này
                  </option>
                ) : null}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Model upstream</label>
              <input
                type="text"
                required
                value={formData.upstreamModel}
                onChange={(e) => setFormData({ ...formData, upstreamModel: e.target.value })}
                placeholder="Ví dụ: claude-sonnet-4-5"
                className={brutalInput}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Hệ số input</label>
              <input
                type="number"
                step="0.001"
                required
                min="0"
                value={formData.inputCreditRate}
                onChange={(e) => setFormData({ ...formData, inputCreditRate: e.target.value })}
                className={brutalInput}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Hệ số output</label>
              <input
                type="number"
                step="0.001"
                required
                min="0"
                value={formData.outputCreditRate}
                onChange={(e) => setFormData({ ...formData, outputCreditRate: e.target.value })}
                className={brutalInput}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Kiểu upstream endpoint</label>
              <select
                value={formData.upstreamEndpointType}
                onChange={(e) => setFormData({ ...formData, upstreamEndpointType: e.target.value })}
                className={brutalInput}
              >
                <option value="CHAT_COMPLETIONS">Chat Completions (/v1/chat/completions)</option>
                <option value="RESPONSES">Responses API (/v1/responses)</option>
              </select>
              <p className="text-xs font-bold text-black/60">
                Chọn Responses API cho các model đặc thù yêu cầu cấu trúc input/output khác.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 border-4 border-black bg-white p-4">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-5 w-5 border-2 border-black"
            />
            <span className="text-sm font-black text-black">Trạng thái hoạt động</span>
          </label>

          <div className="flex flex-col justify-end gap-3 border-t-2 border-black/20 pt-4 sm:flex-row">
            <AppButton
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-12 border-4 border-black bg-white px-6 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
            >
              Hủy
            </AppButton>
            <AppButton
              type="submit"
              className="h-12 border-4 border-black bg-[#FFD93D] px-6 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
            >
              {editingId ? "Lưu thay đổi" : "Lưu model"}
            </AppButton>
          </div>
        </form>
      </Modal>

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
