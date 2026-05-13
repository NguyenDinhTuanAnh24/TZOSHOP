"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Mail,
  Shield,
  User,
  Wallet,
  Calendar,
  RefreshCw,
  MoreVertical,
  Lock,
  Unlock,
  Bell,
  PlusCircle,
  Package,
  History,
  KeyIcon,
  Eye,
  X,
  ShieldCheck,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import AdminStatCard from "@/components/admin/admin-stat-card";
import { Modal } from "@/components/ui/modal";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { createPortal } from "react-dom";
import { downloadCsv } from "@/lib/download-csv";

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

function UsersSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-36 border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000]">
        <div className="h-8 w-64 bg-[#E9E1D0] animate-pulse" />
      </div>
      <div className="h-24 border-4 border-black bg-[#FFFDF5] p-4 shadow-[7px_7px_0px_0px_#000]">
        <div className="h-full w-full bg-[#E9E1D0] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 border-4 border-black bg-[#FFFDF5] p-4 shadow-[5px_5px_0px_0px_#000]">
            <div className="h-full w-full bg-[#E9E1D0] animate-pulse" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-full w-full bg-[#E9E1D0] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState<"ALL" | "ADMIN" | "USER">("ALL");

  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [manageUser, setManageUser] = useState<UserItem | null>(null);
  const [grantUser, setGrantUser] = useState<UserItem | null>(null);
  const [notifyUser, setNotifyUser] = useState<UserItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ id: string; top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const normalizeRole = (role?: string | null) => String(role ?? "").toUpperCase();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/users");
      const result = await res.json();
      if (result.success) setUsers(result.data);
    } catch (error) {
      console.error("fetchUsers failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserDetail = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        const result = await res.json();
        if (result.success) setDetailUser(result.data);
        else showToast(result.error?.message || "Không thể tải chi tiết.", "error");
      } catch (error) {
        console.error("fetchUserDetail failed:", error);
        showToast("Lỗi kết nối.", "error");
      }
    },
    [showToast],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
      void fetchUsers();
      void fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setMe(data.data);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      await downloadCsv(`/api/admin/users/export?${params.toString()}`, `tzoshop-users-${format(new Date(), "yyyy-MM-dd")}.csv`);
      showToast("Đã xuất CSV thành công.", "success");
    } catch {
      showToast("Không thể xuất CSV.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const isTargetAdmin = normalizeRole(targetUser?.role) === "ADMIN";
    if (me?.id === userId) {
      showToast("Bạn không thể tự thay đổi quyền của chính mình.", "error");
      return;
    }
    askConfirm({
      title: "Xác nhận thay đổi vai trò",
      description: `${isTargetAdmin ? "Bạn đang thao tác với tài khoản quản trị. Hãy kiểm tra kỹ trước khi tiếp tục.\n\n" : ""}Bạn có chắc chắn muốn thay đổi vai trò của người dùng này?`,
      confirmLabel: "Xác nhận đổi",
      type: newRole === "ADMIN" ? "primary" : "warning",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${userId}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
          });
          const result = await res.json();
          if (result.success) {
            showToast("Đã cập nhật quyền người dùng.", "success");
            setManageUser(null);
            void fetchUsers();
          } else showToast(result.message || "Cập nhật thất bại.", "error");
        } catch {
          showToast("Lỗi hệ thống.", "error");
        }
      },
    });
  };

  const handleUpdateStatus = async (userId: string, action: "LOCK" | "UNLOCK") => {
    const targetUser = users.find((u) => u.id === userId);
    const isTargetAdmin = normalizeRole(targetUser?.role) === "ADMIN";
    if (me?.id === userId) {
      showToast("Không thể khóa tài khoản quản trị đang đăng nhập.", "error");
      return;
    }
    askConfirm({
      title: action === "LOCK" ? "Khóa tài khoản?" : "Mở khóa tài khoản?",
      description: `${isTargetAdmin ? "Bạn đang thao tác với tài khoản quản trị. Hãy kiểm tra kỹ trước khi tiếp tục.\n\n" : ""}${action === "LOCK" ? "Người dùng sẽ không thể đăng nhập cho đến khi mở khóa lại." : "Người dùng sẽ có thể đăng nhập trở lại."}`,
      confirmLabel: action === "LOCK" ? "Khóa tài khoản" : "Mở khóa",
      type: action === "LOCK" ? "danger" : "primary",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${userId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
          const result = await res.json();
          if (result.success) {
            showToast(result.message, "success");
            setManageUser(null);
            void fetchUsers();
          } else showToast(result.message, "error");
        } catch {
          showToast("Lỗi hệ thống.", "error");
        }
      },
    });
  };

  const handleGrantCredits = async (userId: string, data: { credits: number; durationDays: number; note: string }) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đã cấp credits thành công.", "success");
        setGrantUser(null);
        void fetchUsers();
      } else showToast(result.message, "error");
    } catch {
      showToast("Lỗi hệ thống.", "error");
    }
  };

  const handleSendNotification = async (userId: string, data: { title: string; message: string; type: string }) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đã gửi thông báo.", "success");
        setNotifyUser(null);
      } else showToast(result.message, "error");
    } catch {
      showToast("Lỗi hệ thống.", "error");
    }
  };

  const filteredUsers = users
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .filter((u) => {
      const role = normalizeRole(u.role);
      if (roleTab === "ADMIN") return role === "ADMIN";
      if (roleTab === "USER") return role !== "ADMIN";
      return true;
    });

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => normalizeRole(u.role) === "ADMIN").length;
  const totalNormalUsers = users.filter((u) => normalizeRole(u.role) !== "ADMIN").length;
  const totalCreditsRemaining = users.reduce((sum, u) => sum + Number(u.totalCredits), 0);

  const summaryCards = [
    { label: "Tổng khách hàng", value: totalUsers.toLocaleString("vi-VN"), sub: "Tài khoản", icon: Users, bg: "bg-[#FFD93D]" },
    { label: "Admin", value: totalAdmins.toLocaleString("vi-VN"), sub: "Quản trị viên", icon: Shield, bg: "bg-[#C7F0D8]" },
    { label: "User thường", value: totalNormalUsers.toLocaleString("vi-VN"), sub: "Người dùng", icon: User, bg: "bg-[#93C5FD]" },
    { label: "Credits còn lại", value: new Intl.NumberFormat("vi-VN").format(totalCreditsRemaining), sub: "Tổng số dư", icon: Wallet, bg: "bg-[#A78BFA]" },
  ];

  const roleTabs = [
    { key: "ALL" as const, label: `Tất cả (${totalUsers})` },
    { key: "ADMIN" as const, label: `Admin (${totalAdmins})` },
    { key: "USER" as const, label: `User thường (${totalNormalUsers})` },
  ];

  const getEmptyStateCopy = () => {
    if (search.trim()) {
      return {
        title: "KHÔNG TÌM THẤY TÀI KHOẢN",
        description: "Thử đổi từ khóa tìm kiếm hoặc bộ lọc vai trò.",
      };
    }
    if (roleTab === "ADMIN") {
      return {
        title: "CHƯA CÓ TÀI KHOẢN ADMIN",
        description: "Các tài khoản quản trị sẽ xuất hiện tại đây.",
      };
    }
    if (roleTab === "USER") {
      return {
        title: "CHƯA CÓ USER THƯỜNG",
        description: "Người dùng đăng ký mới sẽ xuất hiện tại đây.",
      };
    }
    return {
      title: "Không tìm thấy khách hàng",
      description: "Thử đổi từ khóa tìm kiếm hoặc làm mới danh sách.",
    };
  };

  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <Users className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">USERS</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">KHÁCH HÀNG</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Theo dõi tài khoản khách hàng, đơn hàng và số dư credits.</p>
          </div>
          <div className="inline-flex h-11 items-center justify-center border-4 border-black bg-[#A78BFA] px-4 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[4px_4px_0px_0px_#000]">
            RBAC SYSTEM
          </div>
        </div>
      </section>

      <section className="border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-[520px]">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/45" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full border-4 border-black bg-white pl-12 pr-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="inline-flex h-12 w-12 items-center justify-center border-4 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000] transition-all duration-100 hover:bg-[#FFD93D]"
              title="Làm mới"
              aria-label="Làm mới"
            >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </button>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-black/60">
              Đang hiển thị <span className="text-black">{filteredUsers.length}</span> tài khoản
            </div>
            <AppButton
              onClick={handleExportCsv}
              disabled={isExporting || filteredUsers.length === 0}
              className="h-12 border-4 border-black bg-[#FFD93D] px-5 text-xs font-black uppercase text-black shadow-[5px_5px_0px_0px_#000]"
            >
              {isExporting ? "ĐANG XUẤT..." : "XUẤT CSV"}
            </AppButton>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <AdminStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            description={card.sub}
            icon={card.icon}
            iconBgClass={card.bg}
            mini
          />
        ))}
      </section>

      <section className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-3 pb-1">
          {roleTabs.map((tab) => {
            const isActive = roleTab === tab.key;
            const activeBg = tab.key === "ADMIN" ? "bg-[#C7F0D8]" : tab.key === "USER" ? "bg-[#DBEAFE]" : "bg-[#FFD93D]";
            return (
              <button
                key={tab.key}
                onClick={() => setRoleTab(tab.key)}
                className={cn(
                  "h-11 border-4 border-black px-4 text-xs font-black uppercase text-black transition-all duration-100",
                  isActive ? `${activeBg} shadow-[4px_4px_0px_0px_#000]` : "bg-white shadow-[3px_3px_0px_0px_#000]",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {isLoading ? (
        <UsersSkeleton />
      ) : filteredUsers.length === 0 ? (
        <section className="min-h-[260px] border-4 border-black bg-[#FFFDF5] p-8 shadow-[8px_8px_0px_0px_#000]">
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
              <Users className="h-7 w-7 text-black" />
            </div>
            <p className="text-lg font-black text-black">{getEmptyStateCopy().title}</p>
            <p className="mt-1 text-sm font-bold text-black/60">{getEmptyStateCopy().description}</p>
          </div>
        </section>
      ) : (
        <>
      <section className="min-w-0 hidden overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b-4 border-black bg-[#FFFDF5]">
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Khách hàng</th>
                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Vai trò</th>
                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Đơn hàng</th>
                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Số dư credits</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Ngày gia nhập</th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isAdminAccount = normalizeRole(user.role) === "ADMIN";
                    return (
                    <tr key={user.id} className={cn("border-b-2 border-black/10 align-middle transition-colors hover:bg-[#FFF8D6]", isAdminAccount && "bg-[#ECFDF5]")}>
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <Link href={`/admin/users/${user.id}`} className="flex h-12 w-12 shrink-0 items-center justify-center border-4 border-black bg-[#C7F0D8] text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_#000]">
                            {user.name[0].toUpperCase()}
                          </Link>
                          <div className="min-w-0">
                            <button onClick={() => { void fetchUserDetail(user.id); }} className="max-w-[260px] truncate text-left text-base font-black text-black">
                              {user.name}
                            </button>
                            <div className="mt-1 flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-black/50" />
                              <span className="max-w-[320px] truncate text-sm font-bold text-black/60">{user.email}</span>
                            </div>
                            {isAdminAccount && (
                              <span className="mt-1 inline-flex border-2 border-black bg-[#C7F0D8] px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                                Tài khoản quản trị
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex border-2 border-black px-2 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${isAdminAccount ? "bg-[#C7F0D8]" : "bg-[#FFFDF5]"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-lg font-black text-black">{user._count.orders}</p>
                        <p className="text-xs font-black uppercase text-black/60">đơn hàng</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 border-2 border-black bg-[#C7F0D8] px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
                          <Wallet className="h-3.5 w-3.5 text-black" />
                          <span className="text-xs font-black text-black">{new Intl.NumberFormat("vi-VN").format(Number(user.totalCredits))}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-black/60" />
                          <span className="text-sm font-bold text-black">{format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative flex items-center justify-end gap-2">
                          <button onClick={() => { void fetchUserDetail(user.id); }} className="inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFD93D]">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => setManageUser(user)} disabled={me?.id === user.id} className="inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFD93D] disabled:opacity-50">
                            <Shield className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuAnchor({ id: user.id, top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right - window.scrollX });
                            }}
                            className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_#000] hover:bg-black hover:text-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {menuAnchor?.id === user.id && mounted && createPortal(
                            <>
                              <div className="fixed inset-0 z-[9998]" onClick={() => setMenuAnchor(null)} />
                              <div
                                style={{ position: "absolute", top: `${menuAnchor.top + 8}px`, right: `${menuAnchor.right}px` }}
                                className="z-[9999] w-56 border-4 border-black bg-[#FFFDF5] p-2 shadow-[6px_6px_0px_0px_#000]"
                              >
                                <button onClick={() => { setMenuAnchor(null); void fetchUserDetail(user.id); }} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-black text-black hover:bg-[#FFD93D]"><User className="h-4 w-4" />Xem chi tiết</button>
                                <Link href={`/admin/orders?userId=${user.id}`} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-black text-black hover:bg-[#FFD93D]"><Package className="h-4 w-4" />Xem đơn hàng</Link>
                                <Link href={`/admin/api-keys?userId=${user.id}`} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-black text-black hover:bg-[#FFD93D]"><KeyIcon className="h-4 w-4" />Xem API Keys</Link>
                                <Link href={`/admin/usage?userId=${user.id}`} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-black text-black hover:bg-[#FFD93D]"><History className="h-4 w-4" />Xem Usage</Link>
                                <div className="my-1 border-t-2 border-black/20" />
                                <button onClick={() => { setMenuAnchor(null); setGrantUser(user); }} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-black text-black hover:bg-[#FFD93D]"><PlusCircle className="h-4 w-4" />Cấp credits thủ công</button>
                                <button onClick={() => { setMenuAnchor(null); setNotifyUser(user); }} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-black text-black hover:bg-[#FFD93D]"><Bell className="h-4 w-4" />Gửi thông báo</button>
                                <div className="my-1 border-t-2 border-black/20" />
                                {me?.id !== user.id && (
                                  <>
                                    {user.lockedAt ? (
                                      <button onClick={() => { setMenuAnchor(null); void handleUpdateStatus(user.id, "UNLOCK"); }} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-black text-black hover:bg-[#FFD93D]"><Unlock className="h-4 w-4" />Mở khóa tài khoản</button>
                                    ) : (
                                      <button onClick={() => { setMenuAnchor(null); void handleUpdateStatus(user.id, "LOCK"); }} className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-black text-black hover:bg-[#FFD93D]"><Lock className="h-4 w-4" />Khóa tài khoản</button>
                                    )}
                                  </>
                                )}
                              </div>
                            </>,
                            document.body,
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid min-w-0 gap-4 lg:hidden">
            {filteredUsers.map((user) => {
              const isAdminAccount = normalizeRole(user.role) === "ADMIN";
              return (
              <article key={user.id} className={cn("space-y-4 border-4 border-black p-4 shadow-[6px_6px_0px_0px_#000]", isAdminAccount ? "bg-[#ECFDF5]" : "bg-[#FFFDF5]")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border-4 border-black bg-[#C7F0D8] text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_#000]">{user.name[0].toUpperCase()}</div>
                    <div className="min-w-0">
                      <button onClick={() => { void fetchUserDetail(user.id); }} className="block max-w-[220px] truncate text-left text-base font-black text-black">{user.name}</button>
                      <p className="break-all text-sm font-bold text-black/60">{user.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex border-2 border-black px-2 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${isAdminAccount ? "bg-[#C7F0D8]" : "bg-[#FFFDF5]"}`}>{user.role}</span>
                </div>
                {isAdminAccount && (
                  <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                    Tài khoản quản trị
                  </span>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-2 border-black bg-white p-2"><p className="text-xs font-black uppercase text-black/60">Đơn hàng</p><p className="text-lg font-black text-black">{user._count.orders}</p></div>
                  <div className="border-2 border-black bg-[#C7F0D8] p-2"><p className="text-xs font-black uppercase text-black/60">Credits</p><p className="text-lg font-black text-black">{new Intl.NumberFormat("vi-VN").format(Number(user.totalCredits))}</p></div>
                  <div className="col-span-2 border-2 border-black bg-white p-2"><p className="text-xs font-black uppercase text-black/60">Ngày gia nhập</p><p className="text-sm font-bold text-black">{format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { void fetchUserDetail(user.id); }} className="h-10 border-2 border-black bg-white text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">Chi tiết</button>
                  <button onClick={() => setManageUser(user)} disabled={me?.id === user.id} className="h-10 border-2 border-black bg-white text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] disabled:opacity-50">Quyền</button>
                  <button onClick={() => setGrantUser(user)} className="h-10 border-4 border-black bg-[#FFD93D] text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">Cấp</button>
                </div>
              </article>
            )})}
          </section>
        </>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}

      {detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onOpenManage={(target) => {
            setDetailUser(null);
            setManageUser(target);
          }}
        />
      )}
      {manageUser && <AccountManagementModal user={manageUser} onClose={() => setManageUser(null)} onUpdateRole={handleUpdateRole} onUpdateStatus={handleUpdateStatus} />}
      {grantUser && <GrantCreditsModal user={grantUser} onClose={() => setGrantUser(null)} onConfirm={handleGrantCredits} />}
      {notifyUser && <NotifyUserModal user={notifyUser} onClose={() => setNotifyUser(null)} onConfirm={handleSendNotification} />}

      {confirmState && (
        <ConfirmDialog
          open={!!confirmState}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}

function BrutalModalShell({
  title,
  onClose,
  maxWidthClassName,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  maxWidthClassName: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className={`max-h-[90vh] w-full max-w-[calc(100vw-2rem)] overflow-y-auto border-4 border-black bg-[#FFFDF5] shadow-[10px_10px_0px_0px_#000] ${maxWidthClassName}`}>
        <div className="flex items-center justify-between gap-4 border-b-4 border-black px-5 py-4">
          <h2 className="text-xl font-black text-black md:text-2xl">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000] transition-all duration-100 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5 md:p-6">{children}</div>
        {footer ? <div className="flex flex-col-reverse gap-3 border-t-4 border-black p-5 sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}

function UserDetailModal({
  user,
  onClose,
  onOpenManage,
}: {
  user: UserDetail;
  onClose: () => void;
  onOpenManage: (user: UserItem) => void;
}) {
  return (
    <BrutalModalShell
      title="CHI TIẾT KHÁCH HÀNG"
      onClose={onClose}
      maxWidthClassName="max-w-[560px]"
      footer={
        <>
          <button
            onClick={onClose}
            className="h-11 border-4 border-black bg-white px-5 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            ĐÓNG
          </button>
          <button
            onClick={() => onOpenManage(user)}
            className="h-11 border-4 border-black bg-[#FFD93D] px-5 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            QUẢN LÝ TÀI KHOẢN
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#C7F0D8] text-xl font-black text-black shadow-[4px_4px_0px_0px_#000]">
          {(user.name || user.email || "U")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-black text-black">{user.name || "—"}</h3>
          <p className="break-all text-sm font-bold text-black/60">{user.email || "—"}</p>
          <span className={`mt-2 inline-flex border-2 border-black px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${user.role === "ADMIN" ? "bg-[#C7F0D8]" : "bg-[#FFD93D]"}`}>
            {user.role || "—"}
          </span>
        </div>
      </div>

      <div className="space-y-3 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-black/55">ID người dùng</p>
          <p className="break-all text-sm font-black text-black">{user.id || "—"}</p>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-black/55">Ngày tham gia</p>
          <p className="text-sm font-black text-black">{user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy HH:mm") : "—"}</p>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-black/55">Số dư credits</p>
          <p className="text-sm font-black text-black">{new Intl.NumberFormat("vi-VN").format(Number(user.totalCredits || 0))}</p>
        </div>
      </div>
    </BrutalModalShell>
  );
}

function AccountManagementModal({
  user,
  onClose,
  onUpdateRole,
  onUpdateStatus,
}: {
  user: UserItem;
  onClose: () => void;
  onUpdateRole: (userId: string, role: string) => void;
  onUpdateStatus: (userId: string, action: "LOCK" | "UNLOCK") => void;
}) {
  const isAdmin = user.role === "ADMIN";
  const isLocked = Boolean(user.lockedAt);

  return (
    <BrutalModalShell
      title="QUẢN LÝ TÀI KHOẢN"
      onClose={onClose}
      maxWidthClassName="max-w-[520px]"
      footer={
        <button
          onClick={onClose}
          className="h-11 border-4 border-black bg-white px-5 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          ĐÓNG
        </button>
      }
    >
      <div className="flex items-start gap-3 border-4 border-black bg-white p-3 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex h-12 w-12 items-center justify-center border-4 border-black bg-[#C7F0D8] text-base font-black shadow-[3px_3px_0px_0px_#000]">
          {(user.name || user.email || "U")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black text-black">{user.name || "—"}</p>
          <p className="break-all text-sm font-bold text-black/60">{user.email || "—"}</p>
          <span className={`mt-2 inline-flex border-2 border-black px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${isAdmin ? "bg-[#C7F0D8]" : "bg-[#FFD93D]"}`}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="border-4 border-black bg-[#FFD93D] p-4 text-sm font-bold text-black shadow-[4px_4px_0px_0px_#000]">
        Các thay đổi quyền hoặc trạng thái tài khoản có thể ảnh hưởng trực tiếp đến quyền truy cập của người dùng. Hãy kiểm tra kỹ trước khi xác nhận.
      </div>

      <button
        onClick={() => onUpdateRole(user.id, isAdmin ? "USER" : "ADMIN")}
        className="w-full border-4 border-black bg-[#C7F0D8] p-4 text-left shadow-[5px_5px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
            <ShieldCheck className="h-5 w-5 text-black" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black uppercase text-black">{isAdmin ? "HẠ QUYỀN USER" : "CẤP QUYỀN ADMIN"}</p>
            <p className="mt-1 text-xs font-bold text-black/70">
              {isAdmin ? "Người dùng sẽ quay về quyền USER thông thường." : "Người dùng sẽ có quyền truy cập khu vực quản trị."}
            </p>
          </div>
        </div>
      </button>

      <button
        onClick={() => onUpdateStatus(user.id, isLocked ? "UNLOCK" : "LOCK")}
        className={cn(
          "w-full border-4 border-black p-4 text-left shadow-[5px_5px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
          isLocked ? "bg-[#C7F0D8]" : "bg-[#FF6B6B]",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
            {isLocked ? <Unlock className="h-5 w-5 text-black" /> : <Lock className="h-5 w-5 text-black" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-black uppercase text-black">{isLocked ? "MỞ KHÓA TÀI KHOẢN" : "KHÓA TÀI KHOẢN"}</p>
            <p className="mt-1 text-xs font-bold text-black/70">
              {isLocked
                ? "Người dùng sẽ có thể đăng nhập và sử dụng dịch vụ trở lại."
                : "Người dùng sẽ không thể đăng nhập hoặc sử dụng dịch vụ cho đến khi được mở khóa."}
            </p>
          </div>
        </div>
      </button>
    </BrutalModalShell>
  );
}
function GrantCreditsModal({
  user,
  onClose,
  onConfirm,
}: {
  user: UserItem;
  onClose: () => void;
  onConfirm: (userId: string, data: { credits: number; durationDays: number; note: string }) => void;
}) {
  const [credits, setCredits] = useState(100000);
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");
  return (
    <Modal open={true} title="Cấp Credits thủ công" onClose={onClose}>
      <div className="space-y-4">
        <input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className={ui.input} />
        <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className={ui.input} />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} className={cn(ui.input, "min-h-[100px]")} />
        <AppButton onClick={() => onConfirm(user.id, { credits, durationDays: days, note })} className="w-full">
          Xác nhận cấp Credits
        </AppButton>
      </div>
    </Modal>
  );
}

function NotifyUserModal({
  user,
  onClose,
  onConfirm,
}: {
  user: UserItem;
  onClose: () => void;
  onConfirm: (userId: string, data: { title: string; message: string; type: string }) => void;
}) {
  const [title, setTitle] = useState("Thông báo từ TzoShop");
  const [message, setMessage] = useState("");
  const [type] = useState("INFO");
  return (
    <Modal open={true} title={`Gửi thông báo cho ${user.name}`} onClose={onClose}>
      <div className="space-y-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={ui.input} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className={cn(ui.input, "min-h-[120px]")} />
        <AppButton onClick={() => onConfirm(user.id, { title, message, type })} className="w-full">
          Gửi thông báo
        </AppButton>
      </div>
    </Modal>
  );
}
