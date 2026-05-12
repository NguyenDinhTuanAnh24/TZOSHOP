"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Mail,
  Shield,
  UserCheck,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  ShieldCheck,
  User,
  LayoutDashboard,
  ShieldAlert,
  ArrowUpDown,
  Wallet,
  Clock,
  LogOut,
  RefreshCw,
  MoreVertical,
  Lock,
  Unlock,
  Bell,
  PlusCircle,
  XCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Package,
  History,
  KeyIcon,
  ChevronDown,
  Eye,
  X,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  // Modal states
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [manageUser, setManageUser] = useState<UserItem | null>(null);
  const [grantUser, setGrantUser] = useState<UserItem | null>(null);
  const [notifyUser, setNotifyUser] = useState<UserItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ id: string, top: number, right: number } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/users");
      const result = await res.json();
      if (result.success) setUsers(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const result = await res.json();
      if (result.success) setDetailUser(result.data);
      else showToast(result.error?.message || "Không thể tải chi tiết.", "error");
    } catch (error) {
      showToast("Lỗi kết nối.", "error");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetch("/api/profile").then(res => res.json()).then(data => {
      if (data.success) setMe(data.data);
    });
  }, []);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      
      const res = await downloadCsv(
        `/api/admin/users/export?${params.toString()}`,
        `tzoshop-users-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      
      showToast("Đã xuất CSV thành công.", "success");
    } catch (error) {
      showToast("Không thể xuất CSV.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (me?.id === userId) {
      showToast("Bạn không thể tự thay đổi quyền của chính mình.", "error");
      return;
    }

    askConfirm({
      title: newRole === "ADMIN" ? "Xác nhận thay đổi vai trò" : "Hạ quyền người dùng?",
      description: newRole === "ADMIN" 
        ? "Bạn có chắc chắn muốn đổi vai trò của người dùng này sang ADMIN? Người dùng sẽ có quyền truy cập toàn bộ khu vực quản trị."
        : "Bạn có chắc chắn muốn đổi vai trò của người dùng này về USER?",
      confirmLabel: "Xác nhận đổi",
      type: newRole === "ADMIN" ? "primary" : "warning",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${userId}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole })
          });
          const result = await res.json();
          if (result.success) {
            showToast("Đã cập nhật quyền người dùng.", "success");
            setManageUser(null);
            fetchUsers();
          } else {
            showToast(result.message || "Cập nhật thất bại.", "error");
          }
        } catch (error) {
          showToast("Lỗi hệ thống.", "error");
        }
      }
    });
  };

  const handleUpdateStatus = async (userId: string, action: "LOCK" | "UNLOCK") => {
    if (me?.id === userId) {
      showToast("Bạn không thể tự khóa tài khoản của chính mình.", "error");
      return;
    }

    askConfirm({
      title: action === "LOCK" ? "Khóa tài khoản người dùng?" : "Mở khóa tài khoản?",
      description: action === "LOCK"
        ? "Người dùng sẽ không thể đăng nhập hoặc sử dụng API cho đến khi được mở khóa lại."
        : "Người dùng sẽ có thể đăng nhập và sử dụng API trở lại.",
      confirmLabel: action === "LOCK" ? "Khóa tài khoản" : "Mở khóa",
      type: action === "LOCK" ? "danger" : "primary",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${userId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action })
          });
          const result = await res.json();
          if (result.success) {
            showToast(result.message, "success");
            setManageUser(null);
            fetchUsers();
          } else {
            showToast(result.message, "error");
          }
        } catch (error) {
          showToast("Lỗi hệ thống.", "error");
        }
      }
    });
  };

  const handleGrantCredits = async (userId: string, data: any) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đã cấp credits thành công.", "success");
        setGrantUser(null);
        fetchUsers();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Lỗi hệ thống.", "error");
    }
  };

  const handleSendNotification = async (userId: string, data: any) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đã gửi thông báo.", "success");
        setNotifyUser(null);
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Lỗi hệ thống.", "error");
    }
  };


  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                         u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Khách hàng" 
        description="Theo dõi tài khoản khách hàng, đơn hàng và số dư credits."
        icon={<Users className="h-8 w-8" />}
        actions={
          <div className="flex items-center gap-3">
             <StatusBadge status="RBAC System" variant="info" />
          </div>
        }
      />

      <AppCard className="p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9690]" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(ui.input, "pl-12")}
              />
            </div>

            <IconButton 
              onClick={fetchUsers}
              isLoading={isLoading}
              variant="outline"
              title="Làm mới"
              aria-label="Làm mới"
            >
              <RefreshCw className={cn("h-5 w-5 shrink-0", isLoading && "animate-spin")} />
            </IconButton>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className={ui.label}>Đang hiển thị</p>
              <p className="text-sm font-black text-[#0b0f0d]">{filteredUsers.length} khách hàng</p>
            </div>
            <AppButton 
              variant="accent"
              onClick={handleExportCsv}
              disabled={isExporting || filteredUsers.length === 0}
              isLoading={isExporting}
            >
              Xuất CSV
            </AppButton>
          </div>
        </div>
      </AppCard>

      <AppCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Khách hàng</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Vai trò</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Đơn hàng</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-center">Số dư Credits</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690]">Ngày gia nhập</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-[#8a9690] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
                    <p className={cn(ui.label, "animate-pulse")}>Đang đồng bộ dữ liệu...</p>
                  </div>
                </td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-[#dfe5e1]" />
                    <p className={cn(ui.pMuted, "italic")}>Không tìm thấy kết quả phù hợp.</p>
                  </div>
                </td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <Link 
                          href={`/admin/users/${user.id}`}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 text-sm font-black uppercase ring-2 ring-white shadow-sm hover:bg-white hover:text-emerald-600 transition-all active:scale-95"
                        >
                          {user.name[0].toUpperCase()}
                        </Link>
                        <div>
                          <button 
                            onClick={() => { fetchUserDetail(user.id); }}
                            className="text-sm font-black text-[#0b0f0d] hover:text-[#00d4a4] transition-colors cursor-pointer text-left"
                          >
                            {user.name} {me?.id === user.id && <span className="text-[10px] font-black text-[#00d4a4] ml-1.5 uppercase tracking-tighter bg-[#e7fff7] px-1.5 py-0.5 rounded-md">BẠN</span>}
                            {user.lockedAt && <span className="text-[10px] font-black text-red-600 ml-1.5 uppercase tracking-tighter bg-red-50 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> KHÓA</span>}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             <Mail className="h-3.5 w-3.5 text-[#dfe5e1]" />
                             <span className={cn(ui.pMuted, "text-[11px]")}>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          {user.role === "ADMIN" ? (
                            <StatusBadge status="Admin" variant="info" />
                          ) : (
                            <StatusBadge status="User" variant="neutral" />
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-black text-[#0b0f0d]">{user._count.orders}</span>
                          <span className={ui.label}>Đơn hàng</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#e7fff7] px-3 py-1.5 border border-[#00d4a4]/20">
                          <Wallet className="h-3.5 w-3.5 text-[#00d4a4]" />
                          <span className="text-xs font-black text-[#00d4a4]">
                             {new Intl.NumberFormat('vi-VN').format(Number(user.totalCredits))}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-[#8a9690]">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-[12px] font-bold">
                             {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })}
                          </span>
                       </div>
                    </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2.5 relative">
                          <IconButton 
                            onClick={() => { fetchUserDetail(user.id); }}
                            variant="outline"
                            title="Xem chi tiết"
                            aria-label="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </IconButton>
                          <IconButton 
                            onClick={() => setManageUser(user)}
                            disabled={me?.id === user.id}
                            variant="outline"
                            title="Quản lý tài khoản"
                            aria-label="Quản lý tài khoản"
                          >
                            <Shield className="h-4 w-4" />
                          </IconButton>
                          
                          <IconButton 
                             onClick={(e) => {
                               const rect = e.currentTarget.getBoundingClientRect();
                               setMenuAnchor({ id: user.id, top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right - window.scrollX });
                             }}
                             variant="dark"
                             title="Thao tác khác"
                             aria-label="Thao tác khác"
                           >
                             <MoreVertical className="h-4 w-4" />
                           </IconButton>

                          {menuAnchor?.id === user.id && createPortal(
                            <>
                              <div className="fixed inset-0 z-[9998]" onClick={() => setMenuAnchor(null)} />
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  top: `${menuAnchor.top + 8}px`, 
                                  right: `${menuAnchor.right}px`,
                                }}
                                className="z-[9999] w-56 rounded-2xl bg-white border border-slate-200 p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                              >
                                 <button onClick={() => { setMenuAnchor(null); fetchUserDetail(user.id); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black text-slate-700 hover:bg-slate-50">
                                    <User className="h-4 w-4 text-slate-400" /> Xem chi tiết
                                 </button>
                                 <Link href={`/admin/orders?userId=${user.id}`} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black text-slate-700 hover:bg-slate-50">
                                    <Package className="h-4 w-4 text-slate-400" /> Xem đơn hàng
                                 </Link>
                                 <Link href={`/admin/api-keys?userId=${user.id}`} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black text-slate-700 hover:bg-slate-50">
                                    <KeyIcon className="h-4 w-4 text-slate-400" /> Xem API Keys
                                 </Link>
                                 <Link href={`/admin/usage?userId=${user.id}`} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black text-slate-700 hover:bg-slate-50">
                                    <History className="h-4 w-4 text-slate-400" /> Xem Usage
                                 </Link>
                                 <div className="my-1 border-t border-slate-100" />
                                 <button 
                                    onClick={() => { setMenuAnchor(null); setGrantUser(user); }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black text-emerald-600 hover:bg-emerald-50"
                                 >
                                    <PlusCircle className="h-4 w-4" /> Cấp credits thủ công
                                 </button>
                                 <button 
                                    onClick={() => { setMenuAnchor(null); setNotifyUser(user); }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black text-blue-600 hover:bg-blue-50"
                                 >
                                    <Bell className="h-4 w-4" /> Gửi thông báo
                                 </button>
                                 <div className="my-1 border-t border-slate-100" />
                                 {me?.id !== user.id && (
                                   <>
                                     {user.lockedAt ? (
                                       <button 
                                          onClick={() => { setMenuAnchor(null); handleUpdateStatus(user.id, "UNLOCK"); }}
                                          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black text-amber-600 hover:bg-amber-50"
                                       >
                                          <Unlock className="h-4 w-4" /> Mở khóa tài khoản
                                       </button>
                                     ) : (
                                       <button 
                                          onClick={() => { setMenuAnchor(null); handleUpdateStatus(user.id, "LOCK"); }}
                                          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black text-rose-600 hover:bg-rose-50"
                                       >
                                          <Lock className="h-4 w-4" /> Khóa tài khoản
                                       </button>
                                     )}
                                   </>
                                 )}
                              </div>
                            </>,
                            document.body
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}

      {/* Modals */}
      {detailUser && (
        <UserDetailModal 
          user={detailUser} 
          onClose={() => setDetailUser(null)} 
        />
      )}

      {manageUser && (
        <AccountManagementModal 
          user={manageUser} 
          onClose={() => setManageUser(null)}
          onUpdateRole={handleUpdateRole}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {grantUser && (
        <GrantCreditsModal 
          user={grantUser} 
          onClose={() => setGrantUser(null)}
          onConfirm={handleGrantCredits}
        />
      )}

      {notifyUser && (
        <NotifyUserModal 
          user={notifyUser} 
          onClose={() => setNotifyUser(null)}
          onConfirm={handleSendNotification}
        />
      )}

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

// --- Sub-components (Modals) ---



function UserDetailModal({ user, onClose }: { user: any, onClose: () => void }) {
  return (
    <Modal open={true} title="Chi tiết khách hàng" onClose={onClose}>
      <div className="space-y-8">
        {/* Basic Info */}
        <div className="flex items-center gap-6">
           <div className="h-20 w-20 flex items-center justify-center rounded-[32px] bg-[#fbfbf8] border border-[#edf1ee] text-3xl font-black text-[#0b0f0d] uppercase">
              {user.name[0]}
           </div>
           <div>
              <h4 className={ui.h3 + " text-2xl"}>{user.name}</h4>
              <p className={ui.p + " font-bold"}>{user.email}</p>
              <div className="flex items-center gap-3 mt-3">
                 <StatusBadge status={user.role} variant={user.role === 'ADMIN' ? 'info' : 'neutral'} />
                 {user.lockedAt && (
                   <StatusBadge status="Tài khoản đã khóa" variant="danger" />
                 )}
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
           <AppCard className="p-6 bg-[#fbfbf8]">
              <p className={ui.label + " mb-2"}>Tổng Credits</p>
              <p className="text-2xl font-black text-[#0b0f0d]">{new Intl.NumberFormat('vi-VN').format(Number(user.creditBuckets.reduce((sum: number, b: any) => sum + Number(b.creditsRemaining), 0)))}</p>
           </AppCard>
           <AppCard className="p-6 bg-[#fbfbf8]">
              <p className={ui.label + " mb-2"}>Đã sử dụng</p>
              <p className="text-2xl font-black text-[#00d4a4]">{new Intl.NumberFormat('vi-VN').format(Math.abs(Number(user.totalCreditsUsed)))}</p>
           </AppCard>
           <AppCard className="p-6 bg-[#fbfbf8]">
              <p className={ui.label + " mb-2"}>Gói hoạt động</p>
              <p className="text-2xl font-black text-blue-600">{user.activeBucketsCount}</p>
           </AppCard>
        </div>

        <div className="space-y-4">
           <div className="flex items-center gap-2 text-base font-black text-[#0b0f0d] border-b border-[#edf1ee] pb-3">
              <Package className="h-5 w-5 text-[#00d4a4]" /> Đơn hàng gần nhất
           </div>
           {user.orders.length > 0 ? (
              <div className="space-y-3">
                 {user.orders.map((order: any) => (
                   <AppCard key={order.id} className="flex items-center justify-between p-5 border-[#edf1ee] bg-white">
                      <div>
                         <p className="text-sm font-black text-[#0b0f0d]">{order.product.name}</p>
                         <p className={ui.pMuted}>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                      <StatusBadge 
                        status={order.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'} 
                        variant={order.status === 'PAID' ? 'success' : 'warning'} 
                      />
                   </AppCard>
                 ))}
              </div>
           ) : (
              <p className={cn(ui.pMuted, "italic px-2")}>Chưa có đơn hàng nào.</p>
           )}
        </div>

        <div className="space-y-4">
           <div className="flex items-center gap-2 text-base font-black text-[#0b0f0d] border-b border-[#edf1ee] pb-3">
              <KeyIcon className="h-5 w-5 text-[#00d4a4]" /> Danh sách API Keys ({user.apiKeys.length})
           </div>
           <div className="flex flex-col gap-3">
              {user.apiKeys.map((key: any) => (
                <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-3xl bg-[#fbfbf8] border border-[#edf1ee] gap-3 group/key hover:border-[#00d4a4]/40 transition-all">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#8a9690] group-hover/key:text-[#00d4a4] shadow-sm transition-colors border border-[#edf1ee]">
                         <KeyIcon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black text-[#47524d]">{key.name}</span>
                   </div>
                   <span className="font-mono text-xs font-bold text-[#8a9690] bg-white px-4 py-2 rounded-xl border border-[#edf1ee] shadow-sm group-hover/key:border-[#00d4a4]/20 transition-all">
                      {key.displayKey}
                   </span>
                </div>
              ))}
              {user.apiKeys.length === 0 && (
                <p className={cn(ui.pMuted, "italic px-2")}>Người dùng chưa tạo API key nào.</p>
              )}
           </div>
        </div>
      </div>
    </Modal>
  );
}

function AccountManagementModal({ user, onClose, onUpdateRole, onUpdateStatus }: { user: UserItem, onClose: () => void, onUpdateRole: any, onUpdateStatus: any }) {
  return (
    <Modal open={true} title="Quản lý tài khoản" onClose={onClose}>
      <div className="space-y-6">
        <AppCard className="p-6 bg-[#fbfbf8]">
           <h4 className={ui.h3 + " text-base mb-2"}>Thay đổi vai trò</h4>
           <p className={ui.pMuted + " mb-6"}>User: Quyền người dùng thông thường. Admin: Toàn quyền quản trị hệ thống.</p>
           
           <div className="flex gap-4">
              <AppButton 
                onClick={() => onUpdateRole(user.id, "USER")}
                variant={user.role === 'USER' ? 'accent' : 'secondary'}
                className="flex-1 py-4"
              >
                USER
              </AppButton>
              <AppButton 
                onClick={() => onUpdateRole(user.id, "ADMIN")}
                variant={user.role === 'ADMIN' ? 'accent' : 'secondary'}
                className="flex-1 py-4"
              >
                ADMIN
              </AppButton>
           </div>
           {user.role === 'ADMIN' && (
             <div className="mt-4 flex items-center gap-2 p-4 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-[10px] font-bold">Cảnh báo: Hạ quyền ADMIN sẽ giới hạn truy cập của người dùng này.</p>
             </div>
           )}
        </AppCard>

        <AppCard className="p-6 bg-red-50 border-red-100">
           <h4 className={ui.h3 + " text-base text-red-900 mb-2"}>Trạng thái tài khoản</h4>
           <p className={ui.pMuted + " text-red-600 mb-6"}>Khi bị khóa, người dùng không thể đăng nhập hoặc sử dụng API.</p>
           
           {user.lockedAt ? (
             <AppButton 
               onClick={() => onUpdateStatus(user.id, "UNLOCK")}
               variant="secondary"
               className="w-full h-12 text-[#00d4a4] border-[#00d4a4]/20 bg-white hover:bg-emerald-50"
             >
               <Unlock className="h-4 w-4 mr-2" /> Mở khóa tài khoản
             </AppButton>
           ) : (
             <AppButton 
               onClick={() => onUpdateStatus(user.id, "LOCK")}
               variant="danger"
               className="w-full h-12"
             >
               <Lock className="h-4 w-4 mr-2" />
               Khóa tài khoản ngay lập tức
             </AppButton>
           )}
        </AppCard>
      </div>
    </Modal>
  );
}

function GrantCreditsModal({ user, onClose, onConfirm }: { user: UserItem, onClose: () => void, onConfirm: any }) {
  const [credits, setCredits] = useState(100000);
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");

  return (
    <Modal open={true} title="Cấp Credits thủ công" onClose={onClose}>
      <div className="space-y-6">
        <AppCard className="flex items-center gap-4 p-4 border-[#edf1ee] bg-[#fbfbf8]">
           <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#020c0a] text-[#00d4a4] font-black text-xs">
              {user.name[0]}
           </div>
           <div>
              <p className="text-sm font-black text-[#0b0f0d]">{user.name}</p>
              <p className={ui.pMuted}>{user.email}</p>
           </div>
        </AppCard>

        <div className="space-y-2">
           <label className={ui.label}>Số Credits cấp</label>
           <input 
             type="number"
             value={credits}
             onChange={(e) => setCredits(Number(e.target.value))}
             className={cn(ui.input, "text-xl")}
           />
        </div>

        <div className="space-y-2">
           <label className={ui.label}>Thời hạn (Ngày)</label>
           <input 
             type="number"
             value={days}
             onChange={(e) => setDays(Number(e.target.value))}
             className={ui.input}
           />
        </div>

        <div className="space-y-2">
           <label className={ui.label}>Ghi chú lý do</label>
           <textarea 
             value={note}
             onChange={(e) => setNote(e.target.value)}
             placeholder="Ví dụ: Tặng quà tri ân, đền bù lỗi hệ thống..."
             className={cn(ui.input, "min-h-[100px] resize-none")}
           />
        </div>

        <AppButton 
          onClick={() => onConfirm(user.id, { credits, durationDays: days, note })}
          variant="accent"
          className="w-full h-16 text-lg font-black"
        >
          <PlusCircle className="h-6 w-6 mr-2" /> Xác nhận cấp Credits
        </AppButton>
      </div>
    </Modal>
  );
}

function NotifyUserModal({ user, onClose, onConfirm }: { user: UserItem, onClose: () => void, onConfirm: any }) {
  const [title, setTitle] = useState("Thông báo từ TzoShop");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");

  return (
    <Modal open={true} title="Gửi thông báo cá nhân" onClose={onClose}>
      <div className="space-y-6">
        <div className="space-y-2">
           <label className={ui.label}>Tiêu đề</label>
           <input 
             type="text"
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             className={ui.input}
           />
        </div>

        <div className="space-y-2">
           <label className={ui.label}>Loại thông báo</label>
           <div className="grid grid-cols-4 gap-2">
              {["INFO", "SUCCESS", "WARNING", "ERROR"].map((t) => (
                <AppButton 
                  key={t}
                  onClick={() => setType(t)}
                  variant={type === t ? 'accent' : 'secondary'}
                  size="sm"
                  className="text-[10px] font-black"
                >
                  {t}
                </AppButton>
              ))}
           </div>
        </div>

        <div className="space-y-2">
           <label className={ui.label}>Nội dung</label>
           <textarea 
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             placeholder="Nhập nội dung thông báo..."
             className={cn(ui.input, "min-h-[150px] resize-none")}
           />
        </div>

        <AppButton 
          onClick={() => onConfirm(user.id, { title, message, type })}
          variant="primary"
          className="w-full h-16 text-lg font-black"
        >
          <Bell className="h-6 w-6 mr-2" /> Gửi thông báo ngay
        </AppButton>
      </div>
    </Modal>
  );
}
