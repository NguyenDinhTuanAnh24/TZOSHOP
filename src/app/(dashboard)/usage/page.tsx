"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ChartNoAxesColumnIncreasing, Clock3, Search, Zap } from "lucide-react";

import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { UsagePageSkeleton } from "@/components/dashboard/usage/usage-page-skeleton";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { formatTokenCount } from "@/lib/format";
import { formatCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";
import { getAiLineLabel } from "@/lib/ai-family-from-model";

type ApiFamily = "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK" | "UNKNOWN";
type TimeFilter = "today" | "7d" | "30d" | "all";

type UsageLogItem = {
  id: string;
  apiFamily: ApiFamily;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  creditsUsed: number;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
  apiKey: { id: string; name: string; keyPrefix: string } | null;
};

function getFamilyLabel(apiFamily: ApiFamily) {
  return getAiLineLabel(apiFamily);
}

function getFamilyBadgeClass(apiFamily: ApiFamily) {
  if (apiFamily === "CODEXAI") return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  if (apiFamily === "CLAUDE") return "bg-orange-50 text-orange-700 border border-orange-100";
  if (apiFamily === "GEMINI") return "bg-sky-50 text-sky-700 border border-sky-100";
  if (apiFamily === "DEEPSEEK") return "bg-violet-50 text-violet-700 border border-violet-100";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all duration-200",
        active ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700",
      )}
    >
      {children}
    </button>
  );
}

export default function UsagePage() {
  const [usageLogs, setUsageLogs] = useState<UsageLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const [filterFamily, setFilterFamily] = useState<ApiFamily | "all">("all");
  const [filterApiKeyId, setFilterApiKeyId] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { toast, showToast, clearToast } = useToast(3000);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await fetch("/api/usage", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Không thể tải lịch sử sử dụng.");

      setUsageLogs(result.data || []);
      if (result?.sync?.ok === false) {
        setSyncMessage(result?.sync?.message || "Chưa đồng bộ được lịch sử sử dụng");
      } else {
        setSyncMessage(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải lịch sử sử dụng.";
      setLoadError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const families = useMemo(() => Array.from(new Set(usageLogs.map((l) => l.apiFamily))), [usageLogs]);
  const models = useMemo(() => Array.from(new Set(usageLogs.map((l) => l.model))).sort(), [usageLogs]);
  const apiKeys = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    usageLogs.forEach((log) => {
      if (!log.apiKey) return;
      seen.set(log.apiKey.id, { id: log.apiKey.id, name: log.apiKey.name });
    });
    return Array.from(seen.values());
  }, [usageLogs]);

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    return usageLogs.filter((log) => {
      const ts = +new Date(log.createdAt);
      const matchTime =
        timeFilter === "all"
          ? true
          : timeFilter === "today"
            ? new Date(log.createdAt).toDateString() === new Date(now).toDateString()
            : timeFilter === "7d"
              ? ts >= now - 7 * 24 * 60 * 60 * 1000
              : ts >= now - 30 * 24 * 60 * 60 * 1000;

      const q = searchText.trim().toLowerCase();
      const matchSearch =
        !q ||
        log.model.toLowerCase().includes(q) ||
        log.endpoint.toLowerCase().includes(q) ||
        (log.apiKey?.name || "").toLowerCase().includes(q) ||
        (log.apiKey?.keyPrefix || "").toLowerCase().includes(q);

      const matchFamily = filterFamily === "all" || log.apiFamily === filterFamily;
      const matchModel = filterModel === "all" || log.model === filterModel;
      const matchApiKey = filterApiKeyId === "all" || log.apiKey?.id === filterApiKeyId;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;

      return matchTime && matchSearch && matchFamily && matchModel && matchApiKey && matchStatus;
    });
  }, [usageLogs, timeFilter, filterFamily, filterModel, filterApiKeyId, filterStatus, searchText]);

  const stats = useMemo(() => {
    const totalRequests = filteredLogs.length;
    const creditsUsed = filteredLogs.reduce((sum, item) => sum + Number(item.creditsUsed || 0), 0);
    const tokensUsed = filteredLogs.reduce((sum, item) => sum + Number(item.totalTokens || 0), 0);

    const counter = new Map<string, number>();
    filteredLogs.forEach((log) => counter.set(log.model, (counter.get(log.model) || 0) + 1));
    const mostUsedModel = [...counter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return { totalRequests, creditsUsed, tokensUsed, mostUsedModel };
  }, [filteredLogs]);

  const totalPages = Math.max(Math.ceil(filteredLogs.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <main className="space-y-8 pb-20" aria-busy={isLoading}>
      <TextFadeInUp as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Lịch sử sử dụng</h1>
            <p className="text-sm leading-7 text-slate-600 md:text-base">Theo dõi request API, model đã dùng, tokens và credits phát sinh theo thời gian.</p>
            {syncMessage ? <p className="text-sm font-semibold text-amber-700">{syncMessage}</p> : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CosmicButton href="/api-keys">Quản lý API key</CosmicButton>
            <CosmicButton href="/api-docs" variant="secondary">Tài liệu API</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      {isLoading ? <UsagePageSkeleton /> : null}

      {!isLoading && loadError ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-950">Không thể tải lịch sử sử dụng</h3>
          <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        </section>
      ) : null}

      {!isLoading && !loadError ? (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Tổng request", value: stats.totalRequests.toLocaleString("vi-VN"), desc: "Trong phạm vi đã lọc", icon: ChartNoAxesColumnIncreasing, iconClass: "bg-indigo-50 text-indigo-600" },
              { label: "Credits đã dùng", value: formatCredits(stats.creditsUsed), desc: "Đã phát sinh", icon: Zap, iconClass: "bg-violet-50 text-violet-600" },
              { label: "Tokens đã dùng", value: formatTokenCount(stats.tokensUsed), desc: "Prompt + Completion", icon: Activity, iconClass: "bg-emerald-50 text-emerald-600" },
              { label: "Model dùng nhiều nhất", value: stats.mostUsedModel, desc: "Theo dữ liệu đã lọc", icon: Clock3, iconClass: "bg-amber-50 text-amber-700" },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{item.label}</p>
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", item.iconClass)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 break-all text-2xl font-extrabold text-slate-950">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="flex gap-2 overflow-x-auto">
                <FilterChip active={timeFilter === "today"} onClick={() => { setTimeFilter("today"); setPage(1); }}>Hôm nay</FilterChip>
                <FilterChip active={timeFilter === "7d"} onClick={() => { setTimeFilter("7d"); setPage(1); }}>7 ngày</FilterChip>
                <FilterChip active={timeFilter === "30d"} onClick={() => { setTimeFilter("30d"); setPage(1); }}>30 ngày</FilterChip>
                <FilterChip active={timeFilter === "all"} onClick={() => { setTimeFilter("all"); setPage(1); }}>Tất cả</FilterChip>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                  placeholder="Tìm theo model, API key hoặc endpoint..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select value={filterFamily} onChange={(e) => { setFilterFamily(e.target.value as ApiFamily | "all"); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="all">Tất cả dòng AI</option>
                {families.map((family) => <option key={family} value={family}>{getFamilyLabel(family)}</option>)}
              </select>
              <select value={filterModel} onChange={(e) => { setFilterModel(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="all">Tất cả model</option>
                {models.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
              <select value={filterApiKeyId} onChange={(e) => { setFilterApiKeyId(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="all">Tất cả API key</option>
                {apiKeys.map((key) => <option key={key.id} value={key.id}>{key.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="all">Tất cả trạng thái</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Lỗi</option>
              </select>
            </div>
          </section>

          {filteredLogs.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h3 className="text-2xl font-bold text-slate-950">Chưa có lịch sử sử dụng</h3>
              <p className="mt-3 text-sm text-slate-600">Khi bạn gọi API của TzoShop, dữ liệu sẽ hiển thị tại đây.</p>
            </section>
          ) : (
            <>
            <section className="grid grid-cols-1 gap-3 lg:hidden">
              {paginatedLogs.map((log) => (
                <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{log.apiKey?.name || "API key"}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                      {log.status === "SUCCESS" ? "Thành công" : "Lỗi"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getFamilyBadgeClass(log.apiFamily))}>{getFamilyLabel(log.apiFamily)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{log.apiKey?.keyPrefix || "N/A"}</span>
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">{log.model}</p>
                    <p className="mt-2 text-xs text-slate-500">{log.endpoint}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Prompt</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatTokenCount(log.inputTokens)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Completion</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatTokenCount(log.outputTokens)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total tokens</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatTokenCount(log.totalTokens)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Credits</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatCredits(log.creditsUsed)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px]">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">API key</th>
                      <th className="px-4 py-3">Dòng AI</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3">Prompt tokens</th>
                      <th className="px-4 py-3">Completion tokens</th>
                      <th className="px-4 py-3">Total tokens</th>
                      <th className="px-4 py-3">Credits đã dùng</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-100 text-sm text-slate-700 hover:bg-indigo-50/30">
                        <td className="whitespace-nowrap px-4 py-4">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{log.apiKey?.name || "API key"}</p>
                          <code className="text-xs text-slate-500">{log.apiKey?.keyPrefix || "N/A"}</code>
                        </td>
                        <td className="px-4 py-4"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getFamilyBadgeClass(log.apiFamily))}>{getFamilyLabel(log.apiFamily)}</span></td>
                        <td className="px-4 py-4"><code className="font-mono text-xs text-slate-900">{log.model}</code></td>
                        <td className="px-4 py-4">{formatTokenCount(log.inputTokens)}</td>
                        <td className="px-4 py-4">{formatTokenCount(log.outputTokens)}</td>
                        <td className="px-4 py-4">{formatTokenCount(log.totalTokens)}</td>
                        <td className="px-4 py-4">{formatCredits(log.creditsUsed)}</td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
                            {log.status === "SUCCESS" ? "Thành công" : "Lỗi"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            </>
          )}

          {filteredLogs.length > 0 ? (
            <AdminPagination
              page={currentPage}
              pageSize={pageSize}
              total={filteredLogs.length}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(next) => {
                setPageSize(next);
                setPage(1);
              }}
            />
          ) : null}
        </>
      ) : null}

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </main>
  );
}
