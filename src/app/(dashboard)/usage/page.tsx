"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Zap,
  CheckCircle2,
  XCircle,
  History,
  Search,
  KeyRound,
  Info,
  Filter
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { StatCardsSkeleton, CardListSkeleton } from "@/components/ui/page-skeleton";
import DashboardSubNav from "@/components/dashboard/dashboard-sub-nav";

type ApiFamily = "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";

type ApiKeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
};

type UsageLogItem = {
  id: string;
  apiFamily: ApiFamily;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditsCharged: string;
  status: "SUCCESS" | "FAILED";
  errorCode: string | null;
  errorMessage: string | null;
  httpStatus: number | null;
  creditsUsed: number;
  createdAt: string;
  apiKey: {
    id: string;
    name: string;
    keyPrefix: string;
  } | null;
};

export default function UsagePage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterApiKeyId, setFilterApiKeyId] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { toast, showToast, clearToast } = useToast(3000);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [keysRes, usageRes] = await Promise.all([
        fetch("/api/api-keys", { cache: "no-store" }),
        fetch("/api/usage", { cache: "no-store" }),
      ]);

      const keysData = await keysRes.json();
      const usageData = await usageRes.json();

      if (!keysRes.ok) throw new Error(keysData?.error?.message ?? "Lỗi tải API keys.");
      if (!usageRes.ok) throw new Error(usageData?.error?.message ?? "Lỗi tải lịch sử sử dụng.");

      setApiKeys(keysData.data ?? []);
      setUsageLogs(usageData.data ?? []);
    } catch (error) {
      showToast("Không thể tải dữ liệu sử dụng.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived data
  const models = useMemo(() => {
    const uniqueModels = new Set<string>();
    usageLogs.forEach(log => uniqueModels.add(log.model));
    return Array.from(uniqueModels).sort();
  }, [usageLogs]);

  const filteredLogs = useMemo(() => {
    return usageLogs.filter(log => {
      const matchKey = filterApiKeyId === "all" || log.apiKey?.id === filterApiKeyId;
      const matchModel = filterModel === "all" || log.model === filterModel;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;
      return matchKey && matchModel && matchStatus;
    });
  }, [usageLogs, filterApiKeyId, filterModel, filterStatus]);

  const stats = useMemo(() => {
    const totalCalls = filteredLogs.length;
    const creditsUsed = filteredLogs.reduce((sum, log) => sum + Number(log.creditsCharged), 0);
    const successCalls = filteredLogs.filter((log) => log.status === "SUCCESS").length;
    const failedCalls = filteredLogs.filter((log) => log.status === "FAILED").length;

    return { totalCalls, creditsUsed, successCalls, failedCalls };
  }, [filteredLogs]);

  const btnSecondary = "rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2 text-sm font-bold transition-all flex items-center justify-center gap-2";

  return (
    <div className="space-y-10 pb-20">
      <DashboardSubNav 
        items={[
          { label: "API Keys", href: "/api-keys" },
          { label: "Tài liệu API", href: "/api-docs" },
          { label: "Lịch sử sử dụng", href: "/usage" },
        ]} 
      />
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <AppIcon icon={BarChart3} className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Lịch sử sử dụng</h1>
          <p className="mt-1 text-slate-500 font-medium">
            Theo dõi lượt gọi API, credits đã dùng và trạng thái request.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tổng lượt gọi</p>
              <div className="p-1.5 rounded-lg bg-slate-50">
                <AppIcon icon={BarChart3} className="h-4 w-4 text-slate-400" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.totalCalls.toLocaleString("vi-VN")}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Credits đã dùng</p>
              <div className="p-1.5 rounded-lg bg-emerald-50">
                <AppIcon icon={Zap} className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600">{new Intl.NumberFormat("vi-VN").format(stats.creditsUsed)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Thành công</p>
              <div className="p-1.5 rounded-lg bg-emerald-50">
                <AppIcon icon={CheckCircle2} className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600">{stats.successCalls.toLocaleString("vi-VN")}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Thất bại</p>
              <div className="p-1.5 rounded-lg bg-rose-50">
                <AppIcon icon={XCircle} className="h-4 w-4 text-rose-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-rose-600">{stats.failedCalls.toLocaleString("vi-VN")}</p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        <div className="space-y-8">

          {/* Filter Bar */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <AppIcon icon={Filter} className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900">Bộ lọc lịch sử</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">API Key</label>
                <select
                  value={filterApiKeyId}
                  onChange={(e) => setFilterApiKeyId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_1rem_center] bg-no-repeat"
                >
                  <option value="all">Tất cả key</option>
                  {apiKeys.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Model</label>
                <select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_1rem_center] bg-no-repeat"
                >
                  <option value="all">Tất cả model</option>
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_1rem_center] bg-no-repeat"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="FAILED">Thất bại</option>
                </select>
              </div>
            </div>
          </section>

          {/* Logs Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AppIcon icon={History} className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900">Nhật ký chi tiết</h2>
              </div>
              {!isLoading && (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Hiển thị {filteredLogs.length} kết quả
                </span>
              )}
            </div>

            {isLoading ? (
              <CardListSkeleton count={4} />
            ) : filteredLogs.length === 0 ? (
              <div className="rounded-[40px] border border-dashed border-slate-300 bg-slate-50/50 p-10 sm:p-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 mb-6">
                  <AppIcon icon={History} className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Không tìm thấy nhật ký.</h3>
                <p className="mt-2 text-slate-500 font-medium">Hãy thay đổi bộ lọc hoặc bắt đầu sử dụng API để ghi nhận lịch sử.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredLogs.map((log) => (
                  <article
                    key={log.id}
                    className="flex flex-col gap-6 rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span 
                          className="font-mono text-[13px] font-black text-slate-900 truncate max-w-[200px]"
                          title={log.model}
                        >
                          {log.model}
                        </span>
                        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${log.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                          }`}>
                          <AppIcon icon={log.status === "SUCCESS" ? CheckCircle2 : XCircle} className="h-3.5 w-3.5" />
                          {log.status === "SUCCESS" ? "Thành công" : "Thất bại"}
                          {log.httpStatus && <span className="opacity-50 ml-0.5">({log.httpStatus})</span>}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1">
                        {new Date(log.createdAt).toLocaleString("vi-VN")} · {log.apiKey?.name ?? "API Key"} ({log.apiKey?.keyPrefix ?? "..."})
                      </p>
                      {(log.errorCode || log.errorMessage) && (
                        <div className="flex flex-col gap-0.5">
                          {log.errorCode && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{log.errorCode}</p>}
                          {log.errorMessage && <p className="text-xs font-bold text-rose-600 line-clamp-2">{log.errorMessage}</p>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6 justify-between border-t border-slate-50 pt-4 sm:pt-0 sm:border-none sm:text-right sm:justify-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tokens</p>
                        <p className="text-sm font-black text-slate-900">{log.inputTokens.toLocaleString()}/{log.outputTokens.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Credits</p>
                        <p className={`text-lg font-black ${log.creditsUsed > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                          {new Intl.NumberFormat("vi-VN").format(log.creditsUsed)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AppIcon icon={KeyRound} className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-900">Kiểm tra API key</h3>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-6 mb-6">
              Sử dụng API key trong extension, IDE hoặc API client tương thích OpenAI để kiểm tra kết nối.
            </p>
            <div className="space-y-3">
              <Link 
                href="/api-docs" 
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Xem tài liệu API
              </Link>
              <Link 
                href="/api-keys" 
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Quản lý API Keys
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <h3 className="text-lg font-black mb-4">Bạn gặp vấn đề?</h3>
            <p className="text-xs font-medium text-slate-400 leading-6 mb-6">
              Nếu bạn thấy có sự sai lệch về credits hoặc lượt gọi, hãy liên hệ đội ngũ kỹ thuật để được hỗ trợ kiểm soát.
            </p>
            <button className="w-full rounded-full bg-emerald-600 py-3 text-sm font-black hover:bg-emerald-700 transition-colors">
              Gửi hỗ trợ
            </button>
          </div>
        </aside>
      </div>

      {/* Toast */}
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
