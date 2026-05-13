"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  User,
  Clock,
  Check,
  Layers,
  ShieldCheck,
  Eye,
  Copy,
  FileClock,
  ClipboardList,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

const AUDIT_ACTION_LABEL: Record<string, string> = {
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

const AUDIT_ENTITY_LABEL: Record<string, string> = {
  USER: "Người dùng",
  ORDER: "Đơn hàng",
  PRODUCT: "Gói credits",
  COUPON: "Mã giảm giá",
  API_KEY: "API key",
  PROVIDER: "Provider",
  MODEL: "Model",
  SUPPORT_TICKET: "Ticket hỗ trợ",
  SYSTEM: "Hệ thống",
};

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "accesstoken",
  "refreshtoken",
  "database_url",
  "resend_api_key",
  "payos_",
];

function mapAuditAction(action: string) {
  if (AUDIT_ACTION_LABEL[action]) return AUDIT_ACTION_LABEL[action];
  const fallback = action.replace(/^ADMIN_/, "").replaceAll("_", " ").toLowerCase();
  return fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : "Thao tác quản trị";
}

function mapAuditEntity(entity: string) {
  return AUDIT_ENTITY_LABEL[entity] || "Khác";
}

function actionBadgeClass(action: string) {
  if (action.includes("VIEW")) return "bg-[#DBEAFE]";
  if (action.includes("CREATE") || action.includes("ENABLE") || action.includes("UNLOCK")) return "bg-[#C7F0D8]";
  if (action.includes("UPDATE")) return "bg-[#FFD93D]";
  if (action.includes("DELETE") || action.includes("DISABLE") || action.includes("LOCK")) return "bg-[#FF6B6B]";
  if (action.includes("GRANT") || action.includes("REVOKE") || action.includes("ADMIN")) return "bg-[#A78BFA]";
  if (action.includes("EXPORT")) return "bg-[#E9E1D0]";
  return "bg-[#FFFDF5]";
}

function maskSensitive(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => maskSensitive(item));
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const k = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some((needle) => k.includes(needle));
      if (isSensitive) {
        result[key] = "***";
      } else {
        result[key] = maskSensitive(value);
      }
    }
    return result;
  }
  return data;
}

function AuditSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="h-8 w-56 animate-pulse bg-[#E9E1D0]" />
        <div className="mt-3 h-4 w-full max-w-[560px] animate-pulse bg-[#E9E1D0]" />
      </section>
      <section className="border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="h-20 animate-pulse bg-[#E9E1D0]" />
      </section>
      <section className="border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] md:p-5">
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-14 border-2 border-black bg-[#E9E1D0] animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("ALL");
  const [filterAction, setFilterAction] = useState("ALL");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/audit-logs");
      const result = await res.json();
      if (result.success) {
        setLogs(result.data);
      } else {
        showToast(result.message || "Lỗi khi tải dữ liệu", "error");
      }
    } catch {
      showToast("Lỗi hệ thống", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const entityTypes = Array.from(new Set(logs.map((l) => l.entityType)));
  const actions = Array.from(new Set(logs.map((l) => l.action)));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.adminUser.email.toLowerCase().includes(search.toLowerCase()) ||
      (log.adminUser.name && log.adminUser.name.toLowerCase().includes(search.toLowerCase())) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = filterEntity === "ALL" || log.entityType === filterEntity;
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    return matchesSearch && matchesEntity && matchesAction;
  });

  const logsToday = logs.filter((l) => format(new Date(l.createdAt), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length;
  const adminCount = new Set(logs.map((l) => l.adminUserId)).size;
  const entityCount = new Set(logs.map((l) => l.entityType)).size;
  const hasFilter = search || filterEntity !== "ALL" || filterAction !== "ALL";

  const brutalInput =
    "h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none";

  if (isLoading && logs.length === 0) return <AuditSkeleton />;

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <ScrollText className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">
                SECURITY LOGS
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">AUDIT LOGS</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Theo dõi thao tác quan trọng trong khu vực quản trị.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <AppButton
              onClick={fetchLogs}
              className="h-12 border-4 border-black bg-white px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              LÀM MỚI
            </AppButton>
            <div className="inline-flex h-10 items-center border-4 border-black bg-[#C7F0D8] px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
              <ShieldCheck className="mr-2 h-4 w-4" />
              SECURE LOGGING
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "TỔNG LOGS", value: logs.length, desc: "Tất cả bản ghi", bg: "bg-[#DBEAFE]", icon: ScrollText },
          { label: "HÔM NAY", value: logsToday, desc: "Bản ghi trong ngày", bg: "bg-[#C7F0D8]", icon: Clock },
          { label: "ADMIN THAO TÁC", value: adminCount, desc: "Quản trị viên hoạt động", bg: "bg-[#FFD93D]", icon: User },
          { label: "THỰC THỂ", value: entityCount, desc: "Đối tượng bị tác động", bg: "bg-[#A78BFA]", icon: Layers },
        ].map((s) => (
          <article key={s.label} className="min-h-[110px] border-4 border-black bg-[#FFFDF5] p-4 shadow-[5px_5px_0px_0px_#000]">
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${s.bg}`}>
                <s.icon className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/70">{s.label}</p>
                <p className="mt-1 text-2xl font-black text-black">{s.value.toLocaleString("vi-VN")}</p>
                <p className="text-sm font-bold text-black/60">{s.desc}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4 border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_220px_220px_auto]">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60" />
              <input
                type="text"
                placeholder="Tìm theo admin, hành động hoặc ID thực thể..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(brutalInput, "pl-10")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Thực thể</label>
            <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả thực thể</option>
              {entityTypes.map((e) => (
                <option key={e} value={e}>
                  {mapAuditEntity(e)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-black/60">Hành động</label>
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả hành động</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {mapAuditAction(a)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <AppButton
              onClick={() => {
                setSearch("");
                setFilterEntity("ALL");
                setFilterAction("ALL");
              }}
              className="h-12 w-full border-4 border-black bg-[#FFD93D] px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
            >
              XÓA LỌC
            </AppButton>
          </div>
        </div>
      </section>

      <section className="hidden overflow-hidden border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] lg:block md:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b-4 border-black bg-[#FFFDF5]">
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Thời gian</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Quản trị viên</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Hành động</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Thực thể</th>
                <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Mã thực thể</th>
                <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.14em] text-black/65">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
                        <FileClock className="h-7 w-7 text-black" />
                      </div>
                      <p className="text-xl font-black text-black">{hasFilter ? "KHÔNG TÌM THẤY AUDIT LOG" : "CHƯA CÓ AUDIT LOG NÀO"}</p>
                      <p className="mt-1 text-sm font-bold text-black/60">
                        {hasFilter
                          ? "Thử đổi từ khóa, thực thể hoặc hành động lọc."
                          : "Các thao tác quan trọng của quản trị viên sẽ xuất hiện tại đây."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b-2 border-black/10 align-middle transition-colors hover:bg-[#FFF8D6]">
                    <td className="px-4 py-4">
                      <p className="text-base font-black text-black">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</p>
                      <p className="text-xs font-bold text-black/60">{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: vi })}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#C7F0D8] text-sm font-black text-black shadow-[3px_3px_0px_0px_#000]">
                          {(log.adminUser?.name || log.adminUser?.email || "H")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-black">{log.adminUser?.name || "Hệ thống"}</p>
                          <p className="max-w-[220px] truncate text-xs font-bold text-black/60">{log.adminUser?.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex max-w-[260px] whitespace-normal border-2 border-black px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000]",
                          actionBadgeClass(log.action),
                        )}
                        title={log.action}
                      >
                        {mapAuditAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex border-2 border-black bg-[#FFFDF5] px-3 py-1.5 text-xs font-black text-black shadow-[2px_2px_0px_0px_#000]">
                        {mapAuditEntity(log.entityType)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <code className="inline-flex max-w-[260px] truncate border-2 border-black bg-[#FFFDF5] px-3 py-1.5 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000]" title={log.entityId}>
                        {log.entityId}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <AppButton
                        onClick={() => setSelectedLog(log)}
                        className="h-10 border-4 border-black bg-[#FFD93D] px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:bg-[#C7F0D8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        CHI TIẾT
                      </AppButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:hidden">
        {filteredLogs.length === 0 ? (
          <article className="flex min-h-[260px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-6 text-center shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
              <ClipboardList className="h-7 w-7 text-black" />
            </div>
            <p className="text-lg font-black text-black">{hasFilter ? "KHÔNG TÌM THẤY AUDIT LOG" : "CHƯA CÓ AUDIT LOG NÀO"}</p>
            <p className="mt-1 text-sm font-bold text-black/60">
              {hasFilter ? "Thử đổi từ khóa, thực thể hoặc hành động lọc." : "Các thao tác quan trọng của quản trị viên sẽ xuất hiện tại đây."}
            </p>
          </article>
        ) : (
          filteredLogs.map((log) => (
            <article key={log.id} className="space-y-4 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-black">{format(new Date(log.createdAt), "HH:mm:ss", { locale: vi })}</p>
                  <p className="text-xs font-bold text-black/60">{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: vi })}</p>
                </div>
                <span className={cn("inline-flex max-w-[180px] border-2 border-black px-3 py-1 text-[10px] font-black text-black shadow-[2px_2px_0px_0px_#000]", actionBadgeClass(log.action))}>
                  {mapAuditAction(log.action)}
                </span>
              </div>

              <div className="space-y-2">
                <p className="break-all text-sm font-bold text-black">{log.adminUser?.email || "—"}</p>
                <span className="inline-flex border-2 border-black bg-white px-2 py-1 text-[10px] font-black text-black shadow-[2px_2px_0px_0px_#000]">
                  {mapAuditEntity(log.entityType)}
                </span>
                <code className="block break-all border-2 border-black bg-white px-2 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000]">
                  {log.entityId}
                </code>
              </div>

              <AppButton
                onClick={() => setSelectedLog(log)}
                className="h-10 w-full border-4 border-black bg-[#FFD93D] px-4 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
              >
                CHI TIẾT
              </AppButton>
            </article>
          ))
        )}
      </section>

      {selectedLog && (
        <Modal open={!!selectedLog} title="CHI TIẾT AUDIT LOG" onClose={() => setSelectedLog(null)} maxWidthClassName="max-w-3xl">
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Thông tin thao tác</p>
                <p className="mt-2 text-sm font-black text-black">{mapAuditAction(selectedLog.action)}</p>
                <p className="mt-1 text-xs font-bold text-black/60">{selectedLog.action}</p>
              </div>
              <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Quản trị viên</p>
                <p className="mt-2 text-sm font-black text-black">{selectedLog.adminUser?.name || "Hệ thống"}</p>
                <p className="mt-1 break-all text-xs font-bold text-black/60">{selectedLog.adminUser?.email || "—"}</p>
              </div>
              <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Thực thể bị tác động</p>
                <p className="mt-2 text-sm font-black text-black">{mapAuditEntity(selectedLog.entityType)}</p>
                <code className="mt-2 inline-flex max-w-full break-all border-2 border-black bg-[#FFFDF5] px-2 py-1 font-mono text-xs font-bold text-black">
                  {selectedLog.entityId}
                </code>
              </div>
              <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Thời gian</p>
                <p className="mt-2 text-sm font-black text-black">{format(new Date(selectedLog.createdAt), "HH:mm:ss - dd/MM/yyyy", { locale: vi })}</p>
              </div>
            </div>

            <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Metadata</p>
                <AppButton
                  onClick={() => handleCopy(JSON.stringify(maskSensitive(selectedLog.metadata), null, 2))}
                  className="h-9 border-4 border-black bg-[#FFD93D] px-3 text-[10px] font-black uppercase text-black shadow-[3px_3px_0px_0px_#000]"
                >
                  {isCopied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                  {isCopied ? "ĐÃ SAO CHÉP" : "SAO CHÉP JSON"}
                </AppButton>
              </div>
              <pre className="max-h-[320px] overflow-x-auto border-4 border-black bg-[#06130F] p-4 text-xs font-mono text-[#C7F0D8]">
                {selectedLog.metadata
                  ? JSON.stringify(maskSensitive(selectedLog.metadata), null, 2)
                  : "// Không có dữ liệu metadata bổ sung"}
              </pre>
            </div>
          </div>
        </Modal>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}

