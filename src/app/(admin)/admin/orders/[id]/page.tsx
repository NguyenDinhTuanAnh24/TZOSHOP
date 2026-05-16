"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  User, 
  Mail, 
  CreditCard, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ExternalLink,
  AlertCircle,
  Hash,
  ArrowRight,
  Package,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { formatVnd } from "@/lib/format";
import { PageLoader } from "@/components/ui/app-loader";

type OrderDetail = {
  id: string;
  orderCode: string;
  amountVnd: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  payosOrderCode?: string;
  payosCheckoutUrl?: string;
  payosQrCode?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  product: {
    id: string;
    name: string;
    apiFamily: string;
    credits: string;
    durationDays: number;
    tier: string;
  };
  creditBucket: {
    id: string;
    creditsTotal: string;
    creditsRemaining: string;
    isActive: boolean;
    expiresAt: string;
  } | null;
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast, showToast, clearToast } = useToast();

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!id || id === "undefined") {
        setOrder(null);
        showToast("Không tìm thấy mã đơn hàng", "error");
        return;
      }
      const res = await fetch(`/api/admin/orders/${id}`);
      const result = await res.json();
      if (!res.ok || result?.success !== true || result?.data == null) {
        setOrder(null);
        showToast(result?.error?.message || "Không thể tải thông tin.", "error");
        return;
      }
      setOrder(result.data);
    } catch {
      setOrder(null);
      showToast("Li kt ni.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrder();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrder]);

  const handleVerifyPayment = async () => {
    if (!order) return;
    try {
      showToast("Đang kim tra vi PayOS...", "info");
      const res = await fetch(`/api/admin/orders/${order.id}/verify`, {
        method: "POST"
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, result.status === "PAID" ? "success" : "info");
        if (result.status === "PAID") fetchOrder();
      } else {
        showToast(result.message, "error");
      }
    } catch {
      setOrder(null);
      showToast("Li kt ni.", "error");
    }
  };

  const handleManualApprove = async () => {
    if (!order) return;
    // Confirmation handled by custom UI flow in future refactor.

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status: "PAID" }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đ duyt ơn hng thnh cng.", "success");
        fetchOrder();
      }
    } catch {
      setOrder(null);
      showToast("Li kt ni.", "error");
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    // Confirmation handled by custom UI flow in future refactor.

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status: "CANCELLED" }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đ hủy ơn hng.", "success");
        fetchOrder();
      }
    } catch {
      setOrder(null);
      showToast("Li kt ni.", "error");
    }
  };

  if (isLoading) {
    return <PageLoader label="Đang tải chi tiết đơn hàng..." />;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-900">Không tìm thấy đơn hàng.</h2>
        <Link href="/admin/orders" className="mt-4 inline-flex text-emerald-600 font-bold hover:underline">
          Quay lại danh sch
        </Link>
      </div>
    );
  }

  const sectionCard = "rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50";


  const statusConfig: Record<string, { label: string, color: string, bg: string, icon: React.ElementType }> = {
    PAID: { label: "Đã thanh toán", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
    PENDING: { label: "Chờ thanh ton", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
    CANCELLED: { label: "Đ hủy", color: "text-rose-600", bg: "bg-rose-50", icon: XCircle },
    EXPIRED: { label: "Hết hạn", color: "text-slate-500", bg: "bg-slate-100", icon: AlertCircle },
  };

  const currentStatus = statusConfig[order.status] || { label: order.status, color: "text-slate-400", bg: "bg-slate-50", icon: AlertCircle };

  return (
    <div className="space-y-8 pb-20">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/orders" 
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-col">
           <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <Link href="/admin" className="hover:text-emerald-600">Admin</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/admin/orders" className="hover:text-emerald-600">Đơn hng</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="text-slate-900">Chi tiết</span>
           </div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Chi tiết ơn hng #{order.orderCode}</h1>
        </div>
      </div>

      {/* Main Status Banner */}
      <div className={`rounded-[40px] p-8 ${currentStatus.bg} border-2 border-white shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-8`}>
        <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
           <div className={`h-20 w-20 flex items-center justify-center rounded-[28px] bg-white ${currentStatus.color} shadow-lg ring-4 ring-white`}>
              <currentStatus.icon className="h-10 w-10" />
           </div>
           <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Trạng thi hin tại</p>
              <h2 className={`text-4xl font-black ${currentStatus.color} tracking-tight`}>{currentStatus.label}</h2>
           </div>
        </div>
        <div className="flex items-center gap-4">
           {order.status === "PENDING" && (
             <>
               <button 
                 onClick={handleCancelOrder}
                 className="flex items-center gap-2 rounded-full bg-white border border-rose-200 px-6 py-4 text-sm font-black text-rose-600 hover:bg-rose-50 transition-all shadow-sm active:scale-95"
               >
                 <XCircle className="h-4 w-4" /> Hủy ơn
               </button>
               <button 
                  onClick={handleVerifyPayment}
                  className="flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-black text-white hover:bg-black transition-all shadow-xl shadow-slate-300 active:scale-95"
                >
                  <Globe className="h-4 w-4" /> Check PayOS Status
                </button>
                <button 
                  onClick={handleManualApprove}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-sm font-black text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" /> Duyt thủ cng
                </button>
             </>
           )}
           {order.status === "PAID" && (
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Thanh ton lc</p>
                <p className="text-sm font-black text-slate-900">
                  {order.paidAt ? format(new Date(order.paidAt), "HH:mm, dd/MM/yyyy") : 'N/A'}
                </p>
              </div>
           )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Left Column: Order & Product Info */}
        <div className="lg:col-span-2 space-y-8">
           {/* Credit Bucket Info (If Granted) */}
           {order.status === "PAID" && (
             <section className={`${sectionCard} border-emerald-100 bg-emerald-50/30`}>
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <Zap className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Gi Credits ģ kch hoạt</h3>
                   </div>
                   {order.creditBucket?.isActive ? (
                     <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-500/20">Active</span>
                   ) : (
                     <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-slate-300">Inactive</span>
                   )}
                </div>
                {order.creditBucket ? (
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="p-5 rounded-[32px] bg-white border border-emerald-100 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đ cấp</p>
                       <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat('vi-VN').format(Number(order.creditBucket.creditsTotal))}</p>
                    </div>
                    <div className="p-5 rounded-[32px] bg-white border border-emerald-100 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cn lại</p>
                       <p className="text-xl font-black text-emerald-600">{new Intl.NumberFormat('vi-VN').format(Number(order.creditBucket.creditsRemaining))}</p>
                    </div>
                    <div className="p-5 rounded-[32px] bg-white border border-emerald-100 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hết hạn</p>
                       <p className="text-sm font-black text-slate-900">
                         {order.creditBucket.expiresAt ? format(new Date(order.creditBucket.expiresAt), "dd/MM/yyyy HH:mm") : "Không thời hạn"}
                       </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-6 rounded-[32px] bg-rose-50 border border-rose-100 text-rose-600">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-bold">Đơn đã PAID nhưng chưa thấy bản ghi CreditBucket. Vui lòng kiểm tra lại Ledger.</p>
                  </div>
                )}
             </section>
           )}
           <section className={sectionCard}>
              <div className="flex items-center gap-3 mb-8">
                 <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                   <Package className="h-5 w-5" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900">Thông tin sản phẩm</h3>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                 <div className="space-y-6">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tn sản phẩm</p>
                       <p className="text-lg font-black text-slate-900">{order.product.name}</p>
                       <span className="inline-flex mt-2 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-600 tracking-widest uppercase">
                          {order.product.apiFamily}
                       </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credits</p>
                          <p className="text-lg font-black text-emerald-600">+{new Intl.NumberFormat('vi-VN').format(Number(order.product.credits))}</p>
                       </div>
                       <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời hạn</p>
                          <p className="text-lg font-black text-slate-900">
                            {order.product.durationDays && order.product.durationDays > 0 ? `${order.product.durationDays} ngày` : "Không giới hạn"}
                          </p>
                       </div>
                    </div>
                 </div>
                 <div className="flex flex-col justify-center items-center p-8 rounded-[40px] bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                       <Zap className="h-32 w-32" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-2">Tng thanh ton</p>
                    <p className="text-4xl font-black">{formatVnd(order.amountVnd)}</p>
                    <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest">
                       <CreditCard className="h-3.5 w-3.5" /> 
                       PayOS / Chuyn khoản
                    </div>
                 </div>
              </div>
           </section>

           <section className={sectionCard}>
              <div className="flex items-center gap-3 mb-8">
                 <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                   <Hash className="h-5 w-5" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900">Chi tiết giao dch</h3>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                 {[
                   { label: "M ơn hng h thng", val: `#${order.orderCode}` },
                   { label: "M giao dch PayOS", val: order.payosOrderCode || "N/A" },
                   { label: "Ngy tạo ơn", val: format(new Date(order.createdAt), "dd/MM/yyyy HH:mm:ss") },
                   { label: "ID Sản phẩm", val: order.product.id },
                 ].map((item, i) => (
                   <div key={i} className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{item.val}</span>
                   </div>
                 ))}
              </div>
              {order.status === "PENDING" && order.payosCheckoutUrl && (
                 <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between bg-slate-50 -mx-8 -mb-8 px-8 py-6 rounded-b-[40px]">
                    <div className="flex items-center gap-3">
                       <AlertCircle className="h-5 w-5 text-amber-500" />
                       <p className="text-xs font-bold text-slate-600">Đơn hng ang chờ thanh ton qua cng PayOS.</p>
                    </div>
                    <a 
                       href={order.payosCheckoutUrl} 
                       target="_blank" 
                       className="flex items-center gap-2 text-sm font-black text-blue-600 hover:underline"
                    >
                       M trang thanh ton <ExternalLink className="h-4 w-4" />
                    </a>
                 </div>
              )}
           </section>
        </div>

        {/* Right Column: User Info */}
        <aside className="space-y-8">
           <section className={sectionCard}>
              <div className="flex items-center gap-3 mb-8">
                 <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                   <User className="h-5 w-5" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900">Khch hng</h3>
              </div>
              <div className="flex flex-col items-center text-center">
                 <div className="h-20 w-20 flex items-center justify-center rounded-[28px] bg-slate-100 text-slate-900 text-2xl font-black mb-4 ring-4 ring-slate-50 shadow-sm">
                    {order.user.name[0].toUpperCase()}
                 </div>
                 <h4 className="text-lg font-black text-slate-900">{order.user.name}</h4>
                 <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                    <Mail className="h-3.5 w-3.5" /> {order.user.email}
                 </p>
                 <Link 
                    href={`/admin/users/${order.user.id}`}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-black text-white hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                 >
                    Hồ sơ khách hàng <ArrowRight className="h-4 w-4" />
                 </Link>
              </div>
           </section>

           <section className={`${sectionCard} bg-slate-900 text-white border-none`}>
              <h4 className="text-lg font-black mb-4">Ghi ch h thng</h4>
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                       Đơn hng ny ược xử l thng qua cng thanh ton PayOS Vit Nam.
                    </p>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                       Khi chuyển trạng thái sang PAID, hệ thống sẽ tự động gửi email thông báo và tạo thông báo in-app cho khách hàng.
                    </p>
                 </div>
              </div>
           </section>
        </aside>
      </div>

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
