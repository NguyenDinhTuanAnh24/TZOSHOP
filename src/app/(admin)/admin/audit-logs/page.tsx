"use client";

import { useEffect, useState } from "react";
import { 
  ScrollText, 
  Search, 
  RefreshCw, 
  User, 
  Clock, 
  Database, 
  Tag,
  ChevronRight,
  ShieldCheck,
  Filter,
  Eye,
  X,
  Copy,
  Check,
  Code,
  Layers,
  Zap,
  Calendar,
  Settings
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type AuditLog = {
  id: string;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  adminUser: {
    name: string | null;
    email: string;
  };
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("ALL");
  const [filterAction, setFilterAction] = useState("ALL");
  
  // Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/audit-logs");
      const result = await res.json();
      if (result.success) {
        setLogs(result.data);
      } else {
        showToast(result.message || "Lỗi khi tải dữ liệu", "error");
      }
    } catch (error) {
      showToast("Lỗi hệ thống", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const entityTypes = Array.from(new Set(logs.map(l => l.entityType)));
  const actions = Array.from(new Set(logs.map(l => l.action)));

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.adminUser.email.toLowerCase().includes(search.toLowerCase()) ||
                          (log.adminUser.name && log.adminUser.name.toLowerCase().includes(search.toLowerCase())) ||
                          log.entityId.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = filterEntity === "ALL" || log.entityType === filterEntity;
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    
    return matchesSearch && matchesEntity && matchesAction;
  });

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Audit Logs" 
        description="Theo dõi các thao tác quan trọng trong khu vực quản trị."
        icon={<ScrollText className="h-8 w-8" />}
        actions={
          <div className="flex items-center gap-3">
             <IconButton 
                onClick={fetchLogs}
                isLoading={isLoading}
                variant="outline"
                title="Làm mới"
             >
                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
             </IconButton>
             <div className="flex items-center gap-1.5 rounded-full bg-[#fbfbf8] px-4 py-2 text-[10px] font-black text-[#8a9690] ring-1 ring-[#edf1ee]">
                <ShieldCheck className="h-4 w-4 text-[#00d4a4]" />
                SECURE LOGGING
             </div>
          </div>
        }
      />

      <AppCard className="p-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9690]" />
            <input
              type="text"
              placeholder="Tìm theo admin, hành động, ID thực thể..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(ui.input, "pl-12")}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className={ui.input}
            >
              <option value="ALL">Tất cả thực thể</option>
              {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className={ui.input}
            >
              <option value="ALL">Tất cả hành động</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </AppCard>

      <AppCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Thời gian</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Quản trị viên</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Hành động</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Thực thể</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Mã thực thể</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
                    <p className={cn(ui.label, "animate-pulse")}>Đang tải nhật ký...</p>
                  </div>
                </td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center text-[#8a9690] font-bold italic">Chưa có bản ghi nhật ký nào phù hợp.</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-[#fbfbf8] transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="text-base font-black text-[#0b0f0d]">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</span>
                          <span className={cn(ui.pMuted, "text-[10px]")}>
                             {format(new Date(log.createdAt), "dd MMM, yyyy", { locale: vi })}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fbfbf8] text-[#8a9690] group-hover:bg-white group-hover:text-[#00d4a4] transition-all shadow-sm ring-1 ring-[#edf1ee]">
                             <User className="h-4 w-4" />
                          </div>
                          <div>
                             <p className="text-base font-black text-[#0b0f0d] leading-tight">{log.adminUser.name || "Administrator"}</p>
                             <p className={cn(ui.pMuted, "text-xs")}>{log.adminUser.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                        <div className="flex justify-center">
                           <StatusBadge 
                             status={log.action}
                             variant={
                               log.action.includes("CREATE") ? "success" :
                               log.action.includes("UPDATE") ? "warning" :
                               log.action.includes("DELETE") || log.action.includes("DISABLE") ? "danger" :
                               log.action.includes("LOGIN") || log.action.includes("VIEW") ? "info" :
                               "neutral"
                             }
                           />
                        </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-[#dfe5e1]" />
                          <span className={cn(ui.label, "tracking-widest")}>{log.entityType}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <code className="text-[12px] font-mono font-bold text-[#8a9690] bg-[#fbfbf8] px-3 py-1.5 rounded-md border border-[#edf1ee] group-hover:bg-white transition-all inline-block">
                          {log.entityId}
                       </code>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <AppButton 
                          onClick={() => setSelectedLog(log)}
                          variant="accent"
                          size="sm"
                       >
                          <Eye className="h-4 w-4 mr-2" /> Chi tiết
                       </AppButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>

      {selectedLog && (
        <Modal 
          open={!!selectedLog}
          title="Chi tiết dữ liệu" 
          onClose={() => setSelectedLog(null)}
          maxWidthClassName="max-w-3xl"
        >
            <div className="p-8 space-y-6">
               <div className="flex flex-wrap gap-2 mb-4">
                  <StatusBadge status={selectedLog.action} variant="neutral" />
                  <StatusBadge status={selectedLog.entityType} variant="info" />
                  <StatusBadge status={selectedLog.entityId} variant="neutral" />
               </div>

               <div className="relative group">
                  <div className="absolute right-4 top-4 z-10">
                     <AppButton 
                        onClick={() => handleCopy(JSON.stringify(selectedLog.metadata, null, 2))}
                        variant="secondary"
                        size="sm"
                        className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                     >
                        {isCopied ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                        {isCopied ? "ĐÃ SAO CHÉP" : "SAO CHÉP JSON"}
                     </AppButton>
                  </div>
                  <pre className="p-8 rounded-[32px] bg-[#0b0f0d] text-[#00d4a4] text-sm font-mono leading-relaxed overflow-x-auto custom-scrollbar shadow-2xl">
                     {selectedLog.metadata ? JSON.stringify(selectedLog.metadata, null, 2) : "// Không có dữ liệu metadata bổ sung"}
                  </pre>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-[#fbfbf8] border border-[#edf1ee]">
                     <div className="flex items-center gap-2 mb-3 text-[#8a9690]">
                        <Clock className="h-3.5 w-3.5" />
                        <span className={ui.label}>Thời gian thực thi</span>
                     </div>
                     <p className="text-sm font-black text-[#0b0f0d]">{format(new Date(selectedLog.createdAt), "HH:mm:ss - dd/MM/yyyy", { locale: vi })}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#fbfbf8] border border-[#edf1ee]">
                     <div className="flex items-center gap-2 mb-3 text-[#8a9690]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className={ui.label}>Người thực hiện</span>
                     </div>
                     <p className="text-sm font-black text-[#0b0f0d]">{selectedLog.adminUser.email}</p>
                  </div>
               </div>

               <div className="flex justify-end pt-4 border-t border-[#edf1ee]">
                  <AppButton 
                     onClick={() => setSelectedLog(null)}
                     variant="accent"
                     className="px-10"
                  >
                     Đóng cửa sổ
                  </AppButton>
               </div>
            </div>
        </Modal>
      )}

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}
