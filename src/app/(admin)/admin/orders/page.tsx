"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  ExternalLink,
  ChevronRight,
  Inbox,
  RefreshCw
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { formatVnd, translateStatus } from "@/lib/format";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

type OrderItem = {
  id: string;
  orderCode: string;
  amountVnd: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  isCreditsGranted: boolean;
  creditBucketId?: string;
  user: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    apiFamily: string;
  };
  couponCode?: string;
  discountAmount?: number;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [search, setSearch] = useState("");
  
  const { toast, showToast, clearToast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (filterEmail) params.append("email", filterEmail);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const result = await res.json();
      if (result.success) setOrders(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterEmail, filterStartDate, filterEndDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const confirmMsg = newStatus === "CANCELLED" 
      ? "Bạn có chắc muốn HỦY đơn hàng này?" 
      : `Xác nhận đổi trạng thái đơn hàng sang ${newStatus}?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đã cập nhật trạng thái đơn hàng.", "success");
        fetchOrders();
      }
    } catch {
      showToast("Không thể cập nhật trạng thái.", "error");
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      showToast("Đang kiểm tra với PayOS...", "info");
      const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
        method: "POST"
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, result.status === "PAID" ? "success" : "info");
        if (result.status === "PAID") fetchOrders();
      } else {
        showToast(result.message, "error");
      }
    } catch {
      showToast("Lỗi khi gọi API kiểm tra.", "error");
    }
  };



  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    return o.orderCode.toLowerCase().includes(search.toLowerCase()) || 
           o.user.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Đơn hàng" 
        description="Theo dõi đơn mua credits, thanh toán và trạng thái kích hoạt gói."
        icon={<ShoppingCart className="h-8 w-8" />}
        actions={
          <div className="flex items-center gap-6">
             <div className="text-right mr-4 hidden md:block">
                <p className={ui.label}>Tổng doanh thu</p>
                <p className="text-xl font-black text-[#00d4a4]">
                  {formatVnd(orders.reduce((acc, o) => o.status === "PAID" ? acc + o.amountVnd : acc, 0))}
                </p>
             </div>
             <IconButton 
                onClick={fetchOrders}
                isLoading={isLoading}
                variant="outline"
                title="Làm mới"
                aria-label="Làm mới"
             >
                <RefreshCw className={cn("h-5 w-5 shrink-0", isLoading && "animate-spin")} />
             </IconButton>
          </div>
        }
      />

      <AppCard className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className={ui.label}>Tìm kiếm mã đơn</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a9690]" />
              <input
                type="text"
                placeholder="Nhập mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(ui.input, "pl-10")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={ui.label}>Lọc theo Email</label>
            <input
              type="text"
              placeholder="Nhập email khách..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className={ui.input}
            />
          </div>

          <div className="space-y-2">
            <label className={ui.label}>Trạng thái</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={ui.input}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="EXPIRED">Hết hạn</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={ui.label}>Khoảng ngày</label>
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className={ui.input}
              />
              <span className="text-[#dfe5e1]">-</span>
              <input 
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className={ui.input}
              />
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Mã đơn</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Khách hàng</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Gói mua</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 text-center">Số tiền</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Thời gian</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
                    <p className={cn(ui.label, "animate-pulse")}>Đang tải đơn hàng...</p>
                  </div>
                </td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-2 text-[#8a9690]">
                    <Inbox className="h-12 w-12 text-[#dfe5e1]" />
                    <p className={cn(ui.pMuted, "italic")}>Chưa có đơn hàng phù hợp.</p>
                  </div>
                </td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <Link 
                            href={`/admin/orders/${order.id}`}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fbfbf8] text-[#8a9690] hover:bg-white hover:text-[#00d4a4] transition-all shadow-sm ring-1 ring-[#edf1ee] active:scale-95"
                          >
                             <FileText className="h-5 w-5" />
                          </Link>
                          <Link 
                            href={`/admin/orders/${order.id}`}
                            className="text-sm font-black text-slate-950 hover:text-[#00d4a4] transition-colors cursor-pointer"
                          >
                            #{order.orderCode}
                          </Link>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-bold text-slate-900 leading-tight">{order.user.name || 'Khách hàng'}</p>
                       <p className="text-xs font-semibold text-slate-500 mt-0.5">{order.user.email}</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-bold text-slate-900">{order.product.name}</p>
                       <StatusBadge status={order.product.apiFamily} variant="neutral" className="mt-1" />
                    </td>
                    <td className="px-8 py-6 text-center">
                       <p className="text-sm font-black text-slate-950">{formatVnd(order.amountVnd)}</p>
                       {order.couponCode && (
                         <div className="mt-1 flex flex-col items-center">
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">{order.couponCode}</span>
                            <span className="text-[9px] font-bold text-slate-400">-{formatVnd(order.discountAmount || 0)}</span>
                         </div>
                       )}
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center gap-2">
                          <StatusBadge 
                            status={translateStatus(order.status)} 
                            variant={order.status === 'PAID' ? 'success' : order.status === 'PENDING' ? 'warning' : order.status === 'CANCELLED' ? 'danger' : 'neutral'} 
                            className="text-[11px] font-black px-3 py-1.5"
                          />
                          {order.status === "PAID" && (
                            order.isCreditsGranted ? (
                              <span className="text-[9px] font-black text-[#00d4a4] uppercase tracking-tighter">Đã cấp Credits ✅</span>
                            ) : (
                              <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Chưa cấp Credits ⚠️</span>
                            )
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-[#0b0f0d]">
                          <Clock className="h-4 w-4 text-[#dfe5e1]" />
                          <div className="flex flex-col">
                             <span className="text-[12px] font-bold">{format(new Date(order.createdAt), "dd/MM/yyyy")}</span>
                             <span className={cn(ui.pMuted, "text-[10px]")}>{format(new Date(order.createdAt), "HH:mm:ss")}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        {order.status === "PENDING" && (
                          <>
                            <AppButton 
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                              className="h-9 text-red-600 hover:bg-red-50 border-red-100"
                            >
                              <XCircle className="h-4 w-4 mr-1.5" /> Hủy đơn
                            </AppButton>
                            <AppButton 
                              variant="accent"
                              size="sm"
                              onClick={() => handleVerifyPayment(order.id)}
                              className="h-9"
                            >
                              <ExternalLink className="h-4 w-4 mr-1.5" /> Check PayOS
                            </AppButton>
                            <AppButton 
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "PAID")}
                              className="h-9"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Duyệt
                            </AppButton>
                          </>
                        )}
                        <IconButton
                          onClick={() => window.location.href = `/admin/orders/${order.id}`}
                          variant="outline"
                          title="Xem chi tiết"
                          className="h-9 w-9"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </IconButton>
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
    </div>
  );
}
