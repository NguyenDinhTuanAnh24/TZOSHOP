"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Bell, Eye, KeyRound, Lock, Mail, Package, Search, Shield, ShieldCheck, Unlock, UserPlus, Users, Wallet } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { Skeleton } from "@/components/ui/skeleton";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { ToastMessage } from "@/components/ui/toast-message";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { AdminPagination } from "@/components/admin/admin-pagination";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lockedAt: string | null;
  _count: {
    orders: number;
    apiKeys: number;
    creditBuckets: number;
  };
  totalCredits: string;
};

interface UserDetail extends UserItem {
  totalCreditsUsed: string;
  activeBucketsCount: number;
  creditBuckets: {
    id: string;
    creditsRemaining: string;
    expiresAt: string | null;
  }[];
  orders: {
    id: string;
    product: { name: string };
    status: string;
    createdAt: string;
  }[];
  apiKeys: {
    id: string;
    name: string;
    displayKey: string;
  }[];
}

type RoleFilter = "ALL" | "ADMIN" | "USER";
type StatusFilter = "ALL" | "ACTIVE" | "LOCKED";
type TimeFilter = "ALL" | "TODAY" | "7D" | "30D";

function formatNum(value: number | string) {
  return new Intl.NumberFormat("vi-VN").format(Number(value));
}

function getInitials(name?: string, email?: string) {
  const source = (name || email || "U").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  return source[0].toUpperCase();
}

function roleBadge(role: string) {
  const normalized = role.toUpperCase();
  if (normalized === "ADMIN") return "border-violet-100 bg-violet-50 text-violet-700";
  return "border-indigo-100 bg-indigo-50 text-indigo-700";
}

function statusBadge(lockedAt: string | null) {
  if (lockedAt) return "Bị khóa|border-rose-100 bg-rose-50 text-rose-700";
  return "Đang hoạt động|border-emerald-100 bg-emerald-50 text-emerald-700";
}

function normalizeRole(role?: string | null) {
  return String(role || "").toUpperCase();
}

function UsersSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="mt-4 h-10 w-56 rounded-xl" />
        <Skeleton className="mt-3 h-5 w-[640px] max-w-full rounded-full" />
      </section>
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="mt-5 h-4 w-24 rounded-full" />
            <Skeleton className="mt-3 h-8 w-28 rounded-xl" />
            <Skeleton className="mt-3 h-4 w-40 rounded-full" />
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <Skeleton className="h-11 w-full rounded-xl" />
      </section>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [manageUser, setManageUser] = useState<UserItem | null>(null);
  const [grantUser, setGrantUser] = useState<UserItem | null>(null);
  const [notifyUser, setNotifyUser] = useState<UserItem | null>(null);
  const { toast, showToast, clearToast } = useToast(3500);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        role: roleFilter,
        status: statusFilter,
      });
      const [usersRes, meRes] = await Promise.all([fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" }), fetch("/api/profile", { cache: "no-store" })]);

      const usersContentType = usersRes.headers.get("content-type") || "";
      let usersJson: Record<string, unknown> | null = null;
      if (usersContentType.includes("application/json")) {
        usersJson = await usersRes.json().catch(() => null);
      } else {
        const text = await usersRes.text();
        console.error("Admin users API returned non-JSON:", text.slice(0, 500));
        throw new Error("API người dùng không trả về JSON");
      }

      let meJson: Record<string, unknown> | null = null;
      const meContentType = meRes.headers.get("content-type") || "";
      if (meContentType.includes("application/json")) {
        meJson = await meRes.json().catch(() => null);
      }
      if (!usersRes.ok) {
        console.error("Admin users fetch failed:", usersJson);
        throw new Error((usersJson?.detail as string) || (usersJson?.error as string) || "Không thể tải danh sách người dùng");
      }
      setUsers(((usersJson?.items as UserItem[]) || (usersJson?.users as UserItem[]) || []));
      setPagination((usersJson?.pagination as { page: number; pageSize: number; total: number; totalPages: number }) || null);
      if (meJson?.success) setMe(meJson.data as { id: string; role?: string });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Vui lòng thử lại sau ít phút.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, roleFilter, statusFilter]);

  const fetchUserDetail = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
        const result = await res.json();
        if (res.ok && result.success) {
          setDetailUser(result.data);
          return;
        }
        showToast("Không thể tải chi tiết người dùng.", "error");
      } catch {
        showToast("Lỗi kết nối.", "error");
      }
    },
    [showToast]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const now = new Date();
    return users
      .filter((u) => {
        const kw = search.trim().toLowerCase();
        if (!kw) return true;
        return u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw) || u.id.toLowerCase().includes(kw);
      })
      .filter((u) => (roleFilter === "ALL" ? true : roleFilter === "ADMIN" ? normalizeRole(u.role) === "ADMIN" : normalizeRole(u.role) !== "ADMIN"))
      .filter((u) => (statusFilter === "ALL" ? true : statusFilter === "ACTIVE" ? !u.lockedAt : Boolean(u.lockedAt)))
      .filter((u) => {
        if (timeFilter === "ALL") return true;
        const createdAt = new Date(u.createdAt).getTime();
        if (timeFilter === "TODAY") return createdAt >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (timeFilter === "7D") return createdAt >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
        return createdAt >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
      });
  }, [users, search, roleFilter, statusFilter, timeFilter]);

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  const summary = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => normalizeRole(u.role) === "ADMIN").length;
    const active = users.filter((u) => !u.lockedAt).length;
    const locked = users.filter((u) => Boolean(u.lockedAt)).length;
    const newUsers = users.filter((u) => nowMs - new Date(u.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000).length;
    return { total, admins, active, locked, newUsers };
  }, [nowMs, users]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (me?.id === userId) return showToast("Bạn không thể tự thay đổi quyền của chính mình.", "error");
    askConfirm({
      title: "Cập nhật quyền người dùng?",
      description: "Hành động này sẽ thay đổi quyền truy cập của tài khoản trong hệ thống.",
      confirmLabel: "Cập nhật quyền",
      type: "warning",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/users/${userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
        const result = await res.json();
        if (res.ok && result.success) {
          showToast("Đã cập nhật quyền người dùng.", "success");
          setManageUser(null);
          void fetchUsers();
        } else showToast(result?.message || "Cập nhật quyền thất bại.", "error");
      },
    });
  };

  const handleUpdateStatus = async (userId: string, action: "LOCK" | "UNLOCK") => {
    if (me?.id === userId) return showToast("Không thể khóa tài khoản đang đăng nhập.", "error");
    askConfirm({
      title: action === "LOCK" ? "Khóa tài khoản này?" : "Mở khóa tài khoản?",
      description: action === "LOCK" ? "Người dùng có thể không tiếp tục sử dụng một số tính năng sau khi tài khoản bị khóa." : "Người dùng sẽ có thể tiếp tục sử dụng tài khoản sau khi được mở khóa.",
      confirmLabel: action === "LOCK" ? "Khóa tài khoản" : "Mở khóa",
      type: action === "LOCK" ? "danger" : "success",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/users/${userId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
        const result = await res.json();
        if (res.ok && result.success) {
          showToast(result.message || "Cập nhật trạng thái thành công.", "success");
          setManageUser(null);
          void fetchUsers();
        } else showToast(result?.message || "Cập nhật trạng thái thất bại.", "error");
      },
    });
  };

  const handleGrantCredits = async (userId: string, data: { note: string; productId: string }) => {
    const res = await fetch(`/api/admin/users/${userId}/grant-credits`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast("Đã cấp credits thành công.", "success");
      setGrantUser(null);
      void fetchUsers();
    } else showToast(result?.message || "Không thể cấp credits.", "error");
  };

  const handleSendNotification = async (userId: string, data: { title: string; message: string; type: string }) => {
    const res = await fetch(`/api/admin/users/${userId}/notify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast("Đã gửi thông báo.", "success");
      setNotifyUser(null);
    } else showToast(result?.message || "Không thể gửi thông báo.", "error");
  };

  if (isLoading && !users.length) return <UsersSkeleton />;

  if (loadError && !users.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải danh sách người dùng</h2>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <button type="button" onClick={() => void fetchUsers()} className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
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
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Quản trị người dùng</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Người dùng</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Quản lý tài khoản, vai trò, trạng thái hoạt động và lịch sử sử dụng credits của người dùng.</p>
          </div>
        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng người dùng", value: formatNum(summary.total), desc: "Tổng tài khoản hiện có", icon: Users, iconClassName: "bg-indigo-50 text-indigo-700" },
          { label: "Người dùng mới", value: formatNum(summary.newUsers), desc: "Đăng ký trong 30 ngày", icon: UserPlus, iconClassName: "bg-emerald-50 text-emerald-700" },
          { label: "Admin", value: formatNum(summary.admins), desc: "Tài khoản quản trị", icon: ShieldCheck, iconClassName: "bg-violet-50 text-violet-700" },
          { label: "Tài khoản hoạt động", value: formatNum(summary.active), desc: `Đang mở khóa - Khóa: ${formatNum(summary.locked)}`, icon: Wallet, iconClassName: "bg-sky-50 text-sky-700" },
        ].map((card, i) => (
          <TextFadeInUp key={card.label} delay={Math.min(i * 0.05, 0.25)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", card.iconClassName)}><card.icon className="h-5 w-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950">{card.value}</p>
            <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm theo tên, email hoặc ID người dùng..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as RoleFilter); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"><option value="ALL">Tất cả vai trò</option><option value="USER">User</option><option value="ADMIN">Admin</option></select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Bị khóa</option></select>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as TimeFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"><option value="ALL">Tất cả</option><option value="TODAY">Hôm nay</option><option value="7D">7 ngày</option><option value="30D">30 ngày</option></select>
        </div>
      </TextFadeInUp>

      {filteredUsers.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Users className="h-7 w-7" /></div>
          <h2 className="text-2xl font-extrabold text-slate-950">Chưa có người dùng</h2>
          <p className="mt-2 text-sm text-slate-600">Người dùng mới sẽ hiển thị tại đây sau khi đăng ký tài khoản.</p>
        </section>
      ) : (
        <>
          <TextFadeInUp as="section" delay={0.08} className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Gói credits</th><th className="px-4 py-3">API keys</th><th className="px-4 py-3">Tổng đã chi</th><th className="px-4 py-3">Ngày tham gia</th><th className="px-4 py-3">Hành động</th></tr></thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const [statusText, statusClass] = statusBadge(user.lockedAt).split("|");
                  const isAdmin = normalizeRole(user.role) === "ADMIN";
                  const isSelf = me?.id === user.id;
                  return (
                    <tr key={user.id} className="border-t border-slate-100 transition hover:bg-indigo-50/30">
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{getInitials(user.name, user.email)}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{user.name || "Tài khoản"}</p><p className="truncate text-sm text-slate-600">{user.email}</p><p className="truncate text-xs text-slate-400">{user.id}</p></div></div></td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", roleBadge(user.role))}>{isAdmin ? "Admin" : "User"}</span></td>
                      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass)}>{statusText}</span></td>
                      <td className="px-4 py-3 text-slate-700">{formatNum(user._count.creditBuckets)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatNum(user._count.apiKeys)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatNum(user.totalCredits)}</td>
                      <td className="px-4 py-3 text-slate-600">{format(new Date(user.createdAt), "dd/MM/yyyy")}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => void fetchUserDetail(user.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => setManageUser(user)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Shield className="h-4 w-4" /></button>{user.lockedAt ? <button type="button" disabled={isSelf} onClick={() => void handleUpdateStatus(user.id, "UNLOCK")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-50"><Unlock className="h-4 w-4" /></button> : <button type="button" disabled={isSelf} onClick={() => void handleUpdateStatus(user.id, "LOCK")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"><Lock className="h-4 w-4" /></button>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TextFadeInUp>
          <TextFadeInUp as="section" delay={0.12} className="space-y-4 lg:hidden">
            {filteredUsers.map((user) => {
              const [statusText, statusClass] = statusBadge(user.lockedAt).split("|");
              const isAdmin = normalizeRole(user.role) === "ADMIN";
              const isSelf = me?.id === user.id;
              return (
                <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{getInitials(user.name, user.email)}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{user.name || "Tài khoản"}</p><p className="truncate text-sm text-slate-600">{user.email}</p></div></div><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", roleBadge(user.role))}>{isAdmin ? "Admin" : "User"}</span></div>
                  <div className="mt-3"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass)}>{statusText}</span></div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><p className="text-slate-600">Gói credits: <span className="font-semibold text-slate-900">{formatNum(user._count.creditBuckets)}</span></p><p className="text-slate-600">API keys: <span className="font-semibold text-slate-900">{formatNum(user._count.apiKeys)}</span></p><p className="text-slate-600">Tổng đã chi: <span className="font-semibold text-slate-900">{formatNum(user.totalCredits)}</span></p><p className="text-slate-600">Ngày tham gia: <span className="font-semibold text-slate-900">{format(new Date(user.createdAt), "dd/MM/yyyy")}</span></p></div>
                  <div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => void fetchUserDetail(user.id)} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Chi tiết</button><button type="button" onClick={() => setManageUser(user)} className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Quyền</button><button type="button" disabled={isSelf} onClick={() => void handleUpdateStatus(user.id, user.lockedAt ? "UNLOCK" : "LOCK")} className={cn("inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition disabled:opacity-50", user.lockedAt ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700")}>{user.lockedAt ? "Mở khóa" : "Khóa"}</button></div>
                </article>
              );
            })}
          </TextFadeInUp>
        </>
      )}

      {pagination && pagination.total > 0 ? (
        <AdminPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : null}

      {detailUser ? <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} onOpenManage={(target) => { setDetailUser(null); setManageUser(target); }} /> : null}
      {manageUser ? <AccountManagementModal user={manageUser} onClose={() => setManageUser(null)} onUpdateRole={handleUpdateRole} onUpdateStatus={handleUpdateStatus} onOpenGrant={() => { setManageUser(null); setGrantUser(manageUser); }} onOpenNotify={() => { setManageUser(null); setNotifyUser(manageUser); }} /> : null}
      {grantUser ? <GrantCreditsModal user={grantUser} onClose={() => setGrantUser(null)} onConfirm={handleGrantCredits} /> : null}
      {notifyUser ? <NotifyUserModal user={notifyUser} onClose={() => setNotifyUser(null)} onConfirm={handleSendNotification} /> : null}
      {confirmState ? <ConfirmDialog open={Boolean(confirmState)} title={confirmState.title} description={confirmState.description} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} type={confirmState.type} isLoading={isConfirming} onConfirm={handleConfirm} onCancel={closeConfirm} /> : null}
      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </div>
  );
}

function UserDetailModal({ user, onClose, onOpenManage }: { user: UserDetail; onClose: () => void; onOpenManage: (user: UserItem) => void }) {
  const [statusText, statusClass] = statusBadge(user.lockedAt).split("|");
  return (
    <Modal open onClose={onClose} title="Chi tiết người dùng" description="Thông tin tài khoản, credits, API keys và đơn hàng gần đây." maxWidthClassName="max-w-3xl" footer={<><button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Đóng</button><CosmicButton onClick={() => onOpenManage(user)}>Quản lý tài khoản</CosmicButton></>}>
      <div className="flex items-start gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-lg font-bold text-indigo-700">{getInitials(user.name, user.email)}</div><div className="min-w-0 flex-1"><h3 className="truncate text-xl font-extrabold text-slate-950">{user.name || "Tài khoản"}</h3><p className="truncate text-sm text-slate-600">{user.email}</p><div className="mt-2 flex flex-wrap gap-2"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", roleBadge(user.role))}>{normalizeRole(user.role) === "ADMIN" ? "Admin" : "User"}</span><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass)}>{statusText}</span></div></div></div>
      <div className="grid gap-3 md:grid-cols-2">
        <InfoBox label="Ngày tham gia" value={format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")} />
        <InfoBox label="Gói credits" value={formatNum(user._count.creditBuckets)} />
        <InfoBox label="API keys" value={formatNum(user._count.apiKeys)} />
        <InfoBox label="Tổng credits" value={formatNum(user.totalCredits)} />
        <InfoBox label="Credits đã dùng" value={formatNum(user.totalCreditsUsed)} />
        <InfoBox label="Bucket đang hoạt động" value={formatNum(user.activeBucketsCount)} />
      </div>
    </Modal>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>;
}

function AccountManagementModal({ user, onClose, onUpdateRole, onUpdateStatus, onOpenGrant, onOpenNotify }: { user: UserItem; onClose: () => void; onUpdateRole: (userId: string, role: string) => void; onUpdateStatus: (userId: string, action: "LOCK" | "UNLOCK") => void; onOpenGrant: () => void; onOpenNotify: () => void; }) {
  const isAdmin = normalizeRole(user.role) === "ADMIN";
  const isLocked = Boolean(user.lockedAt);
  return (
    <Modal open onClose={onClose} title="Quản lý tài khoản" description="Thay đổi quyền truy cập và trạng thái tài khoản người dùng." maxWidthClassName="max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><p className="font-semibold text-slate-900">{user.name || "Tài khoản"}</p><p className="text-sm text-slate-600">{user.email}</p></div>
      <div className="grid gap-3">
        <button type="button" onClick={() => onUpdateRole(user.id, isAdmin ? "USER" : "ADMIN")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Shield className="h-4 w-4" />{isAdmin ? "Gỡ quyền admin" : "Đặt làm admin"}</button>
        <button type="button" onClick={() => onUpdateStatus(user.id, isLocked ? "UNLOCK" : "LOCK")} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition", isLocked ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100")}>{isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}</button>
        <button type="button" onClick={onOpenGrant} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Package className="h-4 w-4" />Cập nhật credits thủ công</button>
        <button type="button" onClick={onOpenNotify} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Bell className="h-4 w-4" />Gửi thông báo</button>
        <div className="grid grid-cols-2 gap-3"><Link href={`/admin/orders?userId=${user.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Package className="h-4 w-4" />Xem đơn hàng</Link><Link href={`/admin/api-keys?userId=${user.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><KeyRound className="h-4 w-4" />Xem API keys</Link></div>
      </div>
    </Modal>
  );
}

type GrantPlanOption = { id: string; name: string; slug: string; apiFamily: string; credits: string; durationDays: number | null };

function GrantCreditsModal({ user, onClose, onConfirm }: { user: UserItem; onClose: () => void; onConfirm: (userId: string, data: { note: string; productId: string }) => void; }) {
  const [note, setNote] = useState("");
  const [productId, setProductId] = useState("");
  const [plans, setPlans] = useState<GrantPlanOption[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const isValid = Boolean(productId);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const res = await fetch('/api/plans', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) return;
        const activePlans = ((json?.data ?? []) as GrantPlanOption[]).filter((p) => Boolean(p?.id));
        setPlans(activePlans);
        if (activePlans.length > 0) {
          setProductId(activePlans[0].id);
        }
      } catch {
        setPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    const timer = window.setTimeout(() => void fetchPlans(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Modal open onClose={onClose} title="Cập nhật credits thủ công" description={`Tài khoản: ${user.name || user.email}`} maxWidthClassName="max-w-lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gói nguồn</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            {isLoadingPlans && <option value="">Đang tải danh sách gói...</option>}
            {!isLoadingPlans && plans.length === 0 && <option value="">Không có gói nào khả dụng</option>}
            {plans.map((plan) => {
              const familyText = plan.slug.startsWith("all_models_") ? "All Models" : plan.apiFamily;
              const creditsText = new Intl.NumberFormat('vi-VN').format(Number(plan.credits));
              const daysText = plan.durationDays ? `${plan.durationDays} ngày` : "vĩnh viễn";
              return (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({familyText} - {creditsText} Credits - {daysText})
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ghi chú nội bộ</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: bù credits theo ticket #123..." className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        </div>

        <CosmicButton onClick={() => onConfirm(user.id, { note, productId })} disabled={!isValid} className="w-full justify-center">Xác nhận cấp credits</CosmicButton>
      </div>
    </Modal>
  );
}

function NotifyUserModal({ user, onClose, onConfirm }: { user: UserItem; onClose: () => void; onConfirm: (userId: string, data: { title: string; message: string; type: string }) => void; }) {
  const [title, setTitle] = useState("Thông báo từ TzoShop");
  const [message, setMessage] = useState("");
  return (
    <Modal open onClose={onClose} title="Gửi thông báo" description={`Người nhận: ${user.name || user.email}`} maxWidthClassName="max-w-lg">
      <div className="space-y-4">
        <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
        <CosmicButton onClick={() => onConfirm(user.id, { title, message, type: "INFO" })} className="w-full justify-center">Gửi thông báo</CosmicButton>
      </div>
    </Modal>
  );
}

