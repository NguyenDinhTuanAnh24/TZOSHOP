"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "warning" | "info";

type ToastMessageProps = {
  message: string;
  type?: ToastType;
  onClose?: () => void;
};

const toastStyles: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

const iconStyles: Record<ToastType, string> = {
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-rose-100 text-rose-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-sky-100 text-sky-700",
};

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "!",
  warning: "!",
  info: "i",
};

export function ToastMessage({
  message,
  type = "success",
  onClose,
}: ToastMessageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => {
      window.clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  if (!message || !mounted) return null;

  const toast = (
    <div className="fixed right-6 top-24 z-[10000] w-[calc(100%-3rem)] max-w-md animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-xl shadow-slate-900/10 ${toastStyles[type]}`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${iconStyles[type]}`}
        >
          {icons[type]}
        </span>

        <p className="flex-1 leading-6">{message}</p>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 text-lg leading-none opacity-60 transition hover:opacity-100"
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
