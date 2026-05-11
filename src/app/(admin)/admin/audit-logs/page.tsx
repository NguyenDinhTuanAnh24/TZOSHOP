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
import { AppIcon } from "@/components/ui/icon";
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
              <ScrollText className="h-8 w-8" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit logs</h1>
              <p className="text-slate-500 font-bold mt-1">Theo dõi các thao tác quan trọng trong khu vực quản trị.</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
              onClick={fetchLogs}
              disabled={isLoading}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
           >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
           </button>
           <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-4 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Secure Logging
           </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo admin, hành động, ID thực thể..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 py-3.5 text-base font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả thực thể</option>
              {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả hành động</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-slate-400">Thời gian</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-slate-400">Quản trị viên</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Hành động</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-slate-400">Thực thể</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Mã thực thể</th>
                <th className="px-8 py-6 text-[13px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                    <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải nhật ký...</p>
                  </div>
                </td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-bold italic">Chưa có bản ghi nhật ký nào phù hợp.</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="text-base font-black text-slate-900">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                             {format(new Date(log.createdAt), "dd MMM, yyyy", { locale: vi })}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-emerald-600 transition-all shadow-sm ring-1 ring-slate-200">
                             <User className="h-4 w-4" />
                          </div>
                          <div>
                             <p className="text-base font-black text-slate-900 leading-tight">{log.adminUser.name || "Administrator"}</p>
                             <p className="text-xs font-bold text-slate-400">{log.adminUser.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                        <div className="flex justify-center">
                           <span className={`inline-flex rounded-lg px-3 py-1.5 text-[12px] font-black tracking-widest uppercase ring-1 ring-inset ${
                             log.action.includes("CREATE") ? "bg-emerald-50 text-emerald-600 ring-emerald-500/10" :
                             log.action.includes("UPDATE") ? "bg-amber-50 text-amber-600 ring-amber-500/10" :
                             log.action.includes("DELETE") || log.action.includes("DISABLE") ? "bg-rose-50 text-rose-600 ring-rose-500/10" :
                             log.action.includes("LOGIN") || log.action.includes("VIEW") ? "bg-blue-50 text-blue-600 ring-blue-500/10" :
                             "bg-slate-100 text-slate-600 ring-slate-200"
                           }`}>
                             {log.action}
                           </span>
                        </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-slate-300" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{log.entityType}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <code className="text-[12px] font-mono font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 group-hover:bg-white transition-all inline-block">
                          {log.entityId}
                       </code>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-black text-white hover:bg-black transition-all shadow-lg shadow-slate-200"
                       >
                          <Eye className="h-4 w-4" /> Chi tiết
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
         <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[40px] bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
               {/* Modal Header */}
               <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                        <Code className="h-6 w-6" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chi tiết dữ liệu</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                           {selectedLog.action} • {selectedLog.entityType} • {selectedLog.entityId}
                        </p>
                     </div>
                  </div>
                  <button 
                     onClick={() => setSelectedLog(null)}
                     className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all"
                  >
                     <X className="h-5 w-5" />
                  </button>
               </div>

               {/* Modal Content */}
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
                  <div className="relative group">
                     <div className="absolute right-4 top-4 z-10">
                        <button 
                           onClick={() => handleCopy(JSON.stringify(selectedLog.metadata, null, 2))}
                           className="flex h-10 px-4 items-center gap-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-600 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm"
                        >
                           {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                           {isCopied ? "ĐÃ SAO CHÉP" : "SAO CHÉP JSON"}
                        </button>
                     </div>
                     <pre className="p-8 rounded-[32px] bg-slate-900 text-emerald-400 text-sm font-mono leading-relaxed overflow-x-auto custom-scrollbar shadow-2xl ring-8 ring-slate-100">
                        {selectedLog.metadata ? JSON.stringify(selectedLog.metadata, null, 2) : "// Không có dữ liệu metadata bổ sung"}
                     </pre>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-6">
                     <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-slate-400">
                           <Clock className="h-3.5 w-3.5" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Thời gian thực thi</span>
                        </div>
                        <p className="text-sm font-black text-slate-900">{format(new Date(selectedLog.createdAt), "HH:mm:ss - dd/MM/yyyy", { locale: vi })}</p>
                     </div>
                     <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-slate-400">
                           <ShieldCheck className="h-3.5 w-3.5" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Người thực hiện</span>
                        </div>
                        <p className="text-sm font-black text-slate-900">{selectedLog.adminUser.email}</p>
                     </div>
                  </div>
               </div>

               {/* Modal Footer */}
               <div className="p-8 border-t border-slate-100 flex justify-end shrink-0">
                  <button 
                     onClick={() => setSelectedLog(null)}
                     className="px-8 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
                  >
                     Đóng cửa sổ
                  </button>
               </div>
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
    </div>
  );
}
