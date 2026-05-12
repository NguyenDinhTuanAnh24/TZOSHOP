import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui-tokens";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-[#dfe5e1] shadow-sm", className)}>
      <div className="flex items-center gap-6">
        {icon && (
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#0b0f0d] text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
            {icon}
          </div>
        )}
        <div>
          <h1 className={ui.h2}>{title}</h1>
          {description && (
            <p className="text-[#47524d] font-bold mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
