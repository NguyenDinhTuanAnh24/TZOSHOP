"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  Search, 
  Filter, 
  Cpu, 
  User, 
  Key, 
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Terminal
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type UsageLog = {
  id: string;
  apiFamily: string;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditsCharged: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  apiKey: {
    name: string;
    keyPrefix: string;
  };
};

type UsageStats = {
  totalRequests: number;
  successCount: number;
  failedCount: number;
  totalCredits: string;
  totalTokens: number;
  topModels: { model: string, count: number }[];
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export default function AdminUsagePage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterEmail, setFilterEmail] = useState("");
  const [filterApiKey, setFilterApiKey] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterTimeRange, setFilterTimeRange] = useState("all");

  const fetchUsage = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        timeRange: filterTimeRange
      });
      if (filterEmail) params.append("email", filterEmail);
      if (filterApiKey) params.append("apiKey", filterApiKey);
      if (filterModel) params.append("model", filterModel);
      if (filterStatus !== "ALL") params.append("status", filterStatus);

      const res = await fetch(`/api/admin/usage?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setLogs(result.data);
        setStats(result.stats);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [page, pageSize, filterStatus, filterTimeRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsage();
  };

  const getStatusBadge = (status: string) => {
    if (status === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 ring-1 ring-emerald-500/10">
          <CheckCircle2 className="h-3 w-3" /> Success
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600 ring-1 ring-rose-500/10">
        <XCircle className="h-3 w-3" /> Failed
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
              <Activity className="h-8 w-8" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lịch sử hệ thống</h1>
              <p className="text-slate-500 font-bold mt-1">Giám sát lưu lượng API, tiêu thụ tài nguyên và hiệu năng các Model.</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
              onClick={() => { setPage(1); fetchUsage(); }}
              disabled={isLoading}
              className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:text-emerald-600 transition-all active:scale-95 shadow-sm disabled:opacity-50"
           >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
              Làm mới
           </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng Request", val: stats?.totalRequests || 0, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Thành công / Lỗi", val: `${stats?.successCount || 0} / ${stats?.failedCount || 0}`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Credits tiêu thụ", val: Math.abs(Number(stats?.totalCredits || 0)).toLocaleString(), icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Tổng Tokens", val: (stats?.totalTokens || 0).toLocaleString(), icon: Cpu, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm">
            <div className={`h-12 w-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4`}>
              <AppIcon icon={s.icon} className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Top Model Banner */}
      {stats?.topModels && stats.topModels.length > 0 && (
        <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-12 opacity-10">
              <Terminal className="h-32 w-32" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Model được dùng nhiều nhất</p>
              <h2 className="text-3xl font-black tracking-tight">{stats.topModels[0].model}</h2>
              <p className="text-slate-400 font-bold mt-1">Với {stats.topModels[0].count.toLocaleString()} requests được thực hiện.</p>
           </div>
           <div className="flex flex-wrap gap-3">
              {stats.topModels.slice(1, 4).map((m, i) => (
                <div key={i} className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-xs font-bold">
                   {m.model} ({m.count})
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email người dùng</label>
              <input 
                type="text"
                placeholder="Nhập email..."
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên API Key</label>
              <input 
                type="text"
                placeholder="Nhập API Key..."
                value={filterApiKey}
                onChange={(e) => setFilterApiKey(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Model / Status</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Model..."
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="ALL">ALL</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Thời gian</label>
              <select 
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="all">Toàn thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
              </select>
           </div>
           <div className="flex items-end">
              <button 
                type="submit"
                className="w-full h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                <Search className="h-4 w-4" /> Tìm kiếm
              </button>
           </div>
        </form>
      </div>

      {/* Usage Table */}
      <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Thời gian</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Khách hàng</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Model / Family</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Tokens (P/C/T)</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Credits</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                    <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải lịch sử...</p>
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-bold italic">Chưa có dữ liệu sử dụng hệ thống.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="text-[12px] font-black text-slate-900">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: vi })}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div>
                             <p className="text-[13px] font-black text-slate-900 leading-tight">{log.user.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{log.user.email}</p>
                             <div className="flex items-center gap-1 mt-1 opacity-60">
                                <Key className="h-3 w-3 text-slate-400" />
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{log.apiKey.name} ({log.apiKey.keyPrefix})</p>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{log.model}</p>
                          <span className="inline-flex mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-600 tracking-widest uppercase">
                             {log.apiFamily}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-900">{log.totalTokens.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                             {log.inputTokens} / {log.outputTokens}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-emerald-600">
                             {Math.abs(Number(log.creditsCharged)).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CREDITS</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(log.status)}
                          {log.errorMessage && (
                            <p className="text-[10px] font-bold text-rose-400 truncate max-w-[150px]" title={log.errorMessage}>
                               {log.errorMessage}
                            </p>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
             <p className="text-xs font-bold text-slate-500">
                Hiển thị <span className="font-black text-slate-900">{logs.length}</span> trên <span className="font-black text-slate-900">{pagination.totalCount}</span> kết quả
             </p>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Hiển thị</label>
                   <select 
                     value={pageSize}
                     onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                     className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black outline-none"
                   >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                   </select>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1 || isLoading}
                     className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-black hover:bg-slate-50 disabled:opacity-50 transition-all"
                   >
                     Trước
                   </button>
                   <div className="h-9 px-4 flex items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-black">
                      {page} / {pagination.totalPages}
                   </div>
                   <button 
                     onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                     disabled={page === pagination.totalPages || isLoading}
                     className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-black hover:bg-slate-50 disabled:opacity-50 transition-all"
                   >
                     Sau
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
