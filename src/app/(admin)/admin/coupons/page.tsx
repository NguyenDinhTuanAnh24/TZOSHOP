"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  TicketPercent, 
  Plus, 
  Search, 
  Edit, 
  Power, 
  PowerOff,
  Clock,
  Filter,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { Modal } from "@/components/ui/modal";
import { format } from "date-fns";


type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscountVnd: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  scope: "GLOBAL" | "ASSIGNED";
  usageLimitTotal: number | null;
  usageLimitPerUser: number;
  _count: {
    assignments: number;
    redemptions: number;
  };
};

type SimpleUser = {
  id: string;
  email: string;
  name: string | null;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountPercent: "10",
    minOrderAmount: "0",
    maxDiscountVnd: "0",
    startsAt: "",
    endsAt: "",
    isActive: true,
    scope: "GLOBAL" as "GLOBAL" | "ASSIGNED",
    usageLimitTotal: "0",
    usageLimitPerUser: "1",
    assignToAllUsers: false,
    userIds: [] as string[]
  });

  const [userSearch, setUserSearch] = useState("");
  const [foundUsers, setFoundUsers] = useState<SimpleUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/coupons");
      const result = await res.json();
      if (result.success) setCoupons(result.data);
    } catch {
      showToast("Không thể tải danh sách mã giảm giá.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCoupons();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchCoupons]);

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingId(coupon.id);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || "",
        discountPercent: coupon.discountPercent.toString(),
        minOrderAmount: coupon.minOrderAmount.toString(),
        maxDiscountVnd: (coupon.maxDiscountVnd || 0).toString(),
        startsAt: coupon.startsAt ? format(new Date(coupon.startsAt), "yyyy-MM-dd") : "",
        endsAt: coupon.endsAt ? format(new Date(coupon.endsAt), "yyyy-MM-dd") : "",
        isActive: coupon.isActive,
        scope: coupon.scope,
        usageLimitTotal: (coupon.usageLimitTotal || 0).toString(),
        usageLimitPerUser: coupon.usageLimitPerUser.toString(),
        assignToAllUsers: false,
        userIds: []
      });
    } else {
      setEditingId(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        discountPercent: "10",
        minOrderAmount: "0",
        maxDiscountVnd: "0",
        startsAt: "",
        endsAt: "",
        isActive: true,
        scope: "GLOBAL",
        usageLimitTotal: "0",
        usageLimitPerUser: "1",
        assignToAllUsers: true, // Mặc định bật thông báo/cấp toàn hệ thống
        userIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSearchUsers = async () => {
    if (!userSearch || userSearch.length < 2) return;
    try {
      setIsSearchingUsers(true);
      const res = await fetch(`/api/admin/users?search=${userSearch}&limit=10`);
      const result = await res.json();
      if (result.success) {
        setFoundUsers(result.data.filter((u: SimpleUser) => !formData.userIds.includes(u.id)));
      }
    } catch {
      showToast("Lỗi tìm kiếm người dùng.", "error");
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleAddUser = (user: SimpleUser) => {
    setFormData(prev => ({
      ...prev,
      userIds: [...prev.userIds, user.id]
    }));
    setFoundUsers(prev => prev.filter(u => u.id !== user.id));
  };

  const handleRemoveUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.filter(id => id !== userId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const method = editingId ? "PATCH" : "POST";
      
      type CouponScopeValue = "GLOBAL" | "ASSIGNED";

      type CouponPayload = {
        code: string;
        name: string;
        description?: string | null;
        discountPercent: number;
        minOrderAmount: number;
        maxDiscountVnd: number | null;
        startsAt?: string | null;
        endsAt?: string | null;
        usageLimitTotal: number | null;
        usageLimitPerUser: number;
        isActive: boolean;
        scope: CouponScopeValue;
        userIds?: string[];
      };

      const basePayload: CouponPayload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        discountPercent: Number(formData.discountPercent || 0),
        minOrderAmount: Number(formData.minOrderAmount || 0),
        maxDiscountVnd: Number(formData.maxDiscountVnd) || null,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        isActive: formData.isActive,
        scope: formData.scope as CouponScopeValue,
        usageLimitTotal: Number(formData.usageLimitTotal) || null,
        usageLimitPerUser: Number(formData.usageLimitPerUser || 1),
      };

      const payload: CouponPayload =
        formData.scope === "ASSIGNED"
          ? {
              ...basePayload,
              userIds: formData.userIds,
            }
          : basePayload;

      if (formData.scope === "ASSIGNED" && (!formData.userIds || !formData.userIds.length)) {
        showToast("Vui lòng chọn ít nhất một người dùng.", "error");
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        showToast(editingId ? "Cập nhật mã thành công." : "Tạo mã mới thành công.", "success");
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        showToast(result.error?.message || "Lỗi khi lưu mã giảm giá.", "error");
      }
    } catch {
      showToast("Lỗi hệ thống.", "error");
    }
  };

  const handleToggleActive = (coupon: Coupon) => {
    const action = coupon.isActive ? "Tắt" : "Bật";
    askConfirm({
      title: `${action} mã giảm giá ${coupon.code}?`,
      description: coupon.isActive 
        ? "Người dùng sẽ không thể áp dụng mã này cho các đơn hàng mới."
        : "Mã giảm giá sẽ có hiệu lực trở lại nếu còn hạn sử dụng.",
      confirmLabel: `Xác nhận ${action}`,
      cancelLabel: "Hủy",
      type: coupon.isActive ? "warning" : "success",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/coupons/${coupon.id}/toggle`, {
          method: "PATCH"
        });
        if (res.ok) {
          showToast(`Đã ${action.toLowerCase()} mã giảm giá.`, "success");
          fetchCoupons();
        } else {
          showToast("Có lỗi xảy ra.", "error");
        }
      }
    });
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase());
    const matchesScope = filterScope === "ALL" || c.scope === filterScope;
    const matchesActive = filterActive === "ALL" || (filterActive === "ACTIVE" ? c.isActive : !c.isActive);
    return matchesSearch && matchesScope && matchesActive;
  });

  const formatVnd = (val: number) => new Intl.NumberFormat("vi-VN").format(val) + "đ";

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Mã giảm giá" 
        description="Quản lý chương trình khuyến mãi, mã ưu đãi cho người dùng."
        icon={<TicketPercent className="h-8 w-8 text-emerald-600" />}
        actions={
          <AppButton 
            onClick={() => handleOpenModal()}
            variant="accent"
            className="h-12 px-8 text-sm font-black"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tạo mã mới
          </AppButton>
        }
      />

      <div className="grid gap-6 md:grid-cols-4">
        <AppCard className="p-6 border-slate-100 shadow-sm">
          <p className={ui.label + " mb-1"}>Tổng mã đã tạo</p>
          <h3 className="text-2xl font-black text-slate-900">{coupons.length}</h3>
        </AppCard>
        <AppCard className="p-6 border-slate-100 shadow-sm">
          <p className={ui.label + " mb-1"}>Đang hiệu lực</p>
          <h3 className="text-2xl font-black text-emerald-600">{coupons.filter(c => c.isActive).length}</h3>
        </AppCard>
        <AppCard className="p-6 border-slate-100 shadow-sm">
          <p className={ui.label + " mb-1"}>Tổng lượt dùng</p>
          <h3 className="text-2xl font-black text-blue-600">{coupons.reduce((acc, c) => acc + c._count.redemptions, 0)}</h3>
        </AppCard>
        <AppCard className="p-6 border-slate-100 shadow-sm">
          <p className={ui.label + " mb-1"}>Mã toàn hệ thống</p>
          <h3 className="text-2xl font-black text-purple-600">{coupons.filter(c => c.scope === "GLOBAL").length}</h3>
        </AppCard>
      </div>

      <AppCard className="p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
           <div className="relative flex-1 max-w-xl">
             <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
             <input
               type="text"
               placeholder="Tìm theo mã hoặc tên chương trình..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className={cn(ui.input, "h-12 pl-14 text-base")}
             />
           </div>
           <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                 <Filter className="h-4 w-4 text-slate-400" />
                 <select 
                   value={filterScope}
                   onChange={e => setFilterScope(e.target.value)}
                   className="bg-transparent text-xs font-black text-slate-700 outline-none uppercase tracking-widest"
                 >
                    <option value="ALL">Tất cả phạm vi</option>
                    <option value="GLOBAL">Toàn hệ thống</option>
                    <option value="ASSIGNED">Chỉ định</option>
                 </select>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                 <select 
                   value={filterActive}
                   onChange={e => setFilterActive(e.target.value)}
                   className="bg-transparent text-xs font-black text-slate-700 outline-none uppercase tracking-widest"
                 >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang bật</option>
                    <option value="DISABLED">Đang tắt</option>
                 </select>
              </div>
           </div>
        </div>
      </AppCard>

      <AppCard className="overflow-hidden border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-7 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Thông tin mã</th>
                <th className="px-8 py-7 text-xs font-black uppercase tracking-[0.16em] text-slate-400 text-center">Giảm</th>
                <th className="px-8 py-7 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Điều kiện</th>
                <th className="px-8 py-7 text-xs font-black uppercase tracking-[0.16em] text-slate-400 text-center">Phạm vi</th>
                <th className="px-8 py-7 text-xs font-black uppercase tracking-[0.16em] text-slate-400 text-center">Lượt dùng</th>
                <th className="px-8 py-7 text-xs font-black uppercase tracking-[0.16em] text-slate-400 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                    <p className={cn(ui.label, "animate-pulse")}>Đang tải danh sách...</p>
                  </div>
                </td></tr>
              ) : filteredCoupons.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-bold italic">Không tìm thấy mã nào.</td></tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className={cn(
                    "group transition-colors",
                    !coupon.isActive ? "bg-slate-50/50 opacity-75 grayscale" : "hover:bg-slate-50/30"
                  )}>
                    <td className="px-8 py-7">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                             "flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ring-1 ring-slate-100 transition-all",
                             coupon.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                          )}>
                             <TicketPercent className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-950 uppercase tracking-tight">{coupon.code}</p>
                            <p className="text-sm font-bold text-slate-600 truncate max-w-[200px]">{coupon.name}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-7 text-center">
                       <span className="text-base font-black text-emerald-600">-{coupon.discountPercent}%</span>
                    </td>
                    <td className="px-8 py-7">
                       <div className="space-y-1.5">
                          <p className="text-sm font-bold text-slate-800">Đơn từ: {formatVnd(coupon.minOrderAmount)}</p>
                          {coupon.maxDiscountVnd && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Tối đa: {formatVnd(coupon.maxDiscountVnd)}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                             <Clock className="h-3.5 w-3.5" />
                             {coupon.endsAt ? format(new Date(coupon.endsAt), "dd/MM/yyyy") : "Vô thời hạn"}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-7 text-center">
                       <StatusBadge 
                         status={coupon.scope === "GLOBAL" ? "Toàn hệ thống" : "Chỉ định"} 
                         variant={coupon.scope === "GLOBAL" ? "info" : "neutral"}
                         className="text-xs font-black px-3 py-1.5"
                       />
                       {coupon.scope === "ASSIGNED" && (
                         <p className="mt-1.5 text-xs font-semibold text-slate-500 italic">{coupon._count.assignments} users</p>
                       )}
                    </td>
                    <td className="px-8 py-7 text-center">
                       <div className="inline-flex flex-col items-center gap-1">
                          <span className="text-base font-black text-slate-950">{coupon._count.redemptions}</span>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                            / {coupon.usageLimitTotal || "∞"}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-7">
                        <div className="flex items-center justify-center gap-2">
                           <button
                             onClick={() => handleToggleActive(coupon)}
                             title={coupon.isActive ? "Tắt mã" : "Bật mã"}
                             className={cn(
                               "flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95",
                               coupon.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                             )}
                           >
                              {coupon.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                           </button>
                           <button
                             onClick={() => handleOpenModal(coupon)}
                             className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                           >
                              <Edit className="h-4 w-4" />
                           </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AppCard>

      <Modal
        open={isModalOpen}
        title={editingId ? `Cập nhật mã: ${formData.code}` : "Tạo mã giảm giá mới"}
        onClose={() => setIsModalOpen(false)}
        maxWidthClassName="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
           <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                 <label className={ui.label}>Mã Coupon (Duy nhất)</label>
                 <input 
                   type="text"
                   required
                   placeholder="VÍ DỤ: TZO10OFF"
                   value={formData.code}
                   onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                   className={cn(ui.input, "uppercase tracking-widest")}
                 />
              </div>
              <div className="space-y-2">
                 <label className={ui.label}>Tên chương trình</label>
                 <input 
                   type="text"
                   required
                   placeholder="Ví dụ: Ưu đãi tháng 5"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className={ui.input}
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className={ui.label}>Mô tả (Tùy chọn)</label>
              <textarea 
                rows={2}
                placeholder="Nội dung hiển thị cho người dùng biết về mã này..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className={ui.input}
              />
           </div>

           <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                 <label className={ui.label}>% Giảm giá</label>
                 <div className="relative">
                   <input 
                     type="number"
                     min={1}
                     max={100}
                     required
                     value={formData.discountPercent}
                     onChange={e => setFormData({...formData, discountPercent: e.target.value})}
                     className={cn(ui.input, "pr-10")}
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                 </div>
              </div>
              <div className="space-y-2">
                 <label className={ui.label}>Đơn tối thiểu (VNĐ)</label>
                 <input 
                   type="number"
                   min={0}
                   required
                   value={formData.minOrderAmount}
                   onChange={e => setFormData({...formData, minOrderAmount: e.target.value})}
                   className={ui.input}
                 />
              </div>
              <div className="space-y-2">
                 <div className="flex flex-col">
                    <label className={ui.label}>Giảm tối đa</label>
                    <span className="text-[10px] text-slate-400 font-bold leading-tight">(0 = không giới hạn)</span>
                 </div>
                 <input 
                   type="number"
                   min={0}
                   value={formData.maxDiscountVnd}
                   onChange={e => setFormData({...formData, maxDiscountVnd: e.target.value})}
                   className={ui.input}
                 />
              </div>
           </div>

           <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                 <label className={ui.label}>Ngày bắt đầu (Tùy chọn)</label>
                 <input 
                   type="date"
                   value={formData.startsAt}
                   onChange={e => setFormData({...formData, startsAt: e.target.value})}
                   className={ui.input}
                 />
              </div>
              <div className="space-y-2">
                 <label className={ui.label}>Ngày kết thúc (Tùy chọn)</label>
                 <input 
                   type="date"
                   value={formData.endsAt}
                   onChange={e => setFormData({...formData, endsAt: e.target.value})}
                   className={ui.input}
                 />
              </div>
           </div>

           <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                 <label className={ui.label}>Giới hạn tổng lượt dùng (0 = ∞)</label>
                 <input 
                   type="number"
                   min={0}
                   value={formData.usageLimitTotal}
                   onChange={e => setFormData({...formData, usageLimitTotal: e.target.value})}
                   className={ui.input}
                 />
              </div>
              <div className="space-y-2">
                 <label className={ui.label}>Lượt dùng mỗi User</label>
                 <input 
                   type="number"
                   min={1}
                   required
                   value={formData.usageLimitPerUser}
                   onChange={e => setFormData({...formData, usageLimitPerUser: e.target.value})}
                   className={ui.input}
                 />
              </div>
           </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                 <label className={ui.label}>Phạm vi áp dụng</label>
                 <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, scope: "GLOBAL"})}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                        formData.scope === "GLOBAL" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      TOÀN HỆ THỐNG
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, scope: "ASSIGNED"})}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                        formData.scope === "ASSIGNED" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      CHỈ ĐỊNH
                    </button>
                 </div>
              </div>

              {formData.scope === "GLOBAL" && (
                <div className="p-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 mb-6 animate-in fade-in duration-300">
                   <div className="flex items-center gap-3 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm font-bold">Mã này sẽ áp dụng cho toàn bộ người dùng thường, không bao gồm admin.</p>
                   </div>
                </div>
              )}

              {formData.scope === "ASSIGNED" && (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                   <div className="space-y-4">
                       <div className="flex gap-2">
                          <div className="relative flex-1">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                             <input 
                               type="text"
                               placeholder="Nhập email user..."
                               value={userSearch}
                               onChange={e => setUserSearch(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchUsers())}
                               className={cn(ui.input, "pl-11 h-11")}
                             />
                          </div>
                          <AppButton 
                            type="button"
                            onClick={handleSearchUsers}
                            isLoading={isSearchingUsers}
                            variant="secondary"
                            className="h-11 px-6"
                          >
                            Tìm
                          </AppButton>
                       </div>

                       {foundUsers.length > 0 && (
                         <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden divide-y divide-slate-50">
                            {foundUsers.map(user => (
                              <div key={user.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50">
                                 <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold uppercase">
                                       {user.email[0]}
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-slate-900">{user.email}</p>
                                       <p className="text-[10px] text-slate-400">{user.name || 'Chưa đặt tên'}</p>
                                    </div>
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => handleAddUser(user)}
                                   className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                                 >
                                   + Thêm
                                 </button>
                              </div>
                            ))}
                         </div>
                       )}

                       <div className="flex flex-wrap gap-2">
                          {formData.userIds.map(userId => (
                            <div key={userId} className="flex items-center gap-2 rounded-full bg-slate-950 text-white pl-3.5 pr-2 py-1.5 text-[11px] font-bold">
                               <span>{userId}</span>
                               <button
                                 type="button"
                                 onClick={() => handleRemoveUser(userId)}
                                 className="rounded-full hover:bg-white/20 p-0.5"
                               >
                                 <XCircle className="h-3.5 w-3.5" />
                               </button>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              )}
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
             <AppButton
               type="button"
               onClick={() => setIsModalOpen(false)}
               variant="secondary"
             >
               Hủy
             </AppButton>
             <AppButton
               type="submit"
               variant="accent"
               className="px-10"
             >
               {editingId ? "Cập nhật mã" : "Tạo mã ngay"}
             </AppButton>
           </div>
        </form>
      </Modal>

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
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
