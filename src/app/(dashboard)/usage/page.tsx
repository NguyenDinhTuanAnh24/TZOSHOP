"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Filter,
  History,
  KeyRound,
  LifeBuoy,
  XCircle,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { UsagePageSkeleton } from "@/components/dashboard/usage/usage-page-skeleton";

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
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filterApiKeyId, setFilterApiKeyId] = useState("all");
  const [filterModel, setFilterModel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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
      const message = "Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu lỗi tiếp tục xảy ra.";
      setLoadError(message);
      showToast("Không thể tải dữ liệu sử dụng.", "error");
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

  const filteredLogs = useMemo(() => {
    return usageLogs.filter((log) => {
      const matchKey = filterApiKeyId === "all" || log.apiKey?.id === filterApiKeyId;
      const matchModel = filterModel === "all" || log.model === filterModel;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;
      return matchKey && matchModel && matchStatus;
    });
  }, [usageLogs, filterApiKeyId, filterModel, filterStatus]);

  const stats = useMemo(() => {
    const totalRequests = filteredLogs.length;
    const creditsUsed = filteredLogs.reduce((sum, log) => sum + Number(log.creditsCharged), 0);
    const successRequests = filteredLogs.filter((log) => log.status === "SUCCESS").length;
    const failedRequests = filteredLogs.filter((log) => log.status === "FAILED").length;

    return { totalRequests, creditsUsed, successRequests, failedRequests };
  }, [filteredLogs]);

  return (
    <main className="space-y-8 pb-20 lg:space-y-10" aria-busy={isLoading}>
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[5px_5px_0px_0px_#000]">
              <ChartNoAxesColumnIncreasing className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">LỊCH SỬ SỬ DỤNG</h2>
              <p className="mt-2 text-sm font-bold text-black/70 md:text-base">
                Theo dõi lượt gọi API, credits đã dùng và trạng thái request.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Link href="/api-docs" className="w-full sm:w-auto">
              <AppButton variant="accent" className="h-12 w-full px-6 sm:w-auto">
                XEM TÀI LIỆU API
              </AppButton>
            </Link>
            <Link href="/api-keys" className="w-full sm:w-auto">
              <AppButton variant="secondary" className="h-12 w-full px-6 sm:w-auto">
                QUẢN LÝ API KEYS
              </AppButton>
            </Link>
          </div>
        </div>
      </section>

      {isLoading ? (
        <UsagePageSkeleton />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <article className="min-h-[120px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black">Tổng lượt gọi</p>
                <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_#000]">
                  <ChartNoAxesColumnIncreasing className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>
              <p className="mt-5 text-3xl font-black leading-none text-black">{stats.totalRequests.toLocaleString("vi-VN")}</p>
              <p className="mt-2 text-xs font-bold uppercase text-black/70">Tất cả request</p>
            </article>

            <article className="min-h-[120px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black">Credits đã dùng</p>
                <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#A78BFA] text-black shadow-[2px_2px_0px_0px_#000]">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-5 text-3xl font-black leading-none text-black">{new Intl.NumberFormat("vi-VN").format(stats.creditsUsed)}</p>
              <p className="mt-2 text-xs font-bold uppercase text-black/70">Đã tiêu thụ</p>
            </article>

            <article className="min-h-[120px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black">Thành công</p>
                <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#C7F0D8] text-black shadow-[2px_2px_0px_0px_#000]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-5 text-3xl font-black leading-none text-black">{stats.successRequests.toLocaleString("vi-VN")}</p>
              <p className="mt-2 text-xs font-bold uppercase text-black/70">Request hợp lệ</p>
            </article>

            <article className="min-h-[120px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] md:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black">Thất bại</p>
                <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FF6B6B] text-black shadow-[2px_2px_0px_0px_#000]">
                  <XCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-5 text-3xl font-black leading-none text-black">{stats.failedRequests.toLocaleString("vi-VN")}</p>
              <p className="mt-2 text-xs font-bold uppercase text-black/70">Cần kiểm tra</p>
            </article>
          </section>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_300px]">
            <div className="space-y-8">
              <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#C7F0D8] text-black shadow-[3px_3px_0px_0px_#000]">
                    <Filter className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-black md:text-2xl">Bộ lọc lịch sử</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wide text-black">API key</label>
                    <select
                      value={filterApiKeyId}
                      onChange={(e) => setFilterApiKeyId(e.target.value)}
                      className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                    >
                      <option value="all">Tất cả key</option>
                      {apiKeys.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wide text-black">Model</label>
                    <select
                      value={filterModel}
                      onChange={(e) => setFilterModel(e.target.value)}
                      className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                    >
                      <option value="all">Tất cả model</option>
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wide text-black">Trạng thái</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-12 w-full border-4 border-black bg-[#FFFDF5] px-4 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none transition-all focus:bg-[#FFD93D]/25 focus:shadow-[4px_4px_0px_0px_#000]"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="SUCCESS">Thành công</option>
                      <option value="FAILED">Thất bại</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <AppButton
                    variant="secondary"
                    className="h-11 px-5"
                    onClick={() => {
                      setFilterApiKeyId("all");
                      setFilterModel("all");
                      setFilterStatus("all");
                    }}
                  >
                    XÓA BỘ LỌC
                  </AppButton>
                </div>
              </section>

              <section className="space-y-5">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#C7F0D8] text-black shadow-[2px_2px_0px_0px_#000]">
                      <History className="h-4 w-4" />
                    </div>
                    <h3 className="text-xl font-black uppercase text-black md:text-2xl">Nhật ký chi tiết</h3>
                  </div>
                  <span className="inline-flex max-w-full border-2 border-black bg-[#FFFDF5] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-black/70 shadow-[2px_2px_0px_0px_#000]">
                    HIỂN THỊ {filteredLogs.length} KẾT QUẢ
                  </span>
                </header>

                {loadError ? (
                  <div className="border-4 border-black bg-[#FF6B6B] p-6 text-black shadow-[8px_8px_0px_0px_#000]">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" />
                      <div>
                        <h4 className="text-xl font-black uppercase">Không thể tải lịch sử sử dụng</h4>
                        <p className="mt-2 text-sm font-bold text-black/80">{loadError}</p>
                        <AppButton variant="secondary" className="mt-5 h-11" onClick={() => void loadData()}>
                          THỬ LẠI
                        </AppButton>
                      </div>
                    </div>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-8 text-center shadow-[8px_8px_0px_0px_#000] md:p-10">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[5px_5px_0px_0px_#000]">
                      <Activity className="h-8 w-8" />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-black md:text-2xl">Không tìm thấy nhật ký.</h4>
                    <p className="mt-3 max-w-[520px] text-sm font-bold text-black/70 md:text-base">
                      Hãy thay đổi bộ lọc hoặc bắt đầu sử dụng API để ghi nhận lịch sử.
                    </p>
                    <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                      <Link href="/api-docs" className="w-full sm:w-auto">
                        <AppButton variant="accent" className="h-12 w-full px-6 sm:w-auto">
                          XEM TÀI LIỆU API
                        </AppButton>
                      </Link>
                      <Link href="/api-keys" className="w-full sm:w-auto">
                        <AppButton variant="secondary" className="h-12 w-full px-6 sm:w-auto">
                          QUẢN LÝ API KEYS
                        </AppButton>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-hidden border-4 border-black bg-[#FFFDF5] shadow-[8px_8px_0px_0px_#000] lg:block">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                          <thead>
                            <tr className="border-b-4 border-black bg-[#FFD93D] text-left text-xs font-black uppercase tracking-wide text-black">
                              <th className="px-4 py-3">Thời gian</th>
                              <th className="px-4 py-3">API key</th>
                              <th className="px-4 py-3">Model</th>
                              <th className="px-4 py-3">Endpoint</th>
                              <th className="px-4 py-3">Credits</th>
                              <th className="px-4 py-3">Tokens</th>
                              <th className="px-4 py-3">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLogs.map((log) => (
                              <tr key={log.id} className="border-b-2 border-black font-bold text-black transition-colors hover:bg-[#FFF7CC]">
                                <td className="whitespace-nowrap px-4 py-4 text-sm">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                                <td className="px-4 py-4 text-sm">
                                  <p>{log.apiKey?.name ?? "API Key"}</p>
                                  <code className="mt-1 inline-block border-2 border-black bg-[#E9E1D0] px-2 py-1 font-mono text-xs font-bold text-black">
                                    {log.apiKey?.keyPrefix ?? "N/A"}
                                  </code>
                                </td>
                                <td className="px-4 py-4 text-sm">
                                  <code className="inline-block max-w-[220px] overflow-x-auto border-2 border-black bg-[#E9E1D0] px-2 py-1 font-mono text-xs font-bold text-black">
                                    {log.model}
                                  </code>
                                </td>
                                <td className="px-4 py-4 text-sm">
                                  <code className="inline-block max-w-[220px] overflow-x-auto border-2 border-black bg-[#E9E1D0] px-2 py-1 font-mono text-xs font-bold text-black">
                                    {log.endpoint}
                                  </code>
                                </td>
                                <td className="px-4 py-4 text-sm">{new Intl.NumberFormat("vi-VN").format(log.creditsUsed)}</td>
                                <td className="px-4 py-4 text-sm">{log.inputTokens.toLocaleString()}/{log.outputTokens.toLocaleString()}</td>
                                <td className="px-4 py-4">
                                  <StatusBadge status={log.status === "SUCCESS" ? "Thành công" : "Thất bại"} variant={log.status === "SUCCESS" ? "success" : "danger"} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:hidden">
                      {filteredLogs.map((log) => (
                        <article key={log.id} className="space-y-3 border-4 border-black bg-[#FFFDF5] p-5 shadow-[5px_5px_0px_0px_#000]">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-black">{new Date(log.createdAt).toLocaleString("vi-VN")}</p>
                            <StatusBadge status={log.status === "SUCCESS" ? "Thành công" : "Thất bại"} variant={log.status === "SUCCESS" ? "success" : "danger"} />
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <p><span className="text-xs font-black uppercase text-black/70">API key:</span> <span className="font-bold text-black">{log.apiKey?.name ?? "API Key"}</span></p>
                            <p><span className="text-xs font-black uppercase text-black/70">Model:</span></p>
                            <code className="block break-all border-2 border-black bg-[#E9E1D0] px-2 py-1 font-mono text-xs font-bold text-black">{log.model}</code>
                            <p><span className="text-xs font-black uppercase text-black/70">Endpoint:</span></p>
                            <code className="block break-all border-2 border-black bg-[#E9E1D0] px-2 py-1 font-mono text-xs font-bold text-black">{log.endpoint}</code>
                            <p><span className="text-xs font-black uppercase text-black/70">Credits:</span> <span className="font-bold text-black">{new Intl.NumberFormat("vi-VN").format(log.creditsUsed)}</span></p>
                            <p><span className="text-xs font-black uppercase text-black/70">Tokens:</span> <span className="font-bold text-black">{log.inputTokens.toLocaleString()}/{log.outputTokens.toLocaleString()}</span></p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#C7F0D8] text-black shadow-[2px_2px_0px_0px_#000]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <h4 className="text-base font-black uppercase text-black">Kiểm tra API key</h4>
                </div>
                <p className="text-sm font-bold leading-relaxed text-black/70">
                  Sử dụng API key trong extension, IDE hoặc API client tương thích OpenAI để kiểm tra kết nối.
                </p>
                <div className="mt-5 space-y-3">
                  <Link href="/api-docs">
                    <AppButton variant="secondary" className="h-11 w-full">XEM TÀI LIỆU API</AppButton>
                  </Link>
                  <Link href="/api-keys">
                    <AppButton variant="secondary" className="h-11 w-full">QUẢN LÝ API KEYS</AppButton>
                  </Link>
                </div>
              </section>

              <section className="border-4 border-black bg-[#111827] p-5 text-[#FFFDF5] shadow-[6px_6px_0px_0px_#000]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border-2 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_#FFFDF5]">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <h4 className="text-base font-black uppercase">Bạn gặp vấn đề?</h4>
                </div>
                <p className="text-sm font-bold leading-relaxed text-[#FFFDF5]/75">
                  Nếu bạn thấy có sai lệch về credits hoặc lượt gọi, hãy liên hệ đội ngũ kỹ thuật để được hỗ trợ kiểm soát.
                </p>
                <div className="mt-5">
                  <Link href="/support">
                    <AppButton variant="accent" className="h-12 w-full shadow-[4px_4px_0px_0px_#FFFDF5]">GỬI HỖ TRỢ</AppButton>
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </main>
  );
}
