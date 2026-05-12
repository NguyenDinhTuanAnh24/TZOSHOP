"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "./icon-button";

type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  maxWidthClassName?: string;
};

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  maxWidthClassName = "max-w-2xl",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div
        className={`w-full ${maxWidthClassName} overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            {title ? (
              <h2 className="text-lg font-black text-slate-950">{title}</h2>
            ) : null}

            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>

          <IconButton
            onClick={onClose}
            aria-label="Đóng"
            variant="ghost"
            className="h-10 w-10 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
