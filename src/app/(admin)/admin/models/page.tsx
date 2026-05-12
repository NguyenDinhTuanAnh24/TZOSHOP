"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Bot,
  Search,
  Plus,
  Server,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
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

export default function AdminModelsPage() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [providersList, setProvidersList] = useState<AiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
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
      fetchModels();
      fetchProviders();
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
      // Check for duplicate publicName locally first (only for NEW models)
      if (!editingId && models.some(m => m.publicName.toLowerCase() === formData.publicName.toLowerCase())) {
         showToast("Tên Public Name này đã tồn tại.", "error");
         return;
      }

      if (!formData.providerId) {
        showToast("Vui lòng chọn Provider.", "error");
        return;
      }

      const url = editingId 
        ? `/api/admin/models/${editingId}`
        : `/api/admin/models`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      if (result.success) {
        showToast(editingId ? "Đã cập nhật model." : "Đã tạo model mới.", "success");
        setIsModalOpen(false);
        fetchModels();
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
          body: JSON.stringify({ isActive: isActivating })
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Đã ${action.toLowerCase()} model.`, "success");
          fetchModels();
        } else {
          showToast("Có lỗi xảy ra.", "error");
        }
      }
    });
  };

  const filteredModels = models.filter(m => {
    const matchesSearch = m.publicName.toLowerCase().includes(search.toLowerCase()) || 
                          m.upstreamModel.toLowerCase().includes(search.toLowerCase());
    const matchesFamily = filterFamily === "ALL" || m.apiFamily === filterFamily;
    const matchesProvider = filterProvider === "ALL" || m.providerId === filterProvider;
    const matchesActive = filterActive === "ALL" || (filterActive === "ACTIVE" ? m.isActive : !m.isActive);
    
    return matchesSearch && matchesFamily && matchesProvider && matchesActive;
  });

  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);
  const paginatedModels = filteredModels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const families = Array.from(new Set(models.map(m => m.apiFamily)));
  const uniqueProviders = Array.from(new Set(models.map(m => m.providerId))).map(id => {
    const model = models.find(m => m.providerId === id);
    return { id, name: model?.provider?.name || "Unknown" };
  });



  return (
    <div className="space-y-8">
      <PageHeader 
        title="AI Models" 
        description="Quản lý model public, model upstream và mức quy đổi credits."
        icon={<Bot className="h-8 w-8" />}
        actions={
          <div className="flex items-center gap-6">
             <div className="text-right mr-4 hidden md:block">
                <p className={ui.label}>Đang sẵn sàng</p>
                <p className="text-xl font-black text-[#00d4a4]">
                  {models.filter(m => m.isActive).length} / {models.length}
                </p>
             </div>
             <AppButton 
                onClick={() => handleOpenModal()}
                variant="accent"
             >
                <Plus className="h-4 w-4 mr-2" />
                Thêm Model
             </AppButton>
          </div>
        }
      />

      <AppCard className="p-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9690]" />
            <input
              type="text"
              placeholder="Tìm theo tên model hoặc upstream..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={cn(ui.input, "pl-12")}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterFamily}
              onChange={(e) => { setFilterFamily(e.target.value); setCurrentPage(1); }}
              className={ui.input}
            >
              <option value="ALL">Tất cả Family</option>
              {families.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <select 
              value={filterProvider}
              onChange={(e) => { setFilterProvider(e.target.value); setCurrentPage(1); }}
              className={ui.input}
            >
              <option value="ALL">Tất cả Provider</option>
              {uniqueProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select 
              value={filterActive}
              onChange={(e) => { setFilterActive(e.target.value); setCurrentPage(1); }}
              className={ui.input}
            >
              <option value="ALL">Trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
          </div>
        </div>
      </AppCard>

      <AppCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Tên hiển thị</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Dòng AI</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Nhà cung cấp</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Model gốc (Upstream)</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Hệ số Input</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Hệ số Output</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={8} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
                    <p className={cn(ui.label, "animate-pulse")}>Đang tải models...</p>
                  </div>
                </td></tr>
              ) : paginatedModels.length === 0 ? (
                <tr><td colSpan={8} className="py-24 text-center text-[#8a9690] font-bold italic">Không có AI model nào phù hợp.</td></tr>
              ) : (
                paginatedModels.map((model) => (
                  <tr key={model.id} className={`group transition-colors ${!model.isActive ? "bg-[#fbfbf8] grayscale opacity-75" : "hover:bg-[#fbfbf8]"}`}>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fbfbf8] text-[#8a9690] group-hover:bg-white group-hover:text-[#00d4a4] transition-all shadow-sm ring-1 ring-[#edf1ee]">
                             <Bot className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-black text-[#0b0f0d] group-hover:text-[#00d4a4] transition-colors whitespace-nowrap">{model.publicName}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <StatusBadge 
                         status={model.apiFamily} 
                         variant={model.apiFamily === 'CODEXAI' ? 'success' : model.apiFamily === 'CLAUDE' ? 'warning' : model.apiFamily === 'GEMINI' ? 'info' : 'neutral'} 
                       />
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <Server className="h-3.5 w-3.5 text-[#dfe5e1]" />
                          <span className="text-sm font-bold text-[#47524d]">{model.provider?.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <code className="text-[10px] font-mono font-bold text-[#8a9690] bg-[#fbfbf8] px-2 py-1 rounded-md border border-[#edf1ee]">
                          {model.upstreamModel}
                       </code>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="inline-flex items-center gap-1 text-[#00d4a4] font-black">
                          <ArrowDownLeft className="h-3 w-3" />
                          <span className="text-sm">{model.inputCreditRate}x</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="inline-flex items-center gap-1 text-blue-600 font-black">
                          <ArrowUpRight className="h-3 w-3" />
                          <span className="text-sm">{model.outputCreditRate}x</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex justify-center">
                          <Switch 
                            checked={model.isActive}
                            onCheckedChange={() => handleToggleActive(model)}
                            className="data-[state=checked]:bg-[#00d4a4]"
                          />
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                        <div className="flex justify-center gap-2.5">
                          <button
                             type="button"
                             onClick={() => handleOpenModal(model)}
                             title="Sửa model"
                             aria-label="Sửa model"
                             className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-150 ease-out hover:bg-slate-50 hover:text-slate-950 hover:shadow-md active:scale-95"
                          >
                             <Pencil className="h-4 w-4 shrink-0 text-slate-700" />
                          </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#edf1ee] bg-[#fbfbf8] px-8 py-4">
            <div className={ui.pMuted}>
              Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} đến {Math.min(currentPage * ITEMS_PER_PAGE, filteredModels.length)} trong {filteredModels.length} models
            </div>
            <div className="flex items-center gap-2">
              <AppButton
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Trước
              </AppButton>
              <div className="px-4 text-sm font-black text-[#0b0f0d]">
                {currentPage} / {totalPages}
              </div>
              <AppButton
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                Sau
              </AppButton>
            </div>
          </div>
        )}
      </AppCard>

      <Modal 
        open={isModalOpen}
        title={editingId ? "Cập nhật AI Model" : "Thêm AI Model mới"} 
        onClose={() => setIsModalOpen(false)}
        maxWidthClassName="max-w-2xl"
      >
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={ui.label}>Tên hiển thị (Public Name)</label>
                  <input
                    type="text"
                    required
                    value={formData.publicName}
                    onChange={e => setFormData({...formData, publicName: e.target.value})}
                    placeholder="Ví dụ: Claude 3.5 Sonnet"
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Dòng AI (API Family)</label>
                  <select
                    value={formData.apiFamily}
                    onChange={e => setFormData({...formData, apiFamily: e.target.value})}
                    className={ui.input}
                  >
                    <option value="CODEXAI">CodeX AI</option>
                    <option value="CLAUDE">Claude</option>
                    <option value="GEMINI">Gemini</option>
                    <option value="DEEPSEEK">DeepSeek</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={ui.label}>Nhà cung cấp (Provider)</label>
                  <select
                    required
                    value={formData.providerId}
                    onChange={e => setFormData({...formData, providerId: e.target.value})}
                    className={ui.input}
                  >
                    <option value="" disabled>Chọn Provider</option>
                    {providersList
                      .filter(p => p.apiFamily === formData.apiFamily)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    {providersList.filter(p => p.apiFamily === formData.apiFamily).length === 0 && (
                      <option value="" disabled>Không có provider cho family này</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Model gốc (Upstream Model)</label>
                  <input
                    type="text"
                    required
                    value={formData.upstreamModel}
                    onChange={e => setFormData({...formData, upstreamModel: e.target.value})}
                    placeholder="Ví dụ: claude-3-5-sonnet-20240620"
                    className={ui.input}
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={cn(ui.label, "flex items-center gap-2")}>
                     Hệ số Input (Input Rate) <ArrowDownLeft className="h-3 w-3 text-[#00d4a4]" />
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    min="0"
                    value={formData.inputCreditRate}
                    onChange={e => setFormData({...formData, inputCreditRate: e.target.value})}
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn(ui.label, "flex items-center gap-2")}>
                     Hệ số Output (Output Rate) <ArrowUpRight className="h-3 w-3 text-blue-500" />
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    min="0"
                    value={formData.outputCreditRate}
                    onChange={e => setFormData({...formData, outputCreditRate: e.target.value})}
                    className={ui.input}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={ui.label}>Kiểu Upstream Endpoint</label>
                <select
                  value={formData.upstreamEndpointType}
                  onChange={e => setFormData({...formData, upstreamEndpointType: e.target.value})}
                  className={ui.input}
                >
                  <option value="CHAT_COMPLETIONS">Chat Completions (/v1/chat/completions)</option>
                  <option value="RESPONSES">Responses API (/v1/responses)</option>
                </select>
                <p className="text-[10px] text-slate-500 font-medium px-1">
                  Chọn &quot;Responses API&quot; cho các model đặc thù như GPT-5.5 Pro yêu cầu cấu trúc input/output khác với OpenAI chuẩn.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-2xl border border-[#edf1ee] bg-[#fbfbf8]">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="h-5 w-5 rounded-lg border-[#dfe5e1] text-[#00d4a4] focus:ring-[#00d4a4]"
                  />
                  <span className={cn(ui.label, "lowercase first-letter:uppercase")}>Sẵn sàng phục vụ (Active Status)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#edf1ee]">
                <AppButton
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="secondary"
                >
                  Hủy
                </AppButton>
                <AppButton
                  type="submit"
                  variant="accent"
                  className="px-10"
                >
                  {editingId ? "Cập nhật thay đổi" : "Lưu AI Model"}
                </AppButton>
              </div>
            </form>
        </Modal>

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
