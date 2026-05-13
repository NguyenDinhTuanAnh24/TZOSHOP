"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TicketPercent,
  Plus,
  Search,
  Edit,
  Power,
  PowerOff,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
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

function getCouponStatus(coupon: Coupon) {
  if (!coupon.isActive) return { label: "ĐÃ TẮT", bg: "bg-[#FF6B6B]" };
  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { label: "CHƯA BẮT ĐẦU", bg: "bg-[#DBEAFE]" };
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return { label: "HẾT HẠN", bg: "bg-[#E9E1D0]" };
  if (coupon.usageLimitTotal !== null && coupon._count.redemptions >= coupon.usageLimitTotal) return { label: "HẾT LƯỢT", bg: "bg-[#FFD93D]" };
  return { label: "ĐANG HIỆU LỰC", bg: "bg-[#C7F0D8]" };
}

function scopeStyle(scope: Coupon["scope"]) {
  if (scope === "GLOBAL") return "bg-[#A78BFA]";
  return "bg-[#C7F0D8]";
}

function CouponsSkeleton() {
  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="flex animate-pulse flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 border-4 border-black bg-[#E9E1D0]" />
              <div className="h-6 w-28 border-2 border-black bg-[#E9E1D0]" />
            </div>
            <div className="h-10 w-72 max-w-full bg-[#E9E1D0]" />
            <div className="h-4 w-[420px] max-w-full bg-[#E9E1D0]" />
          </div>
          <div className="h-12 w-36 border-4 border-black bg-[#E9E1D0]" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="min-h-[150px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-full animate-pulse">
              <div className="h-12 w-12 border-4 border-black bg-[#E9E1D0]" />
              <div className="mt-5 h-3 w-28 bg-[#E9E1D0]" />
              <div className="mt-3 h-9 w-20 bg-[#E9E1D0]" />
              <div className="mt-3 h-4 w-36 bg-[#E9E1D0]" />
            </div>
          </article>
        ))}
      </section>

      <section className="border-4 border-black bg-[#FFFDF5] p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_190px_190px_auto]">
          <div className="h-12 border-4 border-black bg-[#E9E1D0] shadow-[3px_3px_0px_0px_#000]" />
          <div className="h-12 border-4 border-black bg-[#E9E1D0] shadow-[3px_3px_0px_0px_#000]" />
          <div className="h-12 border-4 border-black bg-[#E9E1D0] shadow-[3px_3px_0px_0px_#000]" />
          <div className="h-12 border-4 border-black bg-[#E9E1D0] shadow-[3px_3px_0px_0px_#000]" />
        </div>
      </section>

      <section className="hidden overflow-hidden border-4 border-black bg-[#FFFDF5] p-4 shadow-[8px_8px_0px_0px_#000] lg:block md:p-5">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[980px] animate-pulse space-y-3">
            <div className="grid grid-cols-7 gap-3 border-b-4 border-black pb-4">
              {Array.from({ length: 7 }).map((__, idx) => (
                <div key={idx} className="h-4 bg-[#E9E1D0]" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((__, row) => (
              <div key={row} className="grid grid-cols-7 gap-3 border-b-2 border-black/10 py-3">
                <div className="h-8 w-40 bg-[#E9E1D0]" />
                <div className="h-8 w-24 bg-[#E9E1D0]" />
                <div className="h-8 w-36 bg-[#E9E1D0]" />
                <div className="h-8 w-28 bg-[#E9E1D0]" />
                <div className="h-8 w-24 bg-[#E9E1D0]" />
                <div className="h-8 w-28 bg-[#E9E1D0]" />
                <div className="h-10 w-24 bg-[#E9E1D0]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={index} className="space-y-4 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-8 w-36 animate-pulse bg-[#E9E1D0]" />
            <div className="h-5 w-40 animate-pulse bg-[#E9E1D0]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 border-2 border-black bg-[#E9E1D0]" />
              <div className="h-16 border-2 border-black bg-[#E9E1D0]" />
            </div>
            <div className="h-10 w-24 border-2 border-black bg-[#E9E1D0]" />
          </article>
        ))}
      </section>
    </div>
  );
}

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
    userIds: [] as string[],
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
        userIds: [],
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
        assignToAllUsers: true,
        userIds: [],
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
      if (result.success) setFoundUsers(result.data.filter((u: SimpleUser) => !formData.userIds.includes(u.id)));
    } catch {
      showToast("Lỗi tìm kiếm người dùng.", "error");
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleAddUser = (user: SimpleUser) => {
    setFormData((prev) => ({ ...prev, userIds: [...prev.userIds, user.id] }));
    setFoundUsers((prev) => prev.filter((u) => u.id !== user.id));
  };

  const handleRemoveUser = (userId: string) => {
    setFormData((prev) => ({ ...prev, userIds: prev.userIds.filter((id) => id !== userId) }));
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

      const payload: CouponPayload = formData.scope === "ASSIGNED" ? { ...basePayload, userIds: formData.userIds } : basePayload;
      if (formData.scope === "ASSIGNED" && (!formData.userIds || !formData.userIds.length)) {
        showToast("Vui lòng chọn ít nhất một người dùng.", "error");
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        const res = await fetch(`/api/admin/coupons/${coupon.id}/toggle`, { method: "PATCH" });
        if (res.ok) {
          showToast(`Đã ${action.toLowerCase()} mã giảm giá.`, "success");
          fetchCoupons();
        } else {
          showToast("Có lỗi xảy ra.", "error");
        }
      },
    });
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase());
    const matchesScope = filterScope === "ALL" || c.scope === filterScope;
    const status = getCouponStatus(c).label;
    const matchesActive =
      filterActive === "ALL" ||
      (filterActive === "ACTIVE" && status === "ĐANG HIỆU LỰC") ||
      (filterActive === "SCHEDULED" && status === "CHƯA BẮT ĐẦU") ||
      (filterActive === "EXPIRED" && status === "HẾT HẠN") ||
      (filterActive === "DISABLED" && status === "ĐÃ TẮT") ||
      (filterActive === "USEDUP" && status === "HẾT LƯỢT");
    return matchesSearch && matchesScope && matchesActive;
  });

  const formatVnd = (val: number) => new Intl.NumberFormat("vi-VN").format(val) + " đ";
  const totalUses = coupons.reduce((acc, c) => acc + c._count.redemptions, 0);
  const activeCoupons = coupons.filter((c) => getCouponStatus(c).label === "ĐANG HIỆU LỰC").length;
  const globalCoupons = coupons.filter((c) => c.scope === "GLOBAL").length;

  const brutalInput =
    "h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none";

  if (isLoading) {
    return <CouponsSkeleton />;
  }

  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <TicketPercent className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">COUPONS</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">MÃ GIẢM GIÁ</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Quản lý chương trình khuyến mãi, mã ưu đãi cho người dùng.</p>
          </div>
          <AppButton onClick={() => handleOpenModal()} variant="primary" className="h-12 border-4 border-black bg-[#FFD93D] px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 hover:bg-[#FF6B6B] hover:shadow-[7px_7px_0px_0px_#000]">
            <Plus className="mr-2 h-4 w-4" />
            TẠO MÃ MỚI
          </AppButton>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "TỔNG MÃ ĐÃ TẠO", value: coupons.length, bg: "bg-[#DBEAFE]" },
          { label: "ĐANG HIỆU LỰC", value: activeCoupons, bg: "bg-[#C7F0D8]" },
          { label: "TỔNG LƯỢT DÙNG", value: totalUses, bg: "bg-[#FFD93D]" },
          { label: "MÃ TOÀN HỆ THỐNG", value: globalCoupons, bg: "bg-[#A78BFA]" },
        ].map((s) => (
          <article key={s.label} className="min-h-[130px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000]">
            <div className="flex h-full flex-col justify-between">
              <div className={`flex h-11 w-11 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${s.bg}`}>
                <TicketPercent className="h-5 w-5 text-black" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-black/70">{s.label}</p>
                <p className="mt-3 text-3xl font-black leading-none text-black md:text-4xl">{s.value.toLocaleString("vi-VN")}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4 border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_190px_190px_auto]">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
              <input type="text" placeholder="Mã hoặc tên chương trình..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${brutalInput} pl-10`} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Phạm vi</label>
            <select value={filterScope} onChange={(e) => setFilterScope(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả phạm vi</option>
              <option value="GLOBAL">Toàn hệ thống</option>
              <option value="ASSIGNED">Theo người dùng</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Trạng thái</label>
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hiệu lực</option>
              <option value="SCHEDULED">Chưa bắt đầu</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="DISABLED">Đã tắt</option>
              <option value="USEDUP">Đã dùng hết lượt</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Hành động</label>
            <AppButton
              onClick={() => {
                setSearch("");
                setFilterScope("ALL");
                setFilterActive("ALL");
              }}
              variant="secondary"
              className="h-12 w-full border-4 border-black bg-white px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
            >
              <Filter className="mr-2 h-4 w-4" />
              XÓA LỌC
            </AppButton>
          </div>
        </div>
        <p className="text-sm font-bold text-black/70">Đang hiển thị <span className="font-black text-black">{filteredCoupons.length}</span> mã</p>
      </section>

      {isLoading ? (
        <section className="space-y-4">
          <div className="h-20 border-4 border-black bg-[#FFFDF5] p-4 shadow-[8px_8px_0px_0px_#000]">
            <div className="h-full w-full animate-pulse bg-[#E9E1D0]" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
              <div className="h-full w-full animate-pulse bg-[#E9E1D0]" />
            </div>
          ))}
        </section>
      ) : filteredCoupons.length === 0 ? (
        <section className="flex min-h-[320px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-8 text-center shadow-[8px_8px_0px_0px_#000]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
            <TicketPercent className="h-7 w-7 text-black" />
          </div>
          <h4 className="text-xl font-black text-black">{coupons.length === 0 ? "CHƯA CÓ MÃ GIẢM GIÁ NÀO" : "KHÔNG TÌM THẤY MÃ GIẢM GIÁ"}</h4>
          <p className="mt-2 text-sm font-bold text-black/60">
            {coupons.length === 0
              ? "Tạo mã ưu đãi đầu tiên để chạy chương trình khuyến mãi cho người dùng."
              : "Thử đổi từ khóa, phạm vi hoặc trạng thái lọc."}
          </p>
          <div className="mt-4">
            {coupons.length === 0 ? (
              <AppButton onClick={() => handleOpenModal()} variant="primary" className="h-11 border-4 border-black bg-[#FFD93D] px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
                TẠO MÃ MỚI
              </AppButton>
            ) : (
              <AppButton onClick={() => { setSearch(""); setFilterScope("ALL"); setFilterActive("ALL"); }} variant="secondary" className="h-11 border-4 border-black bg-white px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
                XÓA BỘ LỌC
              </AppButton>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="hidden overflow-hidden border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] lg:block md:p-5">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b-4 border-black bg-[#FFFDF5]">
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Thông tin mã</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Giảm</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Điều kiện</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Phạm vi</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Lượt dùng</th>
                    <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Trạng thái</th>
                    <th className="px-4 py-4 text-right text-[11px] font-black uppercase tracking-[0.16em] text-black/60">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    const usagePercent =
                      coupon.usageLimitTotal && coupon.usageLimitTotal > 0
                        ? Math.min(100, Math.round((coupon._count.redemptions / coupon.usageLimitTotal) * 100))
                        : 0;
                    return (
                      <tr key={coupon.id} className="border-b-2 border-black/10 align-middle transition-colors hover:bg-[#FFF8D6]">
                        <td className="px-4 py-4">
                          <div className="min-w-0">
                            <span className="inline-flex break-all border-2 border-black bg-[#FFD93D] px-3 py-1 text-xs font-black uppercase tracking-wide text-black shadow-[2px_2px_0px_0px_#000]">{coupon.code}</span>
                            <p className="mt-2 text-base font-black text-black">{coupon.name}</p>
                            {coupon.description ? <p className="line-clamp-2 text-sm font-bold text-black/60">{coupon.description}</p> : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xl font-black text-black">{coupon.discountPercent}%</p>
                          <span className="mt-1 inline-flex border-2 border-black bg-[#C7F0D8] px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">PERCENT</span>
                          {coupon.maxDiscountVnd ? <p className="mt-1 text-xs font-bold text-black/60">Tối đa {formatVnd(coupon.maxDiscountVnd)}</p> : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1 text-sm">
                            <p><span className="font-bold text-black/60">Tối thiểu: </span><span className="font-black text-black">{formatVnd(coupon.minOrderAmount)}</span></p>
                            <p><span className="font-bold text-black/60">Từ: </span><span className="font-black text-black">{coupon.startsAt ? format(new Date(coupon.startsAt), "dd/MM/yyyy") : "Không giới hạn"}</span></p>
                            <p><span className="font-bold text-black/60">Đến: </span><span className="font-black text-black">{coupon.endsAt ? format(new Date(coupon.endsAt), "dd/MM/yyyy") : "Không giới hạn"}</span></p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex border-2 border-black px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]", scopeStyle(coupon.scope))}>
                            {coupon.scope === "GLOBAL" ? "TOÀN HỆ THỐNG" : "THEO NGƯỜI DÙNG"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-black text-black">{coupon._count.redemptions} / {coupon.usageLimitTotal ?? "∞"}</p>
                          {coupon.usageLimitTotal ? (
                            <div className="mt-1 h-3 w-full max-w-[140px] border-2 border-black bg-white">
                              <div className="h-full bg-[#C7F0D8]" style={{ width: `${usagePercent}%` }} />
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex h-8 items-center border-2 border-black px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]", status.bg)}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(coupon)}
                              className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFD93D]"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(coupon)}
                              title={coupon.isActive ? "Tắt mã" : "Bật mã"}
                              className={cn(
                                "flex h-10 w-10 items-center justify-center border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]",
                                coupon.isActive ? "bg-[#FF6B6B]" : "bg-[#C7F0D8]",
                              )}
                            >
                              {coupon.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:hidden">
            {filteredCoupons.map((coupon) => {
              const status = getCouponStatus(coupon);
              return (
                <article key={coupon.id} className="space-y-4 border-4 border-black bg-[#FFFDF5] p-4 shadow-[6px_6px_0px_0px_#000]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex break-all border-2 border-black bg-[#FFD93D] px-3 py-1 text-xs font-black uppercase tracking-wide text-black shadow-[2px_2px_0px_0px_#000]">{coupon.code}</span>
                    <span className={cn("inline-flex h-8 items-center border-2 border-black px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]", status.bg)}>{status.label}</span>
                  </div>
                  <p className="text-base font-black text-black">{coupon.name}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="border-2 border-black bg-white p-2">
                      <p className="text-[11px] font-black uppercase text-black/60">Giảm</p>
                      <p className="font-black text-black">{coupon.discountPercent}%</p>
                    </div>
                    <div className="border-2 border-black bg-white p-2">
                      <p className="text-[11px] font-black uppercase text-black/60">Lượt dùng</p>
                      <p className="font-black text-black">{coupon._count.redemptions} / {coupon.usageLimitTotal ?? "∞"}</p>
                    </div>
                    <div className="border-2 border-black bg-white p-2">
                      <p className="text-[11px] font-black uppercase text-black/60">Phạm vi</p>
                      <p className="font-black text-black">{coupon.scope === "GLOBAL" ? "Toàn hệ thống" : "Theo người dùng"}</p>
                    </div>
                    <div className="border-2 border-black bg-white p-2">
                      <p className="text-[11px] font-black uppercase text-black/60">Đến ngày</p>
                      <p className="font-black text-black">{coupon.endsAt ? format(new Date(coupon.endsAt), "dd/MM/yyyy") : "Không giới hạn"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AppButton onClick={() => handleOpenModal(coupon)} variant="secondary" className="h-10 border-2 border-black bg-white px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">SỬA</AppButton>
                    <AppButton onClick={() => handleToggleActive(coupon)} variant="secondary" className={cn("h-10 border-2 border-black px-3 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]", coupon.isActive ? "bg-[#FF6B6B]" : "bg-[#C7F0D8]")}>
                      {coupon.isActive ? "TẮT" : "BẬT"}
                    </AppButton>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      <Modal
        open={isModalOpen}
        title={editingId ? `Cập nhật mã: ${formData.code}` : "Tạo mã giảm giá mới"}
        onClose={() => setIsModalOpen(false)}
        maxWidthClassName="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="max-h-[90vh] space-y-6 overflow-y-auto bg-[#FFFDF5] p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Mã giảm giá</label>
              <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Tên chương trình</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Mô tả</label>
              <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[110px] w-full border-4 border-black bg-white p-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000] outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Loại giảm</label>
              <input type="text" disabled value="Phần trăm (%)" className={`${brutalInput} bg-[#E9E1D0]`} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Giá trị giảm (%)</label>
              <input type="number" min={1} max={100} required value={formData.discountPercent} onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Giảm tối đa (VNĐ)</label>
              <input type="number" min={0} value={formData.maxDiscountVnd} onChange={(e) => setFormData({ ...formData, maxDiscountVnd: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Đơn tối thiểu (VNĐ)</label>
              <input type="number" min={0} required value={formData.minOrderAmount} onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Ngày bắt đầu</label>
              <input type="date" value={formData.startsAt} onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Ngày kết thúc</label>
              <input type="date" value={formData.endsAt} onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Số lượt dùng tối đa</label>
              <input type="number" min={0} value={formData.usageLimitTotal} onChange={(e) => setFormData({ ...formData, usageLimitTotal: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Mỗi user</label>
              <input type="number" min={1} required value={formData.usageLimitPerUser} onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })} className={brutalInput} />
            </div>
          </div>

          <div className="space-y-3 border-4 border-black bg-white p-4">
            <label className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Phạm vi áp dụng</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFormData({ ...formData, scope: "GLOBAL" })} className={cn("h-10 border-2 border-black px-4 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]", formData.scope === "GLOBAL" ? "bg-[#A78BFA]" : "bg-white")}>
                TOÀN HỆ THỐNG
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, scope: "ASSIGNED" })} className={cn("h-10 border-2 border-black px-4 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]", formData.scope === "ASSIGNED" ? "bg-[#C7F0D8]" : "bg-white")}>
                CHỈ ĐỊNH USER
              </button>
            </div>

            {formData.scope === "GLOBAL" && (
              <div className="border-2 border-black bg-[#C7F0D8] p-3 text-sm font-bold text-black">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Mã này áp dụng cho toàn bộ người dùng thường.
                </div>
              </div>
            )}

            {formData.scope === "ASSIGNED" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập email user..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchUsers())}
                    className={brutalInput}
                  />
                  <AppButton type="button" onClick={handleSearchUsers} isLoading={isSearchingUsers} variant="secondary" className="h-12 border-4 border-black bg-white px-4 font-black uppercase text-black shadow-[3px_3px_0px_0px_#000]">
                    Tìm
                  </AppButton>
                </div>
                {foundUsers.length > 0 && (
                  <div className="space-y-2">
                    {foundUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between border-2 border-black bg-[#FFFDF5] p-2 text-sm">
                        <span className="font-bold text-black">{user.email}</span>
                        <button type="button" onClick={() => handleAddUser(user)} className="border-2 border-black bg-[#FFD93D] px-2 py-1 text-xs font-black uppercase">
                          Thêm
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.userIds.map((userId) => (
                    <div key={userId} className="flex items-center gap-2 border-2 border-black bg-[#DBEAFE] px-2 py-1 text-xs font-black">
                      <span className="break-all">{userId}</span>
                      <button type="button" onClick={() => handleRemoveUser(userId)} className="inline-flex">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end gap-2 border-t-2 border-black/10 pt-4 sm:flex-row">
            <AppButton type="button" onClick={() => setIsModalOpen(false)} variant="secondary" className="h-12 border-4 border-black bg-white px-6 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
              Hủy
            </AppButton>
            <AppButton type="submit" variant="primary" className="h-12 border-4 border-black bg-[#FFD93D] px-6 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
              {editingId ? "LƯU MÃ" : "TẠO MÃ"}
            </AppButton>
          </div>
        </form>
      </Modal>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
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
