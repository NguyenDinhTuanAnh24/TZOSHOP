"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Server,
  Search,
  Plus,
  Edit,
  Globe,
  ShieldCheck,
  Zap,
  Clock,
  LockKeyhole,
  Key,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type AiProvider = {
  id: string;
  name: string;
  apiFamily: string;
  baseUrl: string;
  encryptedApiKey: string;
  isActive: boolean;
  updatedAt: string;
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

function maskEncryptedKey(encryptedApiKey: string) {
  const last4 = (encryptedApiKey || "").slice(-4);
  return `********${last4 || "****"}`;
}

function ProvidersSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="h-8 w-56 animate-pulse bg-[#E9E1D0]" />
        <div className="mt-3 h-4 w-full max-w-[560px] animate-pulse bg-[#E9E1D0]" />
      </section>
      <section className="border-4 border-black bg-[#C7F0D8] p-4 shadow-[6px_6px_0px_0px_#000]">
        <div className="h-12 animate-pulse bg-[#E9E1D0]" />
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

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    apiFamily: "CODEXAI",
    baseUrl: "",
    apiKey: "",
    isActive: true,
  });

  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/providers");
      const result = await res.json();
      if (result.success) setProviders(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProviders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProviders]);

  const handleOpenModal = (provider?: AiProvider) => {
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
      setFormData({
        name: "",
        apiFamily: "CODEXAI",
        baseUrl: "",
        apiKey: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingId && !formData.apiKey) {
      showToast("Vui lòng nhập API Key.", "error");
      return;
    }

    try {
      const url = editingId ? `/api/admin/providers/${editingId}` : "/api/admin/providers";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        showToast(editingId ? "Đã cập nhật provider." : "Đã tạo provider mới.", "success");
        setIsModalOpen(false);
        void fetchProviders();
      } else {
        showToast(result.error?.message || result.message || "Lỗi khi lưu.", "error");
      }
    } catch {
      showToast("Lỗi hệ thống.", "error");
    }
  };

  const handleToggleActive = (provider: AiProvider) => {
    const isActivating = !provider.isActive;
    const action = isActivating ? "Bật" : "Tắt";

    askConfirm({
      title: `${action} provider ${provider.name}?`,
      description: isActivating
        ? "Kết nối API này sẽ được đưa vào sử dụng để điều phối các lượt gọi model."
        : "Các model dùng provider này sẽ không thể gọi API cho đến khi được bật lại hoặc có provider khác thay thế.",
      confirmLabel: `Xác nhận ${action}`,
      cancelLabel: "Hủy",
      type: isActivating ? "warning" : "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/providers/${provider.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: isActivating }),
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Đã ${action.toLowerCase()} provider.`, "success");
          void fetchProviders();
        } else {
          showToast("Có lỗi xảy ra.", "error");
        }
      },
    });
  };

  const filteredProviders = providers.filter((p) => {
    const s = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(s) ||
      p.apiFamily.toLowerCase().includes(s) ||
      p.baseUrl.toLowerCase().includes(s);
    const matchesFamily = filterFamily === "ALL" || p.apiFamily === filterFamily;
    const matchesActive = filterActive === "ALL" || (filterActive === "ACTIVE" ? p.isActive : !p.isActive);
    return matchesSearch && matchesFamily && matchesActive;
  });

  const activeCount = providers.filter((p) => p.isActive).length;
  const inactiveCount = Math.max(0, providers.length - activeCount);
  const familyCount = new Set(providers.map((p) => p.apiFamily)).size;

  const brutalInput =
    "h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none";

  if (isLoading && providers.length === 0) {
    return <ProvidersSkeleton />;
  }

  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <Server className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">
                PROVIDERS
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">PROVIDERS</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">
              Quản lý kết nối upstream API dùng cho từng dòng AI.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-end lg:w-auto">
            <div className="border-4 border-black bg-[#C7F0D8] px-4 py-3 text-black shadow-[4px_4px_0px_0px_#000]">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Đang kết nối</p>
              <p className="text-xl font-black text-black">
                {activeCount} / {providers.length}
              </p>
            </div>
            <AppButton
              onClick={() => handleOpenModal()}
              className="h-12 border-4 border-black bg-[#FFD93D] px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 hover:bg-[#FF6B6B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              THÊM PROVIDER
            </AppButton>
          </div>
        </div>
      </section>

      <section className="flex items-start gap-4 border-4 border-black bg-[#C7F0D8] p-4 shadow-[6px_6px_0px_0px_#000] md:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center border-4 border-black bg-white shadow-[3px_3px_0px_0px_#000]">
          <ShieldCheck className="h-5 w-5 text-black" />
        </div>
        <div>
          <p className="text-sm font-black uppercase text-black">BẢO MẬT API KEY</p>
          <p className="mt-1 text-sm font-bold text-black/70">
            API key provider được mã hóa trước khi lưu trữ và chỉ hiển thị dạng ẩn trong khu vực quản trị.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng providers", value: providers.length, bg: "bg-[#DBEAFE]" },
          { label: "Đang bật", value: activeCount, bg: "bg-[#C7F0D8]" },
          { label: "Đang tắt", value: inactiveCount, bg: "bg-[#FF6B6B]" },
          { label: "Dòng AI", value: familyCount, bg: "bg-[#FFD93D]" },
        ].map((item) => (
          <article key={item.label} className="min-h-[110px] border-4 border-black bg-[#FFFDF5] p-4 shadow-[5px_5px_0px_0px_#000]">
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${item.bg}`}>
                <Server className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/70">{item.label}</p>
                <p className="mt-2 text-2xl font-black leading-none text-black">{item.value.toLocaleString("vi-VN")}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_190px_170px_auto]">
          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
              <input
                type="text"
                placeholder="Tìm theo tên provider hoặc dòng AI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(brutalInput, "pl-10")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Dòng AI</label>
            <select value={filterFamily} onChange={(e) => setFilterFamily(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả dòng AI</option>
              <option value="CODEXAI">CodexAI</option>
              <option value="CLAUDE">Claude</option>
              <option value="GEMINI">Gemini</option>
              <option value="DEEPSEEK">DeepSeek</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Trạng thái</label>
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang bật</option>
              <option value="INACTIVE">Đang tắt</option>
            </select>
          </div>

          <div className="flex items-end">
            <AppButton
              onClick={() => {
                setSearch("");
                setFilterFamily("ALL");
                setFilterActive("ALL");
                void fetchProviders();
              }}
              className="h-12 w-full border-4 border-black bg-[#FFD93D] px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              LÀM MỚI
            </AppButton>
          </div>
        </div>
      </section>

      <section className="hidden overflow-hidden border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] lg:block md:p-5">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b-4 border-black bg-[#FFFDF5]">
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Tên provider</th>
                <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Dòng AI</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Base URL / Endpoint</th>
                <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/65">API key đã ẩn</th>
                <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Trạng thái</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Cập nhật</th>
                <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
                        <Server className="h-7 w-7 text-black" />
                      </div>
                      <p className="text-xl font-black text-black">
                        {providers.length === 0 ? "CHƯA CÓ PROVIDER NÀO" : "KHÔNG TÌM THẤY PROVIDER"}
                      </p>
                      <p className="mt-1 text-sm font-bold text-black/60">Thử đổi bộ lọc hoặc thêm provider mới.</p>
                      <AppButton
                        onClick={() => handleOpenModal()}
                        className="mt-4 h-11 border-4 border-black bg-[#FFD93D] px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
                      >
                        THÊM PROVIDER
                      </AppButton>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProviders.map((provider) => (
                  <tr key={provider.id} className="border-b-2 border-black/10 align-middle transition-colors hover:bg-[#FFF8D6]">
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${familyBadgeClass(provider.apiFamily)}`}>
                          <Zap className="h-4 w-4 text-black" />
                        </div>
                        <p className="break-words text-base font-black text-black">{provider.name}</p>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex border-2 border-black px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${familyBadgeClass(provider.apiFamily)}`}>
                        {familyLabel(provider.apiFamily)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        title={provider.baseUrl}
                        className="inline-flex max-w-[280px] items-center gap-2 truncate border-2 border-black bg-[#FFFDF5] px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000]"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {provider.baseUrl}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        title="API key đã được ẩn."
                        className="inline-flex max-w-[220px] items-center gap-2 border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-black text-black shadow-[2px_2px_0px_0px_#000]"
                      >
                        <LockKeyhole className="h-3.5 w-3.5" />
                        {maskEncryptedKey(provider.encryptedApiKey)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={provider.isActive}
                          onCheckedChange={() => handleToggleActive(provider)}
                          className="border-2 border-black data-[state=checked]:bg-[#C7F0D8] data-[state=unchecked]:bg-[#FF6B6B]"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-black">
                        <Clock className="h-4 w-4 text-black/70" />
                        <span title={provider.updatedAt}>{format(new Date(provider.updatedAt), "HH:mm dd/MM", { locale: vi })}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(provider)}
                        title="Sửa provider"
                        aria-label="Sửa provider"
                        className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000] transition-all duration-100 hover:bg-[#FFD93D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:hidden">
        {filteredProviders.length === 0 ? (
          <article className="flex min-h-[260px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-6 text-center shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
              <Server className="h-7 w-7 text-black" />
            </div>
            <p className="text-lg font-black text-black">
              {providers.length === 0 ? "CHƯA CÓ PROVIDER NÀO" : "KHÔNG TÌM THẤY PROVIDER"}
            </p>
            <p className="mt-1 text-sm font-bold text-black/60">Thử đổi bộ lọc hoặc thêm provider mới.</p>
          </article>
        ) : (
          filteredProviders.map((provider) => (
            <article key={provider.id} className="space-y-4 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-base font-black text-black">{provider.name}</p>
                  <p className="mt-1 text-xs font-bold text-black/60">{format(new Date(provider.updatedAt), "HH:mm dd/MM", { locale: vi })}</p>
                </div>
                <span className={`inline-flex border-2 border-black px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${familyBadgeClass(provider.apiFamily)}`}>
                  {familyLabel(provider.apiFamily)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="border-2 border-black bg-white p-2">
                  <p className="text-[11px] font-black uppercase text-black/60">Base URL</p>
                  <p className="mt-1 break-all text-xs font-bold text-black">{provider.baseUrl}</p>
                </div>
                <div className="border-2 border-black bg-white p-2">
                  <p className="text-[11px] font-black uppercase text-black/60">API key đã ẩn</p>
                  <p className="mt-1 break-all font-mono text-xs font-black text-black">{maskEncryptedKey(provider.encryptedApiKey)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Switch
                  checked={provider.isActive}
                  onCheckedChange={() => handleToggleActive(provider)}
                  className="border-2 border-black data-[state=checked]:bg-[#C7F0D8] data-[state=unchecked]:bg-[#FF6B6B]"
                />
                <button
                  type="button"
                  onClick={() => handleOpenModal(provider)}
                  className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000]"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <Modal
        open={isModalOpen}
        title={editingId ? "Cập nhật Provider" : "Thêm Provider mới"}
        onClose={() => setIsModalOpen(false)}
        maxWidthClassName="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="max-h-[90vh] space-y-6 overflow-y-auto bg-[#FFFDF5] p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Tên provider</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: OpenAI Default"
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

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Base URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60" />
                <input
                  type="url"
                  required
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className={cn(brutalInput, "pl-10")}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.1em] text-black/60">API key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60" />
                <input
                  type="password"
                  required={!editingId}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={editingId ? "Bỏ trống nếu muốn giữ API key cũ" : "sk-proj-..."}
                  className={cn(brutalInput, "pl-10")}
                />
              </div>
              <p className="text-xs font-bold text-black/60">API key sẽ được mã hóa trước khi lưu.</p>
            </div>
          </div>

          <label className="flex items-center gap-3 border-4 border-black bg-white p-4">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-5 w-5 border-2 border-black"
            />
            <span className="text-sm font-black text-black">Kích hoạt Provider</span>
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
              {editingId ? "LƯU PROVIDER" : "THÊM PROVIDER"}
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

