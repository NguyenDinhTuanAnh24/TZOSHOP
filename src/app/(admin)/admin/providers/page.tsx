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
      <PageHeader 
        title="Providers" 
        description="Quản lý kết nối upstream API dùng cho từng dòng AI."
        icon={<Server className="h-8 w-8" />}
        actions={
          <div className="flex items-center gap-6">
             <div className="text-right mr-4 hidden md:block">
                <p className={ui.label}>Đang kết nối</p>
                <p className="text-xl font-black text-[#00d4a4]">
                  {providers.filter(p => p.isActive).length} / {providers.length}
                </p>
             </div>
             <AppButton 
                onClick={() => handleOpenModal()}
                variant="accent"
             >
                <Plus className="h-4 w-4 mr-2" />
                Thêm Provider
             </AppButton>
          </div>
        }
      />

      <div className="flex items-center gap-4 bg-[#e7fff7] border border-[#00d4a4]/20 p-4 rounded-3xl">
         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#00d4a4] shadow-sm">
            <ShieldCheck className="h-5 w-5" />
         </div>
         <p className={cn(ui.label, "lowercase first-letter:uppercase text-[#0b0f0d]")}>
            API key provider được mã hóa bằng AES-256 và không bao giờ hiển thị công khai trên giao diện người dùng.
         </p>
      </div>

      <AppCard className="p-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9690]" />
          <input
            type="text"
            placeholder="Tìm theo tên provider hoặc API family..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(ui.input, "pl-12")}
          />
        </div>
      </AppCard>

      <AppCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Tên Provider</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Dòng AI</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Base URL / Endpoint</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">API Key (Đã ẩn)</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Cập nhật</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
                    <p className={cn(ui.label, "animate-pulse")}>Đang tải providers...</p>
                  </div>
                </td></tr>
              ) : filteredProviders.length === 0 ? (
                <tr><td colSpan={7} className="py-24 text-center text-[#8a9690] font-bold italic">Không tìm thấy provider nào.</td></tr>
              ) : (
                filteredProviders.map((provider) => (
                  <tr key={provider.id} className={`group transition-colors ${!provider.isActive ? "bg-[#fbfbf8] grayscale opacity-75" : "hover:bg-[#fbfbf8]"}`}>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fbfbf8] text-[#8a9690] group-hover:bg-white group-hover:text-[#00d4a4] transition-all shadow-sm ring-1 ring-[#edf1ee]">
                             <Zap className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-black text-[#0b0f0d] group-hover:text-[#00d4a4] transition-colors">{provider.name}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <StatusBadge 
                         status={provider.apiFamily} 
                         variant={provider.apiFamily === 'CODEXAI' ? 'success' : provider.apiFamily === 'CLAUDE' ? 'warning' : provider.apiFamily === 'GEMINI' ? 'info' : 'neutral'} 
                       />
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                       <div className="flex items-center gap-2 text-[#8a9690]">
                          <Globe className="h-3.5 w-3.5" />
                          <p className="text-sm font-bold truncate">{provider.baseUrl}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex items-center justify-center gap-2 text-[#8a9690] bg-[#fbfbf8] py-1.5 px-3 rounded-xl border border-[#edf1ee] group-hover:bg-white transition-all">
                          <Lock className="h-3 w-3" />
                          <code className="text-[10px] font-mono tracking-widest">{provider.encryptedApiKey}</code>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center">
                        <Switch 
                          checked={provider.isActive}
                          onCheckedChange={() => handleToggleActive(provider)}
                          className="data-[state=checked]:bg-[#00d4a4]"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-[#8a9690]">
                          <Clock className="h-3.5 w-3.5" />
                          <span className={cn(ui.pMuted, "text-[12px]")}>
                             {format(new Date(provider.updatedAt), "HH:mm dd/MM", { locale: vi })}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <AppButton 
                             onClick={() => handleOpenModal(provider)}
                             variant="accent"
                             size="sm"
                             className="h-10 w-10 p-0"
                             title="Chỉnh sửa"
                          >
                             <Edit className="h-4 w-4" />
                          </AppButton>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>

      <Modal 
        open={isModalOpen}
        title={editingId ? "Cập nhật Provider" : "Thêm Provider mới"} 
        onClose={() => setIsModalOpen(false)}
        maxWidthClassName="max-w-2xl"
      >
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={ui.label}>Tên Provider</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ví dụ: OpenAI Production"
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Dòng AI hỗ trợ</label>
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

              <div className="space-y-2">
                <label className={ui.label}>Base URL / Endpoint</label>
                <div className="relative">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9690]" />
                   <input
                     type="url"
                     required
                     value={formData.baseUrl}
                     onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                     placeholder="https://api.openai.com/v1"
                     className={cn(ui.input, "pl-11")}
                   />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1 mb-1">
                   <label className={ui.label}>Provider API Key</label>
                   {editingId && (
                      <StatusBadge status="ENCRYPTED" variant="success" />
                   )}
                </div>
                <div className="relative">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9690]" />
                   <input
                     type="password"
                     required={!editingId}
                     value={formData.apiKey}
                     onChange={e => setFormData({...formData, apiKey: e.target.value})}
                     placeholder={editingId ? "Bỏ trống nếu muốn giữ API key cũ" : "sk-proj-..."}
                     className={cn(ui.input, "pl-11")}
                   />
                </div>
                {editingId && (
                   <p className={cn(ui.pMuted, "mt-2 px-1")}>
                      Để bảo mật, chúng tôi không hiển thị API key hiện tại. Bạn chỉ cần nhập nếu muốn thay đổi key mới.
                   </p>
                )}
              </div>

              <div className="pt-2">
                 <label className="flex items-center gap-3 cursor-pointer group p-3.5 rounded-2xl border border-[#edf1ee] bg-[#fbfbf8] w-full">
                   <input
                     type="checkbox"
                     checked={formData.isActive}
                     onChange={e => setFormData({...formData, isActive: e.target.checked})}
                     className="h-5 w-5 rounded-lg border-[#dfe5e1] text-[#00d4a4] focus:ring-[#00d4a4]"
                   />
                   <span className={cn(ui.label, "lowercase first-letter:uppercase")}>Kích hoạt Provider</span>
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
                  {editingId ? "Cập nhật Provider" : "Xác nhận thêm"}
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
