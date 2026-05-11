"use client";

import { useEffect, useState } from "react";
import { 
  Bot,
  Search,
  Plus,
  Edit,
  Power,
  PowerOff,
  Boxes,
  Server,
  Zap,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  Database,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
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
    isActive: true,
  });

  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/models");
      const result = await res.json();
      if (result.success) setModels(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/providers");
      const result = await res.json();
      if (result.success) setProvidersList(result.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchProviders();
  }, []);

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
    } catch (error) {
      showToast("Lỗi hệ thống.", "error");
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

  const getFamilyBadge = (family: string) => {
    switch (family) {
      case "CODEXAI": return "bg-emerald-50 text-emerald-600 ring-emerald-500/10";
      case "CLAUDE": return "bg-amber-50 text-amber-600 ring-amber-500/10";
      case "GEMINI": return "bg-sky-50 text-sky-600 ring-sky-500/10";
      case "DEEPSEEK": return "bg-blue-50 text-blue-600 ring-blue-500/10";
      default: return "bg-slate-50 text-slate-600 ring-slate-500/10";
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
              <Bot className="h-8 w-8" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Models</h1>
              <p className="text-slate-500 font-bold mt-1">Quản lý model public, model upstream và mức quy đổi credits.</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right mr-4 hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang sẵn sàng</p>
              <p className="text-xl font-black text-emerald-600">
                {models.filter(m => m.isActive).length} / {models.length}
              </p>
           </div>
           <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-black text-white hover:bg-black transition-all shadow-lg shadow-slate-200"
           >
              <Plus className="h-4 w-4" />
              Thêm Model
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên model hoặc upstream..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterFamily}
              onChange={(e) => { setFilterFamily(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả Family</option>
              {families.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <select 
              value={filterProvider}
              onChange={(e) => { setFilterProvider(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả Provider</option>
              {uniqueProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select 
              value={filterActive}
              onChange={(e) => { setFilterActive(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Tên hiển thị</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Dòng AI</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Nhà cung cấp</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Model gốc (Upstream)</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Hệ số Input</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Hệ số Output</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={8} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                    <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải models...</p>
                  </div>
                </td></tr>
              ) : paginatedModels.length === 0 ? (
                <tr><td colSpan={8} className="py-24 text-center text-slate-400 font-bold italic">Không có AI model nào phù hợp.</td></tr>
              ) : (
                paginatedModels.map((model) => (
                  <tr key={model.id} className={`group transition-colors ${!model.isActive ? "bg-slate-50/50 grayscale opacity-75" : "hover:bg-slate-50/30"}`}>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-emerald-600 transition-all shadow-sm ring-1 ring-slate-200">
                             <Bot className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors whitespace-nowrap">{model.publicName}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ring-1 ring-inset ${getFamilyBadge(model.apiFamily)}`}>
                          {model.apiFamily}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <Server className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-sm font-bold text-slate-700">{model.provider?.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <code className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          {model.upstreamModel}
                       </code>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="inline-flex items-center gap-1 text-emerald-600 font-black">
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
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          <Switch 
                            checked={model.isActive}
                            onCheckedChange={() => handleToggleActive(model)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                             onClick={() => handleOpenModal(model)}
                             className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200 transition-all"
                             title="Chỉnh sửa"
                          >
                             <Edit className="h-4 w-4" />
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
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-4">
            <div className="text-sm font-bold text-slate-500">
              Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} đến {Math.min(currentPage * ITEMS_PER_PAGE, filteredModels.length)} trong {filteredModels.length} models
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all"
              >
                Trước
              </button>
              <div className="px-4 text-sm font-black text-slate-900">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Redesign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] bg-white p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <div className="flex items-center gap-4 mb-8">
               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Bot className="h-6 w-6" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingId ? "Cập nhật AI Model" : "Thêm AI Model mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tên hiển thị (Public Name)</label>
                  <input
                    type="text"
                    required
                    value={formData.publicName}
                    onChange={e => setFormData({...formData, publicName: e.target.value})}
                    placeholder="Ví dụ: Claude 3.5 Sonnet"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dòng AI (API Family)</label>
                  <select
                    value={formData.apiFamily}
                    onChange={e => setFormData({...formData, apiFamily: e.target.value})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
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
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nhà cung cấp (Provider)</label>
                  <select
                    required
                    value={formData.providerId}
                    onChange={e => setFormData({...formData, providerId: e.target.value})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
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
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Model gốc (Upstream Model)</label>
                  <input
                    type="text"
                    required
                    value={formData.upstreamModel}
                    onChange={e => setFormData({...formData, upstreamModel: e.target.value})}
                    placeholder="Ví dụ: claude-3-5-sonnet-20240620"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     Hệ số Input (Input Rate) <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    min="0"
                    value={formData.inputCreditRate}
                    onChange={e => setFormData({...formData, inputCreditRate: e.target.value})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     Hệ số Output (Output Rate) <ArrowUpRight className="h-3 w-3 text-blue-500" />
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    min="0"
                    value={formData.outputCreditRate}
                    onChange={e => setFormData({...formData, outputCreditRate: e.target.value})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition-colors">Sẵn sàng phục vụ (Active Status)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl px-8 py-3.5 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-10 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95"
                >
                  {editingId ? "Cập nhật thay đổi" : "Lưu AI Model"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
