"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className={`w-full max-w-[calc(100vw-2rem)] ${maxWidthClassName} max-h-[90vh] overflow-y-auto border-4 border-black bg-[#FFFDF5] shadow-[10px_10px_0px_0px_#000]`}>
        <div className="flex items-center justify-between gap-4 border-b-4 border-black p-5">
          <div>
            {title ? <h2 className="text-xl font-black text-black md:text-2xl">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm font-bold text-black/70">{description}</p> : null}
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng"
            className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000] transition-all duration-100 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 md:p-6">{children}</div>

        {footer ? <div className="flex flex-col-reverse gap-3 border-t-4 border-black p-5 sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}
