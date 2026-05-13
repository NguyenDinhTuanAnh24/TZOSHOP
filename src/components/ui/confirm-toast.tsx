"use client";

import { useEffect, useState, type ElementType } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
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

const iconBoxClass: Record<ConfirmDialogType, string> = {
  danger: "bg-[#FF6B6B]",
  warning: "bg-[#FFD93D]",
  info: "bg-[#DBEAFE]",
  primary: "bg-[#DBEAFE]",
  success: "bg-[#C7F0D8]",
};

const confirmButtonClass: Record<ConfirmDialogType, string> = {
  danger: "bg-[#FF6B6B]",
  warning: "bg-[#FFD93D]",
  info: "bg-[#DBEAFE]",
  primary: "bg-[#FFD93D]",
  success: "bg-[#C7F0D8]",
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
  confirmLabel = "XÁC NHẬN",
  cancelLabel = "HỦY",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto border-4 border-black bg-[#FFFDF5] shadow-[10px_10px_0px_0px_#000]">
        <div className="border-b-4 border-black p-5">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center border-4 border-black text-black shadow-[4px_4px_0px_0px_#000] ${iconBoxClass[type]}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black uppercase text-black md:text-2xl">{title}</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-black/75">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t-4 border-black p-5 sm:flex-row sm:justify-end">
          <AppButton
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 w-full border-4 border-black bg-white px-5 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:w-auto"
          >
            {cancelLabel}
          </AppButton>

          <AppButton
            variant="secondary"
            onClick={onConfirm}
            isLoading={isLoading}
            className={`h-11 w-full border-4 border-black px-5 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:w-auto ${confirmButtonClass[type]}`}
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
