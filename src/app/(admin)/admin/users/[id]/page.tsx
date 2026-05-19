"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { 
  Mail, 
  ChevronLeft, 
  Wallet, 
  KeyRound, 
  ShoppingCart, 
  Activity, 
  Clock,
  ShieldAlert,
  Zap,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { formatVnd, translateStatus } from "@/lib/format";
import { PageLoader } from "@/components/ui/app-loader";

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    orders: number;
    apiKeys: number;
    creditBuckets: number;
    usageLogs: number;
    supportTickets: number;
  };
  creditBuckets: {
    id: string;
    creditsRemaining: string;
    creditsTotal: string;
    apiFamily: string;
    isActive: boolean;
    expiresAt: string | null;
    product: { name: string; slug?: string } | null;
  }[];
  apiKeys: {
    id: string;
    name: string;
    displayKey: string;
    isActive: boolean;
    revokedAt: string | null;
    lastUsedAt: string | null;
  }[];
  orders: {
    id: string;
    orderCode: string;
    amountVnd: number;
    status: string;
    createdAt: string;
    product: { name: string } | null;
  }[];
};

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast, showToast, clearToast } = useToast();

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/users/${id}`);
      const result = await res.json();
      if (result.success) {
        setUser(result.data);
      } else {
        showToast(result.error?.message || "Không thể tải thông tin.", "error");
      }
    } catch {
      showToast("Lỗi kết nối.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUser();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchUser]);

  if (isLoading) {
    return <PageLoader label="Đang tải thông tin người dùng..." />;
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-900">Không tìm thấy người dùng.</h2>
        <Link href="/admin/users" className="mt-4 inline-flex text-emerald-600 font-bold hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const sectionCard = "rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50";

  return (
    <div className="space-y-8 pb-20">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/users" 
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-col">
           <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <Link href="/admin" className="hover:text-emerald-600">Admin</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <Link href="/admin/users" className="hover:text-emerald-600">Khách hàng</Link>
              <ChevronLeft className="h-3 w-3 rotate-180" />
              <span className="text-slate-900">Chi tiết</span>
           </div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Thông tin khách hàng</h1>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className={`${sectionCard} lg:col-span-2 flex flex-col sm:flex-row gap-8 items-center sm:items-start`}>
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[40px] bg-slate-900 text-white text-4xl font-black shadow-2xl shadow-slate-200 ring-8 ring-slate-50">
            {user.name[0].toUpperCase()}
          </div>
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h2 className="text-3xl font-black text-slate-900">{user.name}</h2>
                <span className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/10' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10'}`}>
                  {user.role}
                </span>
              </div>
              <p className="mt-1 text-slate-500 font-bold flex items-center justify-center sm:justify-start gap-2">
                <Mail className="h-4 w-4" /> {user.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 pt-4 border-t border-slate-100">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Khách hàng</p>
                  <p className="text-sm font-mono font-bold text-slate-900">{user.id}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gia nhập ngày</p>
                  <p className="text-sm font-bold text-slate-900">
                    {format(new Date(user.createdAt), "dd MMMM, yyyy", { locale: vi })}
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           {[
             { label: "Đơn hàng", val: user._count.orders, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
             { label: "Gói active", val: user._count.creditBuckets, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "API Keys", val: user._count.apiKeys, icon: KeyRound, color: "text-amber-600", bg: "bg-amber-50" },
             { label: "Lượt gọi", val: user._count.usageLogs, icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
           ].map((stat, i) => (
             <div key={i} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div className={`h-10 w-10 flex items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.val}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* Active Credit Buckets */}
        <section className={sectionCard}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                 <Wallet className="h-5 w-5" />
               </div>
               <h3 className="text-xl font-black text-slate-900">Các gói Credits</h3>
            </div>
          </div>
          <div className="space-y-4">
            {user.creditBuckets.length === 0 ? (
              <p className="text-sm font-bold text-slate-400 italic py-4">Chưa sở hữu gói nào.</p>
            ) : (
              user.creditBuckets.map((bucket) => (
                <div key={bucket.id} className="group relative rounded-3xl border border-slate-100 bg-slate-50/30 p-5 transition-all hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{bucket.product?.name || 'Gói Credits'}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        {bucket.product?.slug?.startsWith("all_models_") ? "All Models" : bucket.apiFamily}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600">
                        {new Intl.NumberFormat('vi-VN').format(Number(bucket.creditsRemaining))}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        / {new Intl.NumberFormat('vi-VN').format(Number(bucket.creditsTotal))} Credits
                      </p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (Number(bucket.creditsRemaining) / Number(bucket.creditsTotal)) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                    <span className="flex items-center gap-1.5">
                       <Clock className="h-3.5 w-3.5" />
                       Hết hạn: {bucket.expiresAt ? format(new Date(bucket.expiresAt), "dd/MM/yyyy") : "Không thời hạn"}
                    </span>
                    <span className={bucket.isActive ? "text-emerald-600" : "text-rose-500"}>
                      {bucket.isActive ? "Đang kích hoạt" : "Đã khóa"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* API Keys */}
        <section className={sectionCard}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                 <KeyRound className="h-5 w-5" />
               </div>
               <h3 className="text-xl font-black text-slate-900">API Keys</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">An toàn bảo mật</span>
          </div>
          <div className="space-y-3">
            {user.apiKeys.length === 0 ? (
              <p className="text-sm font-bold text-slate-400 italic py-4">Chưa tạo API Key.</p>
            ) : (
              user.apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                       <p className="text-sm font-black text-slate-900 truncate">{key.name}</p>
                       <span className={`h-1.5 w-1.5 rounded-full ${key.isActive && !key.revokedAt ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <code className="text-[11px] font-mono font-bold text-slate-400 mt-1 block tracking-tighter">
                      {key.displayKey}
                    </code>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sử dụng cuối</p>
                    <p className="text-[11px] font-bold text-slate-900">
                      {key.lastUsedAt ? format(new Date(key.lastUsedAt), "dd/MM HH:mm") : 'Chưa dùng'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Orders */}
        <section className={sectionCard}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                 <ShoppingCart className="h-5 w-5" />
               </div>
               <h3 className="text-xl font-black text-slate-900">Đơn hàng gần nhất</h3>
            </div>
            <Link href="/admin/orders" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-2">
            {user.orders.length === 0 ? (
              <p className="text-sm font-bold text-slate-400 italic py-4">Chưa có đơn hàng.</p>
            ) : (
              user.orders.map((order) => (
                <Link 
                  key={order.id} 
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between rounded-2xl p-4 transition-all hover:bg-slate-50 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-white transition-all shadow-sm">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">#{order.orderCode}</p>
                      <p className="text-[11px] font-bold text-slate-400">{order.product?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatVnd(order.amountVnd)}</p>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      order.status === 'PAID' ? 'text-emerald-600' : 
                      order.status === 'CANCELLED' ? 'text-rose-500' : 
                      'text-amber-500'
                    }`}>
                      {translateStatus(order.status)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Admin Actions */}
        <section className={`${sectionCard} border-rose-100 bg-rose-50/10`}>
          <div className="flex items-center gap-3 mb-8">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
               <ShieldAlert className="h-5 w-5" />
             </div>
             <h3 className="text-xl font-black text-slate-900">Thao tác quản trị</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <button 
               onClick={() => showToast("Tính năng đang phát triển", "info")}
               className="flex flex-col items-center justify-center gap-3 rounded-[32px] border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 group"
            >
              <Zap className="h-6 w-6 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-black text-slate-900">Tặng Credits</span>
            </button>
            <button 
               onClick={() => showToast("Tính năng đang phát triển", "info")}
               className="flex flex-col items-center justify-center gap-3 rounded-[32px] border border-slate-200 bg-white p-6 transition-all hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 group"
            >
              <AlertTriangle className="h-6 w-6 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-black text-slate-900">Tạm khóa TK</span>
            </button>
          </div>
          <div className="mt-8 pt-8 border-t border-rose-100 text-center">
             <p className="text-xs font-bold text-slate-400 italic">
               Mọi thao tác thay đổi dữ liệu sẽ được ghi lại trong Audit Logs.
             </p>
          </div>
        </section>
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
