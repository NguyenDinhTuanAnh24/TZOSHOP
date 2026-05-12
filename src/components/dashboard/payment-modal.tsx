"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
  X, 
  Clock, 

  CheckCircle2, 
  AlertCircle,
  Copy,
  ChevronRight,
  Zap,
  ShieldCheck
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";

type PaymentData = {
  orderId: string;
  orderCode: string;
  payosOrderCode: string;
  amount: number;
  description: string;
  qrCode: string;
  checkoutUrl: string;
  status: string;
  paymentExpiredAt?: string;
};

type PaymentModalProps = {
  payment: PaymentData;
  onClose: () => void;
  onSuccess: () => void;
  onCancel: (orderId: string) => Promise<void>;
  askConfirm: (config: import("@/hooks/use-confirm").ConfirmState) => void;
};

import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

export function PaymentModal({ payment, onClose, onSuccess, onCancel, askConfirm }: PaymentModalProps) {
  const { toast, showToast, clearToast } = useToast(3000);
  const [status, setStatus] = useState(payment.status);
  const [isChecking, setIsChecking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo đếm ngược
  useEffect(() => {
    if (payment.paymentExpiredAt) {
      const expiry = new Date(payment.paymentExpiredAt).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(diff);
        
        if (diff <= 0) {
          setStatus("EXPIRED");
          if (timerInterval.current) clearInterval(timerInterval.current);
          if (pollInterval.current) clearInterval(pollInterval.current);
        }
      };

      updateTimer();
      timerInterval.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [payment.paymentExpiredAt]);

  const checkStatus = useCallback(async () => {
    if (status === "EXPIRED" || status === "PAID") return;
    
    try {
      setIsChecking(true);
      const res = await fetch(`/api/payments/payos/status?orderId=${payment.orderId}`);
      const data = await res.json();
      
      if (data.status === "PAID") {
        setStatus("PAID");
        if (pollInterval.current) clearInterval(pollInterval.current);
        if (timerInterval.current) clearInterval(timerInterval.current);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else if (data.status === "CANCELLED" || data.status === "EXPIRED") {
        setStatus(data.status);
        if (pollInterval.current) clearInterval(pollInterval.current);
        if (timerInterval.current) clearInterval(timerInterval.current);
        setTimeout(() => {
          onClose(); // Đóng modal nếu đã hủy hoặc hết hạn
        }, 1500);
      }
    } catch (error) {
      console.error("Check status error:", error);
    } finally {
      setIsChecking(false);
    }
  }, [status, payment.orderId, onSuccess, onClose]);

  useEffect(() => {
    // Tự động kiểm tra mỗi 5 giây
    pollInterval.current = setInterval(checkStatus, 5000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [checkStatus]);

  const handleCancel = async () => {
    if (status === "EXPIRED") {
      onClose();
      return;
    }

    askConfirm({
      title: "Hủy thanh toán?",
      description: "Đơn hàng này sẽ bị hủy trên hệ thống và website.",
      confirmLabel: "Hủy thanh toán",
      cancelLabel: "Quay lại",
      type: "danger",
      onConfirm: async () => {
        setIsCancelling(true);
        try {
          await onCancel(payment.orderId);
          if (pollInterval.current) clearInterval(pollInterval.current);
          if (timerInterval.current) clearInterval(timerInterval.current);
        } finally {
          setIsCancelling(false);
        }
      }
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text: string, type: "account" | "content" | "amount") => {
    if (status === "EXPIRED") return;
    navigator.clipboard.writeText(text);
    
    let message = "Đã copy vào bộ nhớ tạm.";
    if (type === "account") message = "Đã copy số tài khoản.";
    if (type === "content") message = "Đã copy nội dung chuyển khoản.";
    if (type === "amount") message = "Đã copy số tiền.";

    showToast(message, "success");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <AppIcon icon={ShieldCheck} className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Thanh toán đơn hàng</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mã đơn: {payment.orderCode}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid gap-8 md:grid-cols-[240px_1fr]">
            {/* Left Column: QR Code */}
            <div className="flex flex-col items-center">
              <div className={`relative group p-4 rounded-3xl bg-slate-50 border-2 border-slate-100 transition-all ${status === "EXPIRED" ? "opacity-50" : "hover:border-emerald-200"}`}>
                <div className={status === "EXPIRED" ? "blur-sm grayscale" : ""}>
                  <QRCodeSVG value={payment.qrCode} size={200} />
                </div>
                
                {status !== "EXPIRED" && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
                      <AppIcon icon={Zap} className="h-3 w-3 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase text-slate-900">Scan to Pay</span>
                    </div>
                  </div>
                )}

                {status === "EXPIRED" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl border border-rose-100 flex flex-col items-center gap-1">
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                      <span className="text-[10px] font-black uppercase text-rose-600">Hết hạn</span>
                    </div>
                  </div>
                )}
              </div>
              
              {status === "PENDING" && timeLeft !== null && (
                <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                  <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                  <span className="text-[11px] font-black text-amber-700 uppercase tracking-tight">
                    Mã QR sẽ hết hạn sau: {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {status === "EXPIRED" && (
                <p className="mt-4 text-[10px] font-black text-rose-500 uppercase tracking-widest">Giao dịch đã hết hạn</p>
              )}
              
              {!status.match(/EXPIRED|PENDING/) && (
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quét bằng ứng dụng ngân hàng</p>
              )}
              
              <div className="mt-6 flex items-center gap-3 py-2 w-full justify-center border-t border-slate-50 pt-6">
                {status === "PAID" ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <AppIcon icon={CheckCircle2} className="h-5 w-5" />
                    <span className="text-sm">Đã nhận thanh toán!</span>
                  </div>
                ) : status === "EXPIRED" ? (
                  <div className="flex items-center gap-2 text-rose-600 font-bold">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm">Thanh toán hết hạn</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-500 font-bold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <span className="text-sm">Đang chờ thanh toán...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Bank Info */}
            <div className={`space-y-5 transition-opacity ${status === "EXPIRED" ? "opacity-40" : ""}`}>
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <div className="h-1 w-4 bg-emerald-500 rounded-full" />
                  Thông tin chuyển khoản
                </h3>
                
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50/50 p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Ngân hàng</p>
                      <p className="text-sm font-bold text-slate-950">BIDV</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Chủ tài khoản</p>
                      <p className="text-sm font-bold text-slate-950">NGUYEN DINH TUAN ANH</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">Số tài khoản</p>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-100 p-3">
                      <span className="text-base font-black text-slate-950 tracking-wider">8878 5506 53</span>
                      <button 
                        disabled={status === "EXPIRED"}
                        onClick={() => copyToClipboard("8878550653", "account")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all disabled:opacity-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">Số tiền</p>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-100 p-3">
                      <span className="text-lg font-black text-emerald-600 tracking-tight">
                        {new Intl.NumberFormat("vi-VN").format(payment.amount)}đ
                      </span>
                      <button 
                        disabled={status === "EXPIRED"}
                        onClick={() => copyToClipboard(payment.amount.toString(), "amount")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all disabled:opacity-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1">Nội dung chuyển khoản</p>
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100 p-3">
                      <span className="font-mono text-sm font-black text-slate-950 uppercase tracking-wider truncate">
                        {payment.description}
                      </span>
                      <button 
                        disabled={status === "EXPIRED"}
                        onClick={() => copyToClipboard(payment.description, "content")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm hover:bg-emerald-600 hover:text-white transition-all shrink-0 disabled:opacity-0"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <button
            disabled={isChecking || status === "PAID" || status === "EXPIRED"}
            onClick={checkStatus}
            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50"
          >
            {isChecking ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              disabled={isCancelling || status === "PAID"}
              onClick={handleCancel}
              className="rounded-full px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
            >
              {status === "EXPIRED" ? "Đóng" : "Hủy đơn"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
