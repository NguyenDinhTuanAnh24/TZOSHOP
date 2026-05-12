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
import DashboardSubNav from "@/components/dashboard/dashboard-sub-nav";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { StatCardsSkeleton, CardListSkeleton } from "@/components/ui/page-skeleton";

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



  return (
    <div className="space-y-10 pb-20">
      <DashboardSubNav 
        items={[
          { label: "API Keys", href: "/api-keys" },
          { label: "Tài liệu API", href: "/api-docs" },
          { label: "Lịch sử sử dụng", href: "/usage" },
        ]} 
      />
      <PageHeader 
        title="Lịch sử sử dụng" 
        description="Theo dõi lượt gọi API, credits đã dùng và trạng thái request."
        icon={<BarChart3 className="h-8 w-8" />}
      />

      {/* Stats Cards */}
      {isLoading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className={ui.statLabel}>Tổng lượt gọi</p>
              <div className="p-1.5 rounded-lg bg-[#fbfbf8] border border-[#edf1ee]">
                <BarChart3 className="h-4 w-4 text-[#8a9690]" />
              </div>
            </div>
            <p className={ui.statValue}>{stats.totalCalls.toLocaleString("vi-VN")}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className={ui.statLabel}>Credits đã dùng</p>
              <div className="p-1.5 rounded-lg bg-[#e7fff7] border border-[#00d4a4]/20">
                <Zap className="h-4 w-4 text-[#00d4a4]" />
              </div>
            </div>
            <p className={cn(ui.statValue, "text-[#00d4a4]")}>{new Intl.NumberFormat("vi-VN").format(stats.creditsUsed)}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className={ui.statLabel}>Thành công</p>
              <div className="p-1.5 rounded-lg bg-[#e7fff7] border border-[#00d4a4]/20">
                <CheckCircle2 className="h-4 w-4 text-[#00d4a4]" />
              </div>
            </div>
            <p className={cn(ui.statValue, "text-[#00d4a4]")}>{stats.successCalls.toLocaleString("vi-VN")}</p>
          </AppCard>
          <AppCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className={ui.statLabel}>Thất bại</p>
              <div className="p-1.5 rounded-lg bg-red-50 border border-red-100">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <p className={cn(ui.statValue, "text-red-600")}>{stats.failedCalls.toLocaleString("vi-VN")}</p>
          </AppCard>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        <div className="space-y-8">

          {/* Filter Bar */}
          <AppCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Filter className="h-5 w-5 text-[#00d4a4]" />
              <h2 className={ui.h3}>Bộ lọc lịch sử</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className={ui.label}>API Key</label>
                <select
                  value={filterApiKeyId}
                  onChange={(e) => setFilterApiKeyId(e.target.value)}
                  className={ui.select}
                >
                  <option value="all">Tất cả key</option>
                  {apiKeys.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Model</label>
                <select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className={ui.select}
                >
                  <option value="all">Tất cả model</option>
                  {models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={ui.label}>Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={ui.select}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="FAILED">Thất bại</option>
                </select>
              </div>
            </div>
          </AppCard>

          {/* Logs Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-[#00d4a4]" />
                <h2 className={ui.h3}>Nhật ký chi tiết</h2>
              </div>
              {!isLoading && (
                <span className={ui.label}>
                  Hiển thị {filteredLogs.length} kết quả
                </span>
              )}
            </div>

            {isLoading ? (
              <CardListSkeleton count={4} />
            ) : filteredLogs.length === 0 ? (
              <div className="rounded-[40px] border border-dashed border-[#dfe5e1] bg-[#fbfbf8] p-10 sm:p-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white border border-[#dfe5e1] text-[#8a9690] mb-6 shadow-sm">
                  <History className="h-8 w-8" />
                </div>
                <h3 className={ui.h3}>Không tìm thấy nhật ký.</h3>
                <p className={ui.p}>Hãy thay đổi bộ lọc hoặc bắt đầu sử dụng API để ghi nhận lịch sử.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredLogs.map((log) => (
                  <AppCard
                    key={log.id}
                    variant="interactive"
                    className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span 
                          className="font-mono text-[13px] font-black text-[#0b0f0d] truncate max-w-[200px]"
                          title={log.model}
                        >
                          {log.model}
                        </span>
                        <StatusBadge 
                          status={log.status === "SUCCESS" ? "Thành công" : "Thất bại"} 
                          variant={log.status === "SUCCESS" ? "success" : "danger"} 
                        />
                        {log.httpStatus && <span className="text-[10px] font-bold text-[#8a9690]">({log.httpStatus})</span>}
                      </div>
                      <p className={cn(ui.pMuted, "font-bold uppercase tracking-tight")}>
                        {new Date(log.createdAt).toLocaleString("vi-VN")} · {log.apiKey?.name ?? "API Key"} ({log.apiKey?.keyPrefix ?? "..."})
                      </p>
                      {(log.errorCode || log.errorMessage) && (
                        <div className="flex flex-col gap-0.5">
                          {log.errorCode && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{log.errorCode}</p>}
                          {log.errorMessage && <p className="text-xs font-bold text-red-600 line-clamp-2">{log.errorMessage}</p>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6 justify-between border-t border-[#edf1ee] pt-4 sm:pt-0 sm:border-none sm:text-right sm:justify-end">
                      <div className="space-y-1">
                        <p className={ui.label}>Tokens</p>
                        <p className="text-sm font-black text-[#0b0f0d]">{log.inputTokens.toLocaleString()}/{log.outputTokens.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className={ui.label}>Credits</p>
                        <p className={`text-lg font-black ${log.creditsUsed > 0 ? "text-[#00d4a4]" : "text-[#8a9690]"}`}>
                          {new Intl.NumberFormat("vi-VN").format(log.creditsUsed)}
                        </p>
                      </div>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-6">
          <AppCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#00d4a4]" />
              <h3 className={ui.h3}>Kiểm tra API key</h3>
            </div>
            <p className={ui.pMuted + " leading-6 mb-6 font-bold"}>
              Sử dụng API key trong extension, IDE hoặc API client tương thích OpenAI để kiểm tra kết nối.
            </p>
            <div className="space-y-3">
              <AppButton variant="secondary" onClick={() => window.location.href = "/api-docs"} className="w-full" size="sm">
                Xem tài liệu API
              </AppButton>
              <AppButton variant="secondary" onClick={() => window.location.href = "/api-keys"} className="w-full" size="sm">
                Quản lý API Keys
              </AppButton>
            </div>
          </AppCard>

          <div className="rounded-3xl bg-[#020c0a] p-8 text-white">
            <h3 className="text-lg font-black mb-4">Bạn gặp vấn đề?</h3>
            <p className="text-xs font-medium text-white/50 leading-6 mb-6">
              Nếu bạn thấy có sự sai lệch về credits hoặc lượt gọi, hãy liên hệ đội ngũ kỹ thuật để được hỗ trợ kiểm soát.
            </p>
            <AppButton variant="accent" className="w-full">
              Gửi hỗ trợ
            </AppButton>
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
