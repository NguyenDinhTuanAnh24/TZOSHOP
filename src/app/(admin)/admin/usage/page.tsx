"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Activity, AlertCircle, Cpu, History, Key, Search, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { formatTokenCount } from "@/lib/format";

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
  user?: {
    name: string | null;
    email: string;
  };
  apiKey?: {
    name: string;
    keyPrefix: string;
  } | null;
};

type UsageStats = {
  totalRequests: number;
  successCount: number;
  failedCount: number;
  totalCredits: string;
  totalTokens: number;
  topModels: { model: string; count: number }[];
};

type Pagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type StatusFilter = "ALL" | "SUCCESS" | "FAILED" | "PENDING";
type TimeFilter = "all" | "today" | "7d" | "30d";
type FamilyFilter = "ALL" | "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
type SortFilter = "NEWEST" | "OLDEST" | "TOKEN_DESC" | "CREDITS_DESC";

function familyLabel(family: string) {
  if (family === "CODEXAI") return "CodexAI";
  if (family === "CLAUDE") return "Claude";
  if (family === "GEMINI") return "Gemini";
  if (family === "DEEPSEEK") return "DeepSeek";
  return family;
}

function familyBadgeClass(family: string) {
  if (family === "CODEXAI") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (family === "CLAUDE") return "border-orange-100 bg-orange-50 text-orange-700";
  if (family === "GEMINI") return "border-sky-100 bg-sky-50 text-sky-700";
  if (family === "DEEPSEEK") return "border-violet-100 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function statusInfo(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "SUCCESS" || normalized === "OK" || normalized === "200") {
    return { label: "Thành công", className: "border-emerald-100 bg-emerald-50 text-emerald-700" };
  }
  if (normalized === "PENDING" || normalized === "PROCESSING") {
    return { label: "Đang xử lý", className: "border-indigo-100 bg-indigo-50 text-indigo-700" };
  }
  return { label: "Lỗi", className: "border-rose-100 bg-rose-50 text-rose-700" };
}

function formatCredits(value: string) {
  const num = Math.abs(Number(value || 0));
  if (Number.isInteger(num)) {
    return new Intl.NumberFormat("en-US").format(num);
  }
  return num.toFixed(6).replace(/\.?0+$/, "");
}

function UsageSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="mt-4 h-10 w-56 rounded-xl" />
        <Skeleton className="mt-3 h-5 w-[620px] max-w-full rounded-full" />
      </section>
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="mt-5 h-4 w-28 rounded-full" />
            <Skeleton className="mt-3 h-8 w-36 rounded-xl" />
            <Skeleton className="mt-3 h-4 w-40 rounded-full" />
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-xl" />
          ))}
        </div>
      </section>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-3 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminUsagePage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterEmail, setFilterEmail] = useState("");
  const [filterApiKey, setFilterApiKey] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [filterTimeRange, setFilterTimeRange] = useState<TimeFilter>("all");
  const [filterFamily, setFilterFamily] = useState<FamilyFilter>("ALL");
  const [filterEndpoint, setFilterEndpoint] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortFilter>("NEWEST");

  const fetchUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        timeRange: filterTimeRange,
      });
      if (filterEmail) params.append("email", filterEmail);
      if (filterApiKey) params.append("apiKey", filterApiKey);
      if (filterModel) params.append("model", filterModel);
      if (filterStatus !== "ALL") params.append("status", filterStatus);

      const res = await fetch(`/api/admin/usage?${params.toString()}`, { cache: "no-store" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setIsError(true);
        return;
      }
      setLogs(result.data || []);
      setStats(result.stats);
      setPagination(result.pagination);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterTimeRange, filterEmail, filterApiKey, filterModel, filterStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsage();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchUsage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchUsage();
  };

  const endpointOptions = useMemo(() => Array.from(new Set(logs.map((log) => log.endpoint).filter(Boolean))), [logs]);

  const displayedLogs = useMemo(() => {
    let items = [...logs];
    if (filterFamily !== "ALL") items = items.filter((log) => log.apiFamily === filterFamily);
    if (filterEndpoint !== "ALL") items = items.filter((log) => log.endpoint === filterEndpoint);
    if (sortBy === "OLDEST") items.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else if (sortBy === "TOKEN_DESC") items.sort((a, b) => b.totalTokens - a.totalTokens);
    else if (sortBy === "CREDITS_DESC") items.sort((a, b) => Number(b.creditsCharged) - Number(a.creditsCharged));
    else items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return items;
  }, [logs, filterFamily, filterEndpoint, sortBy]);

  const activeUsers = useMemo(() => new Set(logs.map((log) => log.user?.email).filter(Boolean)).size, [logs]);
  const hasAnyFilter =
    Boolean(filterEmail) ||
    Boolean(filterApiKey) ||
    Boolean(filterModel) ||
    filterStatus !== "ALL" ||
    filterTimeRange !== "all" ||
    filterFamily !== "ALL" ||
    filterEndpoint !== "ALL";

  if (isLoading && !stats && logs.length === 0) return <UsageSkeleton />;

  if (isError && logs.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải lịch sử dùng</h2>
        <p className="mt-2 text-sm text-slate-600">Vui lòng thử lại sau ít phút.</p>
        <button
          type="button"
          onClick={() => void fetchUsage()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Thử lại
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-1">
      <TextFadeInUp as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Giám sát sử dụng</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Lịch sử dùng</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Theo dõi request API, model, token, credits và hoạt động sử dụng của toàn bộ người dùng.</p>
          </div>

        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng request", value: (stats?.totalRequests || 0).toLocaleString("vi-VN"), desc: "Tổng lượt gọi API", icon: Activity, cls: "bg-indigo-50 text-indigo-700" },
          { label: "Credits đã dùng", value: Number(stats?.totalCredits || 0).toLocaleString("vi-VN"), desc: "Credits đã trừ", icon: Zap, cls: "bg-violet-50 text-violet-700" },
          { label: "Token đã dùng", value: formatTokenCount(stats?.totalTokens || 0), desc: "Prompt + completion tokens", icon: Cpu, cls: "bg-emerald-50 text-emerald-700" },
          { label: "Người dùng hoạt động", value: activeUsers.toLocaleString("vi-VN"), desc: "User có phát sinh request", icon: Users, cls: "bg-sky-50 text-sky-700" },
        ].map((item, index) => (
          <TextFadeInUp key={item.label} delay={Math.min(index * 0.05, 0.25)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", item.cls)}><item.icon className="h-5 w-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Tìm theo email, API key, model hoặc endpoint..." value={filterEmail} onChange={(e) => setFilterEmail(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Lỗi</option>
            <option value="PENDING">Đang xử lý</option>
          </select>
          <select value={filterFamily} onChange={(e) => setFilterFamily(e.target.value as FamilyFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="ALL">Tất cả dòng AI</option>
            <option value="CODEXAI">CodexAI</option>
            <option value="CLAUDE">Claude</option>
            <option value="GEMINI">Gemini</option>
            <option value="DEEPSEEK">DeepSeek</option>
          </select>
          <select value={filterTimeRange} onChange={(e) => setFilterTimeRange(e.target.value as TimeFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="all">Tất cả</option>
            <option value="today">Hôm nay</option>
            <option value="7d">7 ngày</option>
            <option value="30d">30 ngày</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white transition active:scale-[0.98]">Tìm</button>
            <button
              type="button"
              onClick={() => {
                setFilterEmail("");
                setFilterApiKey("");
                setFilterModel("");
                setFilterStatus("ALL");
                setFilterTimeRange("all");
                setFilterFamily("ALL");
                setFilterEndpoint("ALL");
                setSortBy("NEWEST");
                setPage(1);
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Xóa lọc
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-6">
            <input type="text" placeholder="Lọc API key..." value={filterApiKey} onChange={(e) => setFilterApiKey(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            <input type="text" placeholder="Lọc model..." value={filterModel} onChange={(e) => setFilterModel(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            <select value={filterEndpoint} onChange={(e) => setFilterEndpoint(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
              <option value="ALL">Tất cả endpoint</option>
              {endpointOptions.map((endpoint) => (
                <option key={endpoint} value={endpoint}>{endpoint}</option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
              <option value="TOKEN_DESC">Token nhiều nhất</option>
              <option value="CREDITS_DESC">Credits nhiều nhất</option>
            </select>

            <div className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">{pagination?.totalCount ?? 0} bản ghi</div>
          </div>
        </form>
      </TextFadeInUp>

      <TextFadeInUp as="section" delay={0.1} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><History className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Mức sử dụng theo thời gian</h2>
            <p className="mt-1 text-sm text-slate-600">Chưa có đủ dữ liệu để hiển thị biểu đồ.</p>
          </div>
        </div>
      </TextFadeInUp>

      <TextFadeInUp as="section" delay={0.12} className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                {["Thời gian", "Người dùng", "API key", "Model", "Dòng AI", "Endpoint", "Prompt tokens", "Completion tokens", "Credits", "Trạng thái"].map((header) => (
                  <th key={header} className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><History className="h-7 w-7" /></div>
                      <p className="text-xl font-extrabold text-slate-950">{hasAnyFilter ? "Không tìm thấy lịch sử phù hợp" : "Chưa có lịch sử dùng"}</p>
                      <p className="mt-1 text-sm text-slate-600">{hasAnyFilter ? "Thử thay đổi bộ lọc để xem thêm dữ liệu." : "Khi người dùng gọi API, request và mức sử dụng sẽ hiển thị tại đây."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedLogs.map((log) => {
                  const status = statusInfo(log.status);
                  const userLabel = log.user?.name || log.user?.email || "Người dùng";
                  const initial = userLabel.charAt(0).toUpperCase();
                  return (
                    <tr key={log.id} className="border-t border-slate-100 align-middle transition hover:bg-indigo-50/30">
                      <td className="px-4 py-4"><div className="flex flex-col"><span className="text-sm font-semibold text-slate-900">{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: vi })}</span><span className="text-xs text-slate-500">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</span></div></td>
                      <td className="min-w-0 px-4 py-4">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{initial}</div>
                          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{log.user?.name || "Người dùng"}</p><p className="truncate text-xs text-slate-500" title={log.user?.email || "—"}>{log.user?.email || "—"}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {log.apiKey ? (
                          <div className="space-y-1">
                            <p className="max-w-[180px] truncate text-xs font-semibold text-slate-700" title={log.apiKey.name}>{log.apiKey.name}</p>
                            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-600"><Key className="h-3.5 w-3.5" />{log.apiKey.keyPrefix}••••</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4"><code className="inline-flex max-w-[220px] truncate rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700" title={log.model}>{log.model}</code></td>
                      <td className="px-4 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", familyBadgeClass(log.apiFamily))}>{familyLabel(log.apiFamily)}</span></td>
                      <td className="px-4 py-4"><code className="inline-flex max-w-[220px] truncate rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700" title={log.endpoint}>{log.endpoint}</code></td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">{formatTokenCount(log.inputTokens)}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">{formatTokenCount(log.outputTokens)}</td>
                      <td className="px-4 py-4"><span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1 text-sm font-semibold text-violet-700">{formatCredits(log.creditsCharged)}</span></td>
                      <td className="px-4 py-4"><div className="space-y-1"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", status.className)}>{status.label}</span>{log.errorMessage ? <p className="max-w-[180px] truncate text-xs text-rose-600" title={log.errorMessage}>{log.errorMessage}</p> : null}</div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 ? (
          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">Hiển thị <span className="font-semibold text-slate-900">{displayedLogs.length}</span> trên <span className="font-semibold text-slate-900">{pagination.totalCount}</span> kết quả</p>
            <div className="flex flex-wrap items-center gap-2">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">Trước</button>
              <div className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">Trang {page} / {pagination.totalPages}</div>
              <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages || isLoading} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">Sau</button>
            </div>
          </div>
        ) : null}
      </TextFadeInUp>

      <section className="space-y-4 lg:hidden">
        {displayedLogs.length === 0 ? (
          <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><History className="h-7 w-7" /></div>
            <p className="text-xl font-extrabold text-slate-950">{hasAnyFilter ? "Không tìm thấy lịch sử phù hợp" : "Chưa có lịch sử dùng"}</p>
            <p className="mt-2 text-sm text-slate-600">Khi người dùng gọi API, request và mức sử dụng sẽ hiển thị tại đây.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/admin/api-keys" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Xem API keys</Link>
              <Link href="/admin/models" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Xem model</Link>
            </div>
          </article>
        ) : (
          displayedLogs.map((log) => {
            const status = statusInfo(log.status);
            return (
              <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <code className="max-w-[65%] truncate rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700" title={log.model}>{log.model}</code>
                  <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", status.className)}>{status.label}</span>
                </div>
                <div className="mt-3 space-y-3 text-sm">
                  <p className="truncate text-slate-700"><span className="font-semibold text-slate-900">Người dùng:</span> {log.user?.email || "—"}</p>
                  <p className="truncate text-slate-700"><span className="font-semibold text-slate-900">API key:</span> {log.apiKey ? `${log.apiKey.name} (${log.apiKey.keyPrefix}••••)` : "—"}</p>
                  <p className="truncate text-slate-700"><span className="font-semibold text-slate-900">Dòng AI:</span> {familyLabel(log.apiFamily)}</p>
                  <p className="truncate text-slate-700" title={log.endpoint}><span className="font-semibold text-slate-900">Endpoint:</span> {log.endpoint}</p>
                  <p className="text-slate-700"><span className="font-semibold text-slate-900">Tokens:</span> P {formatTokenCount(log.inputTokens)} · C {formatTokenCount(log.outputTokens)} · T {formatTokenCount(log.totalTokens)}</p>
                  <p className="text-slate-700"><span className="font-semibold text-slate-900">Credits:</span> {formatCredits(log.creditsCharged)}</p>
                  <p className="text-slate-500">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: vi })}</p>
                </div>
              </article>
            );
          })
        )}
      </section>

      {isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          Không thể tải lịch sử dùng
        </div>
      ) : null}
    </div>
  );
}
