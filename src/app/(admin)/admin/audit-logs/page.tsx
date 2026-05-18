"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Modal } from "@/components/ui/modal";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  adminUser: { id: string; name: string | null; email: string; role: string };
};

function prettyAction(action: string) {
  return action.replace(/^ADMIN_/, "").replaceAll("_", " ").toLowerCase();
}

function metadataText(metadata: Record<string, unknown> | null, key: string) {
  if (!metadata) return "-";
  const value = metadata[key];
  if (typeof value === "string" && value.trim()) return value;
  return "-";
}

export default function AuditLogsPage() {
  const { toast, showToast, clearToast } = useToast(3000);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [module, setModule] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [actor, setActor] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (module !== "ALL") params.set("module", module);
      if (action !== "ALL") params.set("action", action);
      if (actor !== "ALL") params.set("actor", actor);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result?.message || "Không thể tải audit logs");
      setLogs(result.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể tải audit logs", "error");
    } finally {
      setLoading(false);
    }
  }, [search, module, action, actor, from, to, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchLogs(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  const modules = useMemo(() => Array.from(new Set(logs.map((l) => l.entityType))), [logs]);
  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs]);
  const actors = useMemo(() => Array.from(new Map(logs.map((l) => [l.adminUser.id, l.adminUser])).values()), [logs]);

  return (
    <main className="space-y-6">
      <TextFadeInUp as="section" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-950">Audit Logs</h1>
        <p className="mt-2 text-sm text-slate-600">Theo dõi hành động quan trọng: Auth, Orders, Products, API Keys, Credits, Coupons, Support, Admin, System.</p>
      </TextFadeInUp>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="h-11 rounded-xl border border-slate-200 px-3 text-sm lg:col-span-2" />
          <select value={module} onChange={(e) => setModule(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="ALL">Tất cả module</option>{modules.map((m) => <option key={`m-${m}`} value={m}>{m}</option>)}</select>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="ALL">Tất cả hành động</option>{actions.map((a) => <option key={`a-${a}`} value={a}>{a}</option>)}</select>
          <select value={actor} onChange={(e) => setActor(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="ALL">Tất cả người thực hiện</option>{actors.map((u) => <option key={`u-${u.id}`} value={u.id}>{u.name || u.email}</option>)}</select>
          <div className="grid grid-cols-2 gap-2"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm" /></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px]">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">User agent</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-600">Đang tải dữ liệu...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-600">Chưa có audit logs.</td></tr>
              ) : (
                logs.map((log) => {
                  const status = metadataText(log.metadata, "status");
                  const description = metadataText(log.metadata, "description");
                  return (
                    <tr key={log.id} className="border-t border-slate-100 text-sm text-slate-700">
                      <td className="px-4 py-3 whitespace-nowrap">{format(new Date(log.createdAt), "HH:mm:ss dd/MM/yyyy", { locale: vi })}</td>
                      <td className="px-4 py-3">{log.adminUser.name || log.adminUser.email}</td>
                      <td className="px-4 py-3">{log.adminUser.role}</td>
                      <td className="px-4 py-3">{log.entityType}</td>
                      <td className="px-4 py-3"><span className="font-semibold">{prettyAction(log.action)}</span></td>
                      <td className="px-4 py-3">{description !== "-" ? description : `Entity: ${log.entityId}`}</td>
                      <td className="px-4 py-3">{metadataText(log.metadata, "ip")}</td>
                      <td className="px-4 py-3 max-w-[240px] truncate">{metadataText(log.metadata, "userAgent")}</td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-semibold", status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700")}>{status === "-" ? "N/A" : status}</span></td>
                      <td className="px-4 py-3"><button onClick={() => setSelected(log)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">Xem chi tiết</button></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Chi tiết log" description="Metadata của bản ghi" maxWidthClassName="max-w-3xl">
        {selected ? <pre className="max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(selected.metadata || {}, null, 2)}</pre> : null}
      </Modal>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </main>
  );
}
