"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  TicketPercent, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Tag
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { AppCard } from "@/components/ui/app-card";
import { AppButton } from "@/components/ui/app-button";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<{ available: Coupon[]; used: Coupon[] }>({
    available: [],
    used: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "used">("available");

  const { toast, showToast, clearToast } = useToast();

  const loadCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/coupons/my");
      const result = await res.json();
      if (result.success) {
        setCoupons(result.data);
      }
    } catch {
      showToast("Không thể tải danh sách mã giảm giá.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCoupons();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCoupons]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("Đã sao chép mã giảm giá!", "success");
  };

  const formatVnd = (val: number) => new Intl.NumberFormat("vi-VN").format(val) + "đ";

  const renderCouponCard = (coupon: Coupon, type: "available" | "used") => {
    return (
      <AppCard key={coupon.id} className={cn(
        "relative overflow-hidden group transition-all hover:shadow-lg",
        type === "used" && "opacity-75 grayscale-[0.5]"
      )}>
        {/* Ticket-like pattern */}
        <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-white border border-slate-200" />
        <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-white border border-slate-200" />
        
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                type === "available" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
              )}>
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{coupon.name}</h3>
                <code className="text-xs font-black text-emerald-600 uppercase tracking-widest">{coupon.code}</code>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600">-{coupon.discountPercent}%</p>
              <p className={cn(ui.label, "text-[10px]")}>GIẢM GIÁ</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-dashed border-slate-100 pt-6">
            {coupon.description && (
              <p className="text-sm text-slate-600 line-clamp-2">{coupon.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={ui.label}>Đơn tối thiểu</p>
                <p className="text-sm font-bold text-slate-900">{formatVnd(coupon.minOrderAmount)}</p>
              </div>
              {coupon.maxDiscountVnd && (
                <div>
                  <p className={ui.label}>Giảm tối đa</p>
                  <p className="text-sm font-bold text-slate-900">{formatVnd(coupon.maxDiscountVnd)}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {coupon.endsAt 
                ? `Hết hạn: ${format(new Date(coupon.endsAt), "dd/MM/yyyy", { locale: vi })}` 
                : "Vô thời hạn"}
            </div>
          </div>

          <div className="mt-6">
            {type === "available" ? (
              <AppButton 
                onClick={() => copyToClipboard(coupon.code)}
                variant="secondary"
                className="w-full h-10 font-black"
              >
                <Copy className="h-4 w-4 mr-2" />
                SAO CHÉP MÃ
              </AppButton>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-slate-400">
                <CheckCircle2 className="h-4 w-4" />
                ĐÃ SỬ DỤNG
              </div>
            )}
          </div>
        </div>
      </AppCard>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Kho mã giảm giá" 
        description="Quản lý và sử dụng các mã ưu đãi dành riêng cho bạn."
        icon={<TicketPercent className="h-8 w-8 text-emerald-600" />}
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-50 p-1.5 w-fit">
            <button
              onClick={() => setActiveTab("available")}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-black transition-all",
                activeTab === "available" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              CÓ THỂ DÙNG ({coupons.available.length})
            </button>
            <button
              onClick={() => setActiveTab("used")}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-black transition-all",
                activeTab === "used" ? "bg-white text-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              ĐÃ DÙNG ({coupons.used.length})
            </button>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2].map(i => (
                <div key={i} className="h-[300px] animate-pulse rounded-[32px] bg-slate-100" />
              ))}
            </div>
          ) : coupons[activeTab].length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
                <TicketPercent className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Chưa có mã giảm giá</h3>
              <p className={cn(ui.pMuted, "mt-1")}>Bạn hiện không có mã giảm giá nào trong mục này.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {coupons[activeTab].map(c => renderCouponCard(c, activeTab))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <aside className="w-full lg:w-80 space-y-6">
          <AppCard className="p-6 bg-emerald-50/50 border-emerald-100">
            <div className="flex items-center gap-3 text-emerald-700 mb-4">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-black tracking-tight">Lưu ý sử dụng</h3>
            </div>
            <ul className="space-y-3 text-xs font-bold text-emerald-700/70 leading-relaxed">
              <li>• Mỗi đơn hàng chỉ áp dụng tối đa 1 mã giảm giá.</li>
              <li>• Mã giảm giá chỉ có hiệu lực khi đơn hàng thanh toán thành công.</li>
              <li>• Nếu đơn hàng bị hủy hoặc hết hạn, mã sẽ được hoàn lại kho.</li>
            </ul>
          </AppCard>
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
