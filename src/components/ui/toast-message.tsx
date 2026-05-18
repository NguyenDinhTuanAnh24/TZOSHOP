"use client";

import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

type ToastMessageProps = {
  message: string;
  type?: ToastType;
  onClose?: () => void;
};

const toastStyles: Record<ToastType, string> = {
  success: "border-emerald-100",
  error: "border-rose-100",
  warning: "border-amber-100",
  info: "border-indigo-100",
};

const iconStyles: Record<ToastType, string> = {
  success: "bg-emerald-50 text-emerald-600",
  error: "bg-rose-50 text-rose-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-indigo-50 text-indigo-600",
};

const icons: Record<ToastType, ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastMessage({ message, type = "success", onClose }: ToastMessageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => {
      window.clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  if (!message || !mounted) return null;
  const Icon = icons[type];

  const toast = (
    <div
      className="fixed right-4 top-20 z-[12000] w-[calc(100vw-2rem)] max-w-[360px] animate-in fade-in slide-in-from-top-2 duration-200 sm:right-6 sm:top-24"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex w-full max-w-[360px] gap-3 rounded-2xl border bg-white/95 p-3 shadow-[0_18px_45px_-24px_rgba(79,70,229,0.35)] backdrop-blur-xl ${toastStyles[type]}`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconStyles[type]}`}>
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-950">{message}</p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
