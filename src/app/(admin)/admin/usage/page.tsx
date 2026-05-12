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
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
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
    return (
      <StatusBadge 
        status={status === "SUCCESS" ? "Success" : "Failed"}
        variant={status === "SUCCESS" ? "success" : "danger"}
      />
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Lịch sử hệ thống" 
        description="Giám sát lưu lượng API, tiêu thụ tài nguyên và hiệu năng các Model."
        icon={<Activity className="h-8 w-8" />}
        actions={
          <AppButton 
            onClick={() => { setPage(1); fetchUsage(); }}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> 
            Làm mới
          </AppButton>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng Request", val: stats?.totalRequests || 0, icon: Activity, bg: "bg-[#f4f7ff]", color: "text-[#4d73ff]" },
          { label: "Thành công / Lỗi", val: `${stats?.successCount || 0} / ${stats?.failedCount || 0}`, icon: CheckCircle2, bg: "bg-[#e7fff7]", color: "text-[#00d4a4]" },
          { label: "Credits tiêu thụ", val: Math.abs(Number(stats?.totalCredits || 0)).toLocaleString(), icon: Zap, bg: "bg-[#fff9e7]", color: "text-[#ffb800]" },
          { label: "Tổng Tokens", val: (stats?.totalTokens || 0).toLocaleString(), icon: Cpu, bg: "bg-[#f9f4ff]", color: "text-[#9d4dff]" },
        ].map((s, i) => (
          <AppCard key={i} className="p-7">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4", s.bg, s.color)}>
              <s.icon className="h-6 w-6" />
            </div>
            <p className={ui.label}>{s.label}</p>
            <h3 className="text-2xl font-black text-[#0b0f0d] mt-1">{s.val}</h3>
          </AppCard>
        ))}
      </div>

      {stats?.topModels && stats.topModels.length > 0 && (
        <div className="bg-[#0b0f0d] rounded-[40px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl">
           <div className="absolute top-0 right-0 p-12 opacity-10">
              <Terminal className="h-32 w-32" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Model được dùng nhiều nhất</p>
              <h2 className="text-3xl font-black tracking-tight text-[#00d4a4]">{stats.topModels[0].model}</h2>
              <p className="text-white/60 font-bold mt-1">Với {stats.topModels[0].count.toLocaleString()} requests được thực hiện.</p>
           </div>
           <div className="flex flex-wrap gap-3 relative z-10">
              {stats.topModels.slice(1, 4).map((m, i) => (
                <div key={i} className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white/80">
                   {m.model} ({m.count})
                </div>
              ))}
           </div>
        </div>
      )}

      <AppCard className="p-8">
        <form onSubmit={handleSearch} className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
           <div className="space-y-2">
              <label className={ui.label}>Email người dùng</label>
              <input 
                type="text"
                placeholder="Nhập email..."
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className={ui.input}
              />
           </div>
           <div className="space-y-2">
              <label className={ui.label}>Tên API Key</label>
              <input 
                type="text"
                placeholder="Nhập API Key..."
                value={filterApiKey}
                onChange={(e) => setFilterApiKey(e.target.value)}
                className={ui.input}
              />
           </div>
           <div className="space-y-2">
              <label className={ui.label}>Model / Status</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Model..."
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className={ui.input}
                />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={ui.input}
                >
                  <option value="ALL">ALL</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
           </div>
           <div className="space-y-2">
              <label className={ui.label}>Thời gian</label>
              <select 
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
                className={ui.input}
              >
                <option value="all">Toàn thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
              </select>
           </div>
           <div className="flex items-end">
              <AppButton 
                type="submit"
                className="w-full h-[50px]"
                variant="accent"
              >
                <Search className="h-4 w-4 mr-2" /> Tìm kiếm
              </AppButton>
           </div>
        </form>
      </AppCard>

      <AppCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Thời gian</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Khách hàng</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Model / Family</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Tokens (P/C/T)</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Credits</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
                    <p className={cn(ui.label, "animate-pulse")}>Đang tải lịch sử...</p>
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center text-[#8a9690] font-bold italic">Chưa có dữ liệu sử dụng hệ thống.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-[#fbfbf8] transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="text-[12px] font-black text-[#0b0f0d]">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</span>
                          <span className={cn(ui.pMuted, "text-[10px]")}>{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: vi })}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div>
                             <p className="text-[13px] font-black text-[#0b0f0d] leading-tight">{log.user.name}</p>
                             <p className={cn(ui.pMuted, "text-[10px] truncate max-w-[150px]")}>{log.user.email}</p>
                             <div className="flex items-center gap-1 mt-1 opacity-60">
                                <Key className="h-3 w-3 text-[#8a9690]" />
                                <p className="text-[9px] font-black text-[#8a9690] uppercase tracking-tight">{log.apiKey.name} ({log.apiKey.keyPrefix})</p>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div>
                          <p className="text-sm font-black text-[#0b0f0d] group-hover:text-[#00d4a4] transition-colors">{log.model}</p>
                          <span className="inline-flex mt-1 rounded-md bg-[#fbfbf8] px-2 py-0.5 text-[9px] font-black text-[#8a9690] tracking-widest uppercase border border-[#edf1ee]">
                             {log.apiFamily}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-[#0b0f0d]">{log.totalTokens.toLocaleString()}</span>
                          <span className={cn(ui.pMuted, "text-[9px]")}>
                             {log.inputTokens} / {log.outputTokens}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-[#00d4a4]">
                             {Math.abs(Number(log.creditsCharged)).toLocaleString()}
                          </span>
                          <span className={cn(ui.pMuted, "text-[9px]")}>CREDITS</span>
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
          <div className="px-8 py-6 bg-[#fbfbf8] border-t border-[#edf1ee] flex items-center justify-between">
             <p className="text-xs font-bold text-[#8a9690]">
                Hiển thị <span className="font-black text-[#0b0f0d]">{logs.length}</span> trên <span className="font-black text-[#0b0f0d]">{pagination.totalCount}</span> kết quả
             </p>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <label className={ui.label}>Hiển thị</label>
                   <select 
                     value={pageSize}
                     onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                     className={cn(ui.input, "px-2 py-1")}
                   >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                   </select>
                </div>
                <div className="flex items-center gap-2">
                   <AppButton 
                     onClick={() => setPage(p => Math.max(1, p - 1))}
                     disabled={page === 1 || isLoading}
                     variant="secondary"
                     size="sm"
                   >
                     Trước
                   </AppButton>
                   <div className="h-9 px-4 flex items-center justify-center rounded-xl bg-[#0b0f0d] text-white text-xs font-black shadow-lg">
                      {page} / {pagination.totalPages}
                   </div>
                   <AppButton 
                     onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                     disabled={page === pagination.totalPages || isLoading}
                     variant="secondary"
                     size="sm"
                   >
                     Sau
                   </AppButton>
                </div>
             </div>
          </div>
        )}
      </AppCard>
    </div>
  );
}
