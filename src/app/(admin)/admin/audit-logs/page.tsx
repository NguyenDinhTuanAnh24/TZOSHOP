"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Eye,
  ScrollText,
  Search,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

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

type TimeFilter = "ALL" | "TODAY" | "7D" | "30D" | "MONTH";
type SeverityFilter = "ALL" | "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "CRITICAL";
type SortFilter = "NEWEST" | "OLDEST" | "SEVERITY";

const auditTableHeaders = [
  { key: "time", label: "Thời gian" },
  { key: "actor", label: "Người thực hiện" },
  { key: "module", label: "Module" },
  { key: "action", label: "Hành động" },
  { key: "severity", label: "Mức độ" },
  { key: "content", label: "Nội dung" },
  { key: "device", label: "IP / Thiết bị" },
  { key: "actions", label: "Thao tác" },
];

const ACTION_LABELS: Record<string, string> = {
  ADMIN_VIEW_USER_DETAIL: "Xem chi tiết người dùng",
  ADMIN_MANAGE_USER: "Quản lý tài khoản người dùng",
  ADMIN_GRANT_ROLE: "Cấp quyền tài khoản",
  ADMIN_REVOKE_ROLE: "Thu hồi quyền tài khoản",
  ADMIN_LOCK_USER: "Khóa tài khoản",
  ADMIN_UNLOCK_USER: "Mở khóa tài khoản",
  ADMIN_CREATE_PRODUCT: "Tạo gói credits",
  ADMIN_UPDATE_PRODUCT: "Cập nhật gói credits",
  ADMIN_DISABLE_PRODUCT: "Tắt gói credits",
  ADMIN_ENABLE_PRODUCT: "Bật gói credits",
  ADMIN_CREATE_COUPON: "Tạo mã giảm giá",
  ADMIN_UPDATE_COUPON: "Cập nhật mã giảm giá",
  ADMIN_DISABLE_COUPON: "Tắt mã giảm giá",
  ADMIN_ENABLE_COUPON: "Bật mã giảm giá",
  ADMIN_UPDATE_PROVIDER: "Cập nhật provider",
  ADMIN_UPDATE_MODEL: "Cập nhật model",
  ADMIN_REPLY_TICKET: "Phản hồi ticket",
  ADMIN_UPDATE_TICKET: "Cập nhật ticket",
  ADMIN_EXPORT_CSV: "Xuất CSV",
};

const ENTITY_LABELS: Record<string, string> = {
  AUTH: "Auth",
  USER: "User",
  ORDER: "Order",
  PAYMENT: "Payment",
  PRODUCT: "Product",
  COUPON: "Coupon",
  MODEL: "Model",
  PROVIDER: "Provider",
  API_KEY: "API Key",
  USAGE: "Usage",
  SUPPORT_TICKET: "Support",
  SYSTEM: "System",
};

const SENSITIVE_KEYS = ["password", "token", "secret", "apikey", "api_key", "authorization", "service_role", "database_url"];

function actionLabel(action: string) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const fallback = action.replace(/^ADMIN_/, "").replaceAll("_", " ").toLowerCase();
  return fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : "Hành động quản trị";
}

function entityLabel(entityType: string) {
  return ENTITY_LABELS[entityType] || entityType || "Khác";
}

function moduleBadgeClass(entityType: string) {
  const e = entityType.toUpperCase();
  if (e.includes("AUTH")) return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (e.includes("USER")) return "border-sky-100 bg-sky-50 text-sky-700";
  if (e.includes("ORDER")) return "border-violet-100 bg-violet-50 text-violet-700";
  if (e.includes("PAYMENT")) return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (e.includes("PRODUCT")) return "border-orange-100 bg-orange-50 text-orange-700";
  if (e.includes("COUPON")) return "border-rose-100 bg-rose-50 text-rose-700";
  if (e.includes("PROVIDER")) return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function detectSeverity(action: string): Exclude<SeverityFilter, "ALL"> {
  const a = action.toUpperCase();
  if (a.includes("DELETE") || a.includes("REVOKE") || a.includes("LOCK")) return "CRITICAL";
  if (a.includes("DISABLE")) return "ERROR";
  if (a.includes("UPDATE")) return "WARNING";
  if (a.includes("CREATE") || a.includes("ENABLE") || a.includes("UNLOCK") || a.includes("REPLY")) return "SUCCESS";
  return "INFO";
}

function severityLabel(severity: Exclude<SeverityFilter, "ALL">) {
  if (severity === "INFO") return "Thông tin";
  if (severity === "SUCCESS") return "Thành công";
  if (severity === "WARNING") return "Cảnh báo";
  if (severity === "ERROR") return "Lỗi";
  return "Nghiêm trọng";
}

function severityClass(severity: Exclude<SeverityFilter, "ALL">) {
  if (severity === "INFO") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (severity === "SUCCESS") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (severity === "WARNING") return "border-amber-100 bg-amber-50 text-amber-700";
  if (severity === "ERROR") return "border-rose-100 bg-rose-50 text-rose-700";
  return "border-red-100 bg-red-50 text-red-700";
}

function maskSensitive(data: unknown): unknown {
  if (Array.isArray(data)) return data.map((v) => maskSensitive(v));
  if (!data || typeof data !== "object") return data;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const lower = k.toLowerCase();
    out[k] = SENSITIVE_KEYS.some((needle) => lower.includes(needle)) ? "***" : maskSensitive(v);
  }
  return out;
}

function AuditSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="mt-4 h-10 w-64 rounded-xl" />
        <Skeleton className="mt-3 h-5 w-[640px] max-w-full rounded-full" />
      </section>
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="mt-5 h-4 w-24 rounded-full" />
            <Skeleton className="mt-3 h-8 w-20 rounded-xl" />
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
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("ALL");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterSeverity, setFilterSeverity] = useState<SeverityFilter>("ALL");
  const [filterTime, setFilterTime] = useState<TimeFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortFilter>("NEWEST");

  const { toast, showToast, clearToast } = useToast(3000);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const res = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setIsError(true);
        showToast(result?.message || "Không thể tải audit log", "error");
        return;
      }
      setLogs(result.data || []);
    } catch {
      setIsError(true);
      showToast("Không thể tải audit log", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchLogs(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  const modules = useMemo(() => Array.from(new Set(logs.map((l) => l.entityType).filter(Boolean))), [logs]);
  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action).filter(Boolean))), [logs]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const items = logs.filter((log) => {
      const keyword = search.trim().toLowerCase();
      const severity = detectSeverity(log.action);
      const matchesSearch =
        !keyword ||
        log.action.toLowerCase().includes(keyword) ||
        log.adminUser?.email?.toLowerCase().includes(keyword) ||
        log.adminUser?.name?.toLowerCase().includes(keyword) ||
        log.entityId.toLowerCase().includes(keyword);
      const matchesModule = filterModule === "ALL" || log.entityType === filterModule;
      const matchesAction = filterAction === "ALL" || log.action === filterAction;
      const matchesSeverity = filterSeverity === "ALL" || severity === filterSeverity;
      let matchesTime = true;
      const createdAt = new Date(log.createdAt);
      if (filterTime === "TODAY") {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        matchesTime = createdAt >= start;
      } else if (filterTime === "7D") matchesTime = createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (filterTime === "30D") matchesTime = createdAt >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (filterTime === "MONTH") matchesTime = createdAt >= startMonth;
      return matchesSearch && matchesModule && matchesAction && matchesSeverity && matchesTime;
    });

    if (sortBy === "OLDEST") items.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else if (sortBy === "SEVERITY") {
      const rank = { CRITICAL: 5, ERROR: 4, WARNING: 3, SUCCESS: 2, INFO: 1 };
      items.sort((a, b) => rank[detectSeverity(b.action)] - rank[detectSeverity(a.action)]);
    } else items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return items;
  }, [logs, search, filterModule, filterAction, filterSeverity, filterTime, sortBy]);

  const summary = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayCount = logs.filter((l) => format(new Date(l.createdAt), "yyyy-MM-dd") === today).length;
    const warnings = logs.filter((l) => detectSeverity(l.action) === "WARNING").length;
    const critical = logs.filter((l) => detectSeverity(l.action) === "CRITICAL").length;
    return { total: logs.length, todayCount, warnings, critical };
  }, [logs]);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    showToast("Đã sao chép", "success");
  };

  if (isLoading && logs.length === 0) return <AuditSkeleton />;

  if (isError && logs.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải audit log</h2>
        <p className="mt-2 text-sm text-slate-600">Vui lòng thử lại sau ít phút.</p>
        <button
          type="button"
          onClick={() => void fetchLogs()}
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
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Nhật ký quản trị</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Audit Log</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Theo dõi các hành động quan trọng trong hệ thống, bao gồm thay đổi dữ liệu, đăng nhập, thanh toán và cấu hình quản trị.</p>
          </div>

        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng log", value: summary.total, icon: ScrollText, cls: "bg-indigo-50 text-indigo-700" },
          { label: "Hành động hôm nay", value: summary.todayCount, icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
          { label: "Cảnh báo", value: summary.warnings, icon: AlertTriangle, cls: "bg-amber-50 text-amber-700" },
          { label: "Lỗi nghiêm trọng", value: summary.critical, icon: ShieldAlert, cls: "bg-rose-50 text-rose-700" },
        ].map((s, i) => (
          <TextFadeInUp key={s.label} delay={Math.min(i * 0.05, 0.25)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", s.cls)}><s.icon className="h-5 w-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950">{s.value.toLocaleString("vi-VN")}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo người thực hiện, hành động, module hoặc nội dung log..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="ALL">Tất cả module</option>
            {modules.map((m) => (
              <option key={m} value={m}>{entityLabel(m)}</option>
            ))}
          </select>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="ALL">Tất cả hành động</option>
            {actions.map((a) => (
              <option key={a} value={a}>{actionLabel(a)}</option>
            ))}
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as SeverityFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="ALL">Tất cả mức độ</option>
            <option value="INFO">Thông tin</option>
            <option value="SUCCESS">Thành công</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="ERROR">Lỗi</option>
            <option value="CRITICAL">Nghiêm trọng</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={filterTime} onChange={(e) => setFilterTime(e.target.value as TimeFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
              <option value="ALL">Tất cả</option>
              <option value="TODAY">Hôm nay</option>
              <option value="7D">7 ngày</option>
              <option value="30D">30 ngày</option>
              <option value="MONTH">Tháng này</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
              <option value="SEVERITY">Mức độ cao nhất</option>
            </select>
          </div>
        </div>
      </TextFadeInUp>

      <TextFadeInUp as="section" delay={0.08} className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                {auditTableHeaders.map((header) => (
                  <th key={header.key} className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">{header.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><ClipboardList className="h-7 w-7" /></div>
                      <p className="text-xl font-extrabold text-slate-950">Chưa có audit log</p>
                      <p className="mt-1 text-sm text-slate-600">Các hành động quan trọng trong hệ thống sẽ được ghi lại và hiển thị tại đây.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const severity = detectSeverity(log.action);
                  return (
                    <tr key={log.id} className="border-t border-slate-100 transition hover:bg-indigo-50/30">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-900">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</p>
                        <p className="text-xs text-slate-500">{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: vi })}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{(log.adminUser?.name || log.adminUser?.email || "S")[0].toUpperCase()}</div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{log.adminUser?.name || "System"}</p>
                            <p className="truncate text-xs text-slate-500">{log.adminUser?.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", moduleBadgeClass(log.entityType))}>{entityLabel(log.entityType)}</span></td>
                      <td className="px-4 py-4">
                        <p className="max-w-[240px] truncate text-sm font-semibold text-slate-900" title={actionLabel(log.action)}>{actionLabel(log.action)}</p>
                        <p className="max-w-[240px] truncate text-xs text-slate-500">{log.action}</p>
                      </td>
                      <td className="px-4 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", severityClass(severity))}>{severityLabel(severity)}</span></td>
                      <td className="px-4 py-4">
                        <p className="line-clamp-2 max-w-[280px] text-sm text-slate-700">{log.metadata ? JSON.stringify(maskSensitive(log.metadata)).slice(0, 140) : "Không có metadata bổ sung."}</p>
                        <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500">Entity ID: {log.entityId}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">—</td>
                      <td className="px-4 py-4">
                        <button onClick={() => setSelectedLog(log)} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]">
                          <Eye className="mr-1.5 h-4 w-4" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TextFadeInUp>

      <section className="space-y-4 lg:hidden">
        {filteredLogs.length === 0 ? (
          <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><ClipboardList className="h-7 w-7" /></div>
            <p className="text-xl font-extrabold text-slate-950">Chưa có audit log</p>
            <p className="mt-2 text-sm text-slate-600">Các hành động quan trọng trong hệ thống sẽ được ghi lại và hiển thị tại đây.</p>
          </article>
        ) : (
          filteredLogs.map((log) => {
            const severity = detectSeverity(log.action);
            return (
              <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", moduleBadgeClass(log.entityType))}>{entityLabel(log.entityType)}</span>
                  <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", severityClass(severity))}>{severityLabel(severity)}</span>
                </div>
                <p className="mt-3 font-semibold text-slate-900">{actionLabel(log.action)}</p>
                <p className="mt-1 truncate text-sm text-slate-600">{log.adminUser?.email || "System"}</p>
                <p className="mt-1 text-xs text-slate-500">{format(new Date(log.createdAt), "HH:mm:ss dd/MM/yyyy", { locale: vi })}</p>
                <p className="mt-3 line-clamp-2 text-sm text-slate-700">{log.metadata ? JSON.stringify(maskSensitive(log.metadata)).slice(0, 120) : "Không có metadata bổ sung."}</p>
                <button onClick={() => setSelectedLog(log)} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                  Chi tiết
                </button>
              </article>
            );
          })
        )}
      </section>

      <Modal
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Chi tiết Audit Log"
        description="Thông tin chi tiết của bản ghi nhật ký quản trị."
        maxWidthClassName="max-w-4xl"
        footer={
          <>
            <button type="button" onClick={() => selectedLog && void copyText(selectedLog.id)} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
              <Copy className="mr-1.5 h-4 w-4" />
              Sao chép log id
            </button>
            <button type="button" onClick={() => setSelectedLog(null)} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Đóng
            </button>
          </>
        }
      >
        {!selectedLog ? null : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoCard label="Thời gian" value={format(new Date(selectedLog.createdAt), "HH:mm:ss dd/MM/yyyy", { locale: vi })} />
              <InfoCard label="Người thực hiện" value={selectedLog.adminUser?.name || "System"} sub={selectedLog.adminUser?.email || "—"} />
              <InfoCard label="Module" value={entityLabel(selectedLog.entityType)} />
              <InfoCard label="Hành động" value={actionLabel(selectedLog.action)} sub={selectedLog.action} />
              <InfoCard label="Entity ID" value={selectedLog.entityId || "—"} />
              <InfoCard label="Mức độ" value={severityLabel(detectSeverity(selectedLog.action))} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Metadata JSON</p>
                <button
                  type="button"
                  onClick={() => void copyText(JSON.stringify(maskSensitive(selectedLog.metadata), null, 2))}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Sao chép metadata
                </button>
              </div>
              <pre className="max-h-[360px] overflow-auto rounded-b-2xl bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100">
                {selectedLog.metadata ? JSON.stringify(maskSensitive(selectedLog.metadata), null, 2) : "// Không có dữ liệu metadata bổ sung"}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 break-words text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
