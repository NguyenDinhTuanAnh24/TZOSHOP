"use client";

import { useEffect, useState, ElementType } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { AppButton } from "./app-button";

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

const iconStyles: Record<ConfirmDialogType, string> = {
  danger: "bg-rose-50 text-rose-600 ring-rose-100",
  warning: "bg-amber-50 text-amber-600 ring-amber-100",
  info: "bg-sky-50 text-sky-600 ring-sky-100",
  primary: "bg-blue-50 text-blue-600 ring-blue-100",
  success: "bg-emerald-50 text-emerald-600 ring-emerald-100",
};


const Icons: Record<ConfirmDialogType, ElementType> = {
  danger: AlertTriangle,
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

  if (!open || !mounted) return null;

  const Icon = Icons[type];

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${iconStyles[type]}`}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-950">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <AppButton
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6"
          >
            {cancelLabel}
          </AppButton>

          <AppButton
            variant={type === "danger" ? "danger" : type === "primary" ? "primary" : "accent"}
            onClick={onConfirm}
            isLoading={isLoading}
            className="px-6"
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
