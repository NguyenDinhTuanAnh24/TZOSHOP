"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  AlertTriangle,
  ChartNoAxesColumnIncreasing,
  Clock3,
  Search,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UsagePageSkeleton } from "@/components/dashboard/usage/usage-page-skeleton";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { AdminPagination } from "@/components/admin/admin-pagination";

type ApiFamily = "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
type TimeFilter = "today" | "7d" | "30d" | "all";

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

function getFamilyLabel(apiFamily: ApiFamily) {
  const familyMap: Record<ApiFamily, string> = {
    CODEXAI: "CodexAI",
    CLAUDE: "Claude",
    GEMINI: "Gemini",
    DEEPSEEK: "DeepSeek",
  };
  return familyMap[apiFamily];
}

function getFamilyBadgeClass(apiFamily: ApiFamily) {
  if (apiFamily === "CODEXAI") return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  if (apiFamily === "CLAUDE") return "bg-orange-50 text-orange-700 border border-orange-100";
  if (apiFamily === "GEMINI") return "bg-sky-50 text-sky-700 border border-sky-100";
  return "bg-violet-50 text-violet-700 border border-violet-100";
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_10px_24px_-14px_rgba(79,70,229,0.55)]"
          : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
      )}
    >
      {children}
    </button>
  );
}

export default function UsagePage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const [filterFamily, setFilterFamily] = useState<ApiFamily | "all">("all");
  const [filterApiKeyId, setFilterApiKeyId] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [nowTs] = useState(() => Date.now());

  const { toast, showToast, clearToast } = useToast(3000);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
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
    } catch {
      const message = "Vui lòng thử lại sau ít phút.";
      setLoadError(message);
      showToast("Không thể tải lịch sử sử dụng", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const models = useMemo(() => {
    const uniqueModels = new Set<string>();
    usageLogs.forEach((log) => uniqueModels.add(log.model));
    return Array.from(uniqueModels).sort();
  }, [usageLogs]);

  const families = useMemo(() => {
    return Array.from(new Set(usageLogs.map((l) => l.apiFamily)));
  }, [usageLogs]);

  const filteredLogs = useMemo(() => {
    const now = nowTs;

    return usageLogs.filter((log) => {
      const logTs = new Date(log.createdAt).getTime();

      const matchTime =
        timeFilter === "all"
          ? true
          : timeFilter === "today"
            ? new Date(log.createdAt).toDateString() === new Date(now).toDateString()
            : timeFilter === "7d"
              ? logTs >= now - 7 * 24 * 60 * 60 * 1000
              : logTs >= now - 30 * 24 * 60 * 60 * 1000;

      const matchFamily = filterFamily === "all" || log.apiFamily === filterFamily;
      const matchKey = filterApiKeyId === "all" || log.apiKey?.id === filterApiKeyId;
      const matchModel = filterModel === "all" || log.model === filterModel;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;

      const q = searchText.trim().toLowerCase();
      const matchSearch =
        !q ||
        log.model.toLowerCase().includes(q) ||
        log.endpoint.toLowerCase().includes(q) ||
        (log.apiKey?.name ?? "").toLowerCase().includes(q) ||
        (log.apiKey?.keyPrefix ?? "").toLowerCase().includes(q);

      return matchTime && matchFamily && matchKey && matchModel && matchStatus && matchSearch;
    });
  }, [usageLogs, timeFilter, filterFamily, filterApiKeyId, filterModel, filterStatus, searchText, nowTs]);

  const totalPages = useMemo(() => Math.max(Math.ceil(filteredLogs.length / pageSize), 1), [filteredLogs.length, pageSize]);
  const currentPage = Math.min(page, totalPages);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [currentPage, filteredLogs, pageSize]);

  const stats = useMemo(() => {
    const totalRequests = filteredLogs.length;
    const creditsUsed = filteredLogs.reduce((sum, log) => sum + Number(log.creditsCharged), 0);
    const promptTokens = filteredLogs.reduce((sum, log) => sum + (log.inputTokens || 0), 0);
    const completionTokens = filteredLogs.reduce((sum, log) => sum + (log.outputTokens || 0), 0);

    const modelCount = new Map<string, number>();
    filteredLogs.forEach((l) => modelCount.set(l.model, (modelCount.get(l.model) || 0) + 1));
    const mostUsedModel = [...modelCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    return { totalRequests, creditsUsed, promptTokens, completionTokens, mostUsedModel };
  }, [filteredLogs]);

  return (
    <main className="space-y-8 pb-20" aria-busy={isLoading}>
      <TextFadeInUp as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Lịch sử sử dụng</h1>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Theo dõi các request API, model đã dùng, token tiêu thụ và credits phát sinh theo thời gian.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CosmicButton href="/api-keys">Tạo API key</CosmicButton>
            <CosmicButton href="/api-docs" variant="secondary">Tài liệu API</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      {isLoading ? (
        <UsagePageSkeleton />
      ) : (
        <>
          <TextFadeInUp as="section" delay={0.05} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Tổng request", value: stats.totalRequests.toLocaleString("vi-VN"), desc: "Trong phạm vi đã lọc", icon: ChartNoAxesColumnIncreasing, iconClass: "bg-indigo-50 text-indigo-600" },
              { label: "Credits đã dùng", value: new Intl.NumberFormat("vi-VN").format(stats.creditsUsed), desc: "Credits phát sinh", icon: Zap, iconClass: "bg-violet-50 text-violet-600" },
              { label: "Token đã dùng", value: new Intl.NumberFormat("vi-VN").format(stats.promptTokens + stats.completionTokens), desc: `Prompt ${stats.promptTokens.toLocaleString("vi-VN")} • Completion ${stats.completionTokens.toLocaleString("vi-VN")}`, icon: Activity, iconClass: "bg-emerald-50 text-emerald-600" },
              { label: "Model dùng nhiều nhất", value: stats.mostUsedModel, desc: "Theo dữ liệu đã lọc", icon: Clock3, iconClass: "bg-amber-50 text-amber-700" },
            ].map((s) => (
              <article key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{s.label}</p>
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.iconClass)}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 break-all text-2xl font-extrabold text-slate-950">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </article>
            ))}
          </TextFadeInUp>

          <TextFadeInUp as="section" delay={0.1} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
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
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo model, API key hoặc endpoint..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select value={filterFamily} onChange={(e) => { setFilterFamily(e.target.value as ApiFamily | "all"); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                <option value="all">Tất cả dòng AI</option>
                {families.map((f) => (<option key={f} value={f}>{getFamilyLabel(f)}</option>))}
              </select>
              <select value={filterModel} onChange={(e) => { setFilterModel(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                <option value="all">Tất cả model</option>
                {models.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
              <select value={filterApiKeyId} onChange={(e) => { setFilterApiKeyId(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                <option value="all">Tất cả key</option>
                {apiKeys.map((k) => (<option key={k.id} value={k.id}>{k.name}</option>))}
              </select>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                <option value="all">Tất cả trạng thái</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Lỗi</option>
              </select>
            </div>
          </TextFadeInUp>

          {loadError ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">Không thể tải lịch sử sử dụng</h3>
              <p className="mt-2 text-sm text-slate-600">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadData()}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 active:scale-[0.98]"
              >
                Thử lại
              </button>
            </section>
          ) : filteredLogs.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Activity className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-950">Chưa có lịch sử sử dụng</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
                Khi bạn gọi API bằng API key, request và mức sử dụng sẽ hiển thị tại đây.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CosmicButton href="/api-keys">Tạo API key</CosmicButton>
                <CosmicButton href="/api-docs" variant="secondary">Xem tài liệu API</CosmicButton>
              </div>
            </section>
          ) : (
            <>
              <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Dòng AI</th>
                        <th className="px-4 py-3">API key</th>
                        <th className="px-4 py-3">Endpoint</th>
                        <th className="px-4 py-3">Prompt tokens</th>
                        <th className="px-4 py-3">Completion tokens</th>
                        <th className="px-4 py-3">Credits</th>
                        <th className="px-4 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLogs.map((log) => (
                        <tr key={log.id} className="border-t border-slate-100 text-sm text-slate-700 transition-colors hover:bg-indigo-50/30">
                          <td className="whitespace-nowrap px-4 py-4">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                          <td className="px-4 py-4"><code className="font-mono text-xs text-slate-900">{log.model}</code></td>
                          <td className="px-4 py-4"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getFamilyBadgeClass(log.apiFamily))}>{getFamilyLabel(log.apiFamily)}</span></td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{log.apiKey?.name ?? "API key"}</p>
                            <code className="text-xs text-slate-500">{log.apiKey?.keyPrefix ?? "N/A"}</code>
                          </td>
                          <td className="px-4 py-4"><code className="font-mono text-xs text-slate-600">{log.endpoint}</code></td>
                          <td className="px-4 py-4">{log.inputTokens.toLocaleString("vi-VN")}</td>
                          <td className="px-4 py-4">{log.outputTokens.toLocaleString("vi-VN")}</td>
                          <td className="px-4 py-4">{new Intl.NumberFormat("vi-VN").format(log.creditsUsed)}</td>
                          <td className="px-4 py-4">
                            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100")}>
                              {log.status === "SUCCESS" ? "Thành công" : "Lỗi"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-4 lg:hidden">
                {paginatedLogs.map((log) => (
                  <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <code className="font-mono text-sm font-semibold text-slate-900">{log.model}</code>
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100")}>
                        {log.status === "SUCCESS" ? "Thành công" : "Lỗi"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Dòng AI: <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", getFamilyBadgeClass(log.apiFamily))}>{getFamilyLabel(log.apiFamily)}</span></p>
                      <p>API key: <span className="font-semibold text-slate-900">{log.apiKey?.name ?? "API key"}</span> <span className="font-mono text-xs">{log.apiKey?.keyPrefix ?? "N/A"}</span></p>
                      <p>Endpoint: <code className="font-mono text-xs">{log.endpoint}</code></p>
                      <p>Prompt tokens: <span className="font-semibold text-slate-900">{log.inputTokens.toLocaleString("vi-VN")}</span></p>
                      <p>Completion tokens: <span className="font-semibold text-slate-900">{log.outputTokens.toLocaleString("vi-VN")}</span></p>
                      <p>Credits: <span className="font-semibold text-slate-900">{new Intl.NumberFormat("vi-VN").format(log.creditsUsed)}</span></p>
                      <p>Thời gian: <span className="font-semibold text-slate-900">{new Date(log.createdAt).toLocaleString("vi-VN")}</span></p>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </>
      )}

      {filteredLogs.length > 0 ? (
        <AdminPagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredLogs.length}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      ) : null}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </main>
  );
}
