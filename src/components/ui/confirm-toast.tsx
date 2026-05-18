"use client";

import { useEffect, useState, type ElementType } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmDialogType = "danger" | "warning" | "info" | "primary" | "success";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmDialogType;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

const iconBoxClass: Record<ConfirmDialogType, string> = {
  danger: "bg-rose-50 text-rose-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-indigo-50 text-indigo-600",
  primary: "bg-indigo-50 text-indigo-600",
  success: "bg-emerald-50 text-emerald-600",
};

const confirmButtonClass: Record<ConfirmDialogType, string> = {
  danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  warning: "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  info: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-[0_10px_24px_-12px_rgba(79,70,229,0.45)]",
  primary: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-[0_10px_24px_-12px_rgba(79,70,229,0.45)]",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
};

const Icons: Record<ConfirmDialogType, ElementType> = {
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
  primary: Info,
  success: CheckCircle2,
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  type = "warning",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const Icon = Icons[type];

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", iconBoxClass[type])}>
            <Icon className="h-5 w-5" />
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            disabled={isLoading}
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-extrabold text-slate-950">{title}</h2>
        <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
              confirmButtonClass[type],
            )}
          >
            {isLoading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
