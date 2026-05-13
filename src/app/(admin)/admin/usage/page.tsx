"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Search,
  Cpu,
  Key,
  Zap,
  RefreshCw,
  History,
  CheckCircle2,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
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

function familyBadgeClass(family: string) {
  if (family === "CODEXAI") return "bg-[#C7F0D8]";
  if (family === "CLAUDE") return "bg-[#FFD93D]";
  if (family === "GEMINI") return "bg-[#A78BFA]";
  if (family === "DEEPSEEK") return "bg-[#FF6B6B]";
  return "bg-[#DBEAFE]";
}

function familyLabel(family: string) {
  if (family === "CODEXAI") return "CodexAI";
  if (family === "CLAUDE") return "Claude";
  if (family === "GEMINI") return "Gemini";
  if (family === "DEEPSEEK") return "DeepSeek";
  return family;
}

function usageStatusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "SUCCESS" || s === "OK" || s === "200") return "THÀNH CÔNG";
  if (s === "PENDING" || s === "PROCESSING") return "ĐANG XỬ LÝ";
  return "THẤT BẠI";
}

function usageStatusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "SUCCESS" || s === "OK" || s === "200") return "bg-[#C7F0D8]";
  if (s === "PENDING" || s === "PROCESSING") return "bg-[#FFD93D]";
  return "bg-[#FF6B6B]";
}

function UsageSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="h-8 w-72 animate-pulse bg-[#E9E1D0]" />
        <div className="mt-3 h-4 w-full max-w-[560px] animate-pulse bg-[#E9E1D0]" />
      </section>
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-h-[150px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-12 w-12 border-4 border-black bg-[#E9E1D0] animate-pulse" />
            <div className="mt-5 h-3 w-28 bg-[#E9E1D0] animate-pulse" />
            <div className="mt-3 h-8 w-32 bg-[#E9E1D0] animate-pulse" />
          </div>
        ))}
      </section>
      <section className="border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="h-20 animate-pulse bg-[#E9E1D0]" />
      </section>
      <section className="border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] md:p-5">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 border-2 border-black bg-[#E9E1D0] animate-pulse" />
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

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterEmail, setFilterEmail] = useState("");
  const [filterApiKey, setFilterApiKey] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterTimeRange, setFilterTimeRange] = useState("all");

  const fetchUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        timeRange: filterTimeRange,
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
      console.error("fetchUsage failed:", error);
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

  const hasAnyFilter =
    Boolean(filterEmail) ||
    Boolean(filterApiKey) ||
    Boolean(filterModel) ||
    filterStatus !== "ALL" ||
    filterTimeRange !== "all";

  const brutalInput =
    "h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none";

  if (isLoading && !stats && logs.length === 0) {
    return <UsageSkeleton />;
  }

  return (
    <div className="space-y-8 overflow-x-hidden pb-16">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <Activity className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">
                API USAGE
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">LỊCH SỬ SỬ DỤNG API</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">
              Giám sát request, tokens, credits và trạng thái xử lý.
            </p>
          </div>
          <AppButton
            onClick={() => {
              setPage(1);
              void fetchUsage();
            }}
            disabled={isLoading}
            className="h-12 border-4 border-black bg-white px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            LÀM MỚI
          </AppButton>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "TỔNG REQUEST",
            value: (stats?.totalRequests || 0).toLocaleString("vi-VN"),
            desc: "Tổng lượt gọi API",
            icon: Activity,
            bg: "bg-[#DBEAFE]",
          },
          {
            label: "THÀNH CÔNG / LỖI",
            value: `${(stats?.successCount || 0).toLocaleString("vi-VN")} / ${(stats?.failedCount || 0).toLocaleString("vi-VN")}`,
            desc: "Request thành công và thất bại",
            icon: CheckCircle2,
            bg: "bg-[#C7F0D8]",
          },
          {
            label: "CREDITS TIÊU THỤ",
            value: Math.abs(Number(stats?.totalCredits || 0)).toLocaleString("vi-VN"),
            desc: "Credits đã trừ từ người dùng",
            icon: Zap,
            bg: "bg-[#FFD93D]",
          },
          {
            label: "TỔNG TOKENS",
            value: (stats?.totalTokens || 0).toLocaleString("vi-VN"),
            desc: "Prompt + completion tokens",
            icon: Cpu,
            bg: "bg-[#A78BFA]",
          },
        ].map((s) => (
          <article
            key={s.label}
            className="flex min-h-[150px] flex-col justify-between border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000]"
          >
            <div className={`flex h-12 w-12 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${s.bg}`}>
              <s.icon className="h-6 w-6 text-black" />
            </div>
            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-black/70">{s.label}</p>
              <p className="mt-3 text-3xl font-black leading-none text-black md:text-4xl">{s.value}</p>
              <p className="mt-3 text-sm font-bold text-black/70">{s.desc}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4 border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_180px_180px_auto]">
          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Email người dùng</label>
            <input
              type="text"
              placeholder="Nhập email..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className={brutalInput}
            />
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Tên API key</label>
            <input
              type="text"
              placeholder="Nhập tên API key..."
              value={filterApiKey}
              onChange={(e) => setFilterApiKey(e.target.value)}
              className={brutalInput}
            />
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Model</label>
            <input
              type="text"
              placeholder="Chọn model..."
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className={brutalInput}
            />
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Trạng thái</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="FAILED">Thất bại</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="mb-2 text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Thời gian</label>
            <select value={filterTimeRange} onChange={(e) => setFilterTimeRange(e.target.value)} className={brutalInput}>
              <option value="all">Toàn thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày gần nhất</option>
              <option value="30d">30 ngày gần nhất</option>
            </select>
          </div>

          <div className="flex items-end">
            <AppButton
              type="submit"
              className="h-12 w-full border-4 border-black bg-[#FFD93D] px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 hover:bg-[#FF6B6B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <Search className="mr-2 h-4 w-4" />
              TÌM KIẾM
            </AppButton>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          <AppButton
            onClick={() => {
              setFilterEmail("");
              setFilterApiKey("");
              setFilterModel("");
              setFilterStatus("ALL");
              setFilterTimeRange("all");
              setPage(1);
            }}
            className="h-11 border-4 border-black bg-white px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
          >
            XÓA BỘ LỌC
          </AppButton>
        </div>
      </section>

      <section className="hidden overflow-hidden border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] lg:block md:p-5">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b-4 border-black bg-[#FFFDF5]">
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Thời gian</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Khách hàng</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">API key</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Model / Family</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65 text-center">Tokens</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65 text-center">Credits</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
                        <History className="h-7 w-7 text-black" />
                      </div>
                      <p className="text-xl font-black text-black">
                        {hasAnyFilter ? "KHÔNG TÌM THẤY LỊCH SỬ PHÙ HỢP" : "CHƯA CÓ DỮ LIỆU SỬ DỤNG"}
                      </p>
                      <p className="mt-1 text-sm font-bold text-black/60">
                        {hasAnyFilter
                          ? "Thử đổi email, API key, model hoặc khoảng thời gian."
                          : "Khi người dùng gọi API, lịch sử request, tokens và credits sẽ xuất hiện tại đây."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b-2 border-black/10 align-middle transition-colors hover:bg-[#FFF8D6]">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-black">{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: vi })}</span>
                        <span className="text-xs font-bold text-black/60">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black bg-[#C7F0D8] text-sm font-black text-black shadow-[3px_3px_0px_0px_#000]">
                          {(log.user?.name || log.user?.email || "K")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-black">{log.user?.name || "Không xác định"}</p>
                          <p className="max-w-[220px] truncate text-xs font-bold text-black/60">{log.user?.email || "—"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {log.apiKey ? (
                        <div className="space-y-1">
                          <p className="text-xs font-black text-black">{log.apiKey.name}</p>
                          <span className="inline-flex items-center gap-2 border-2 border-black bg-[#FFFDF5] px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000]">
                            <Key className="h-3.5 w-3.5" />
                            {log.apiKey.keyPrefix}****
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-black/60">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <p className="break-all text-sm font-black text-black">{log.model}</p>
                      <span className={`mt-1 inline-flex border-2 border-black px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${familyBadgeClass(log.apiFamily)}`}>
                        {familyLabel(log.apiFamily)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000]">
                        P: {log.inputTokens.toLocaleString("vi-VN")} · C: {log.outputTokens.toLocaleString("vi-VN")} · T: {log.totalTokens.toLocaleString("vi-VN")}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-sm font-black text-black shadow-[2px_2px_0px_0px_#000]">
                        {Math.abs(Number(log.creditsCharged)).toLocaleString("vi-VN")}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="space-y-1">
                        <span className={`inline-flex h-8 items-center border-2 border-black px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${usageStatusClass(log.status)}`}>
                          {usageStatusLabel(log.status)}
                        </span>
                        {log.errorMessage ? (
                          <p className="max-w-[180px] truncate text-xs font-bold text-black/60" title={log.errorMessage}>
                            {log.errorMessage}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-4 flex flex-col gap-4 border-t-2 border-black/20 pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-bold text-black/70">
              Hiển thị <span className="font-black text-black">{logs.length}</span> trên{" "}
              <span className="font-black text-black">{pagination.totalCount}</span> kết quả
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-11 border-4 border-black bg-white px-3 text-xs font-black text-black shadow-[4px_4px_0px_0px_#000]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <AppButton
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="h-11 border-4 border-black bg-white px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Trước
              </AppButton>
              <div className="inline-flex h-11 items-center border-4 border-black bg-[#FFD93D] px-4 text-sm font-black text-black shadow-[4px_4px_0px_0px_#000]">
                {page} / {pagination.totalPages}
              </div>
              <AppButton
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages || isLoading}
                className="h-11 border-4 border-black bg-white px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Sau
              </AppButton>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:hidden">
        {logs.length === 0 ? (
          <article className="flex min-h-[260px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-6 text-center shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
              <History className="h-7 w-7 text-black" />
            </div>
            <p className="text-lg font-black text-black">{hasAnyFilter ? "KHÔNG TÌM THẤY LỊCH SỬ PHÙ HỢP" : "CHƯA CÓ DỮ LIỆU SỬ DỤNG"}</p>
            <p className="mt-1 text-sm font-bold text-black/60">
              {hasAnyFilter
                ? "Thử đổi email, API key, model hoặc khoảng thời gian."
                : "Khi người dùng gọi API, lịch sử request, tokens và credits sẽ xuất hiện tại đây."}
            </p>
          </article>
        ) : (
          logs.map((log) => (
            <article key={log.id} className="space-y-4 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="break-all text-sm font-black text-black">{log.model}</p>
                  <p className="mt-1 text-xs font-bold text-black/60">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: vi })}</p>
                </div>
                <span className={`inline-flex h-8 items-center border-2 border-black px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${usageStatusClass(log.status)}`}>
                  {usageStatusLabel(log.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="border-2 border-black bg-white p-2">
                  <p className="text-[11px] font-black uppercase text-black/60">Khách hàng</p>
                  <p className="break-all text-sm font-bold text-black">{log.user?.email || "—"}</p>
                </div>
                <div className="border-2 border-black bg-white p-2">
                  <p className="text-[11px] font-black uppercase text-black/60">API key</p>
                  <p className="break-all font-mono text-xs font-bold text-black">
                    {log.apiKey ? `${log.apiKey.name} (${log.apiKey.keyPrefix}****)` : "—"}
                  </p>
                </div>
                <div className="border-2 border-black bg-white p-2">
                  <p className="text-[11px] font-black uppercase text-black/60">Tokens</p>
                  <p className="text-xs font-bold text-black">
                    P: {log.inputTokens.toLocaleString("vi-VN")} · C: {log.outputTokens.toLocaleString("vi-VN")} · T: {log.totalTokens.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="border-2 border-black bg-[#C7F0D8] p-2">
                  <p className="text-[11px] font-black uppercase text-black/60">Credits</p>
                  <p className="text-sm font-black text-black">{Math.abs(Number(log.creditsCharged)).toLocaleString("vi-VN")}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
