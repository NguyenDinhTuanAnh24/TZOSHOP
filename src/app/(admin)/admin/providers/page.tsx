"use client";

import { useEffect, useState } from "react";
import { 
  Server,
  Search,
  Plus,
  Edit,
  Power,
  PowerOff,
  Key,
  Globe,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  Clock,
  ShieldAlert,
  Terminal,
  Activity,
  Lock,
  ExternalLink
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
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

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
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

  const fetchProviders = async () => {
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
  };

  useEffect(() => {
    fetchProviders();
  }, []);

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
      const url = editingId 
        ? `/api/admin/providers/${editingId}`
        : `/api/admin/providers`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      if (result.success) {
        showToast(editingId ? "Đã cập nhật provider." : "Đã tạo provider mới.", "success");
        setIsModalOpen(false);
        fetchProviders();
      } else {
        showToast(result.error?.message || result.message || "Lỗi khi lưu.", "error");
      }
    } catch (error) {
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
        : "Các model sử dụng provider này sẽ không thể gọi API cho đến khi có provider khác thay thế hoặc được bật lại.",
      confirmLabel: `Xác nhận ${action}`,
      cancelLabel: "Hủy",
      type: isActivating ? "warning" : "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/providers/${provider.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: isActivating })
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Đã ${action.toLowerCase()} provider.`, "success");
          fetchProviders();
        } else {
          showToast("Có lỗi xảy ra.", "error");
        }
      }
    });
  };

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.apiFamily.toLowerCase().includes(search.toLowerCase()) ||
    p.baseUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
              <Server className="h-8 w-8" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Providers</h1>
              <p className="text-slate-500 font-bold mt-1">Quản lý kết nối upstream API dùng cho từng dòng AI.</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right mr-4 hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang kết nối</p>
              <p className="text-xl font-black text-emerald-600">
                {providers.filter(p => p.isActive).length} / {providers.length}
              </p>
           </div>
           <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-black text-white hover:bg-black transition-all shadow-lg shadow-slate-200"
           >
              <Plus className="h-4 w-4" />
              Thêm Provider
           </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 p-4 rounded-3xl">
         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
         </div>
         <p className="text-sm font-bold text-emerald-800">
            API key provider được mã hóa bằng AES-256 và không bao giờ hiển thị công khai trên giao diện người dùng.
         </p>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên provider hoặc API family..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>


      </div>

      {/* Table */}
      <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Tên Provider</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Dòng AI</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Base URL / Endpoint</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">API Key (Đã ẩn)</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Cập nhật</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                    <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải providers...</p>
                  </div>
                </td></tr>
              ) : filteredProviders.length === 0 ? (
                <tr><td colSpan={7} className="py-24 text-center text-slate-400 font-bold italic">Không tìm thấy provider nào.</td></tr>
              ) : (
                filteredProviders.map((provider) => (
                  <tr key={provider.id} className={`group transition-colors ${!provider.isActive ? "bg-slate-50/50 grayscale opacity-75" : "hover:bg-slate-50/30"}`}>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-emerald-600 transition-all shadow-sm ring-1 ring-slate-200">
                             <Zap className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{provider.name}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 tracking-widest uppercase ring-1 ring-inset ring-slate-200">
                          {provider.apiFamily}
                        </span>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                       <div className="flex items-center gap-2 text-slate-500">
                          <Globe className="h-3.5 w-3.5" />
                          <p className="text-sm font-bold truncate">{provider.baseUrl}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-50/50 py-1.5 px-3 rounded-xl border border-slate-100 group-hover:bg-white transition-all">
                          <Lock className="h-3 w-3" />
                          <code className="text-[10px] font-mono tracking-widest">{provider.encryptedApiKey}</code>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <Switch 
                          checked={provider.isActive}
                          onCheckedChange={() => handleToggleActive(provider)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-[12px] font-bold">
                             {format(new Date(provider.updatedAt), "HH:mm dd/MM", { locale: vi })}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                             onClick={() => handleOpenModal(provider)}
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
      </div>

      {/* Modal Redesign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] bg-white p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <div className="flex items-center gap-4 mb-8">
               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Key className="h-6 w-6" />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingId ? "Cập nhật Provider" : "Thêm Provider mới"}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">Cấu hình tham số kết nối API bảo mật.</p>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tên Provider</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ví dụ: OpenAI Production"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dòng AI hỗ trợ</label>
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

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Base URL / Endpoint</label>
                <div className="relative">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <input
                     type="url"
                     required
                     value={formData.baseUrl}
                     onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                     placeholder="https://api.openai.com/v1"
                     className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                   />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1 mb-1">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Provider API Key</label>
                   {editingId && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                         <Lock className="h-2.5 w-2.5" /> ENCRYPTED
                      </span>
                   )}
                </div>
                <div className="relative">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <input
                     type="password"
                     required={!editingId}
                     value={formData.apiKey}
                     onChange={e => setFormData({...formData, apiKey: e.target.value})}
                     placeholder={editingId ? "Bỏ trống nếu muốn giữ API key cũ" : "sk-proj-..."}
                     className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                   />
                </div>
                {editingId && (
                   <p className="text-[11px] font-bold text-slate-400 mt-2 px-1">
                      Để bảo mật, chúng tôi không hiển thị API key hiện tại. Bạn chỉ cần nhập nếu muốn thay đổi key mới.
                   </p>
                )}
              </div>

              <div className="pt-2">
                 <label className="flex items-center gap-3 cursor-pointer group p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 w-full">
                   <input
                     type="checkbox"
                     checked={formData.isActive}
                     onChange={e => setFormData({...formData, isActive: e.target.checked})}
                     className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-600"
                   />
                   <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition-colors">Kích hoạt Provider</span>
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
                  {editingId ? "Cập nhật Provider" : "Xác nhận thêm"}
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
