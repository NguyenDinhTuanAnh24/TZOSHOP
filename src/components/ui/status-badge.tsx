import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui-tokens";

interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
  className?: string;
}

export function StatusBadge({ status, variant = "neutral", className }: StatusBadgeProps) {
  const variants = {
    success: ui.badgeSuccess,
    warning: ui.badgeWarning,
    danger: ui.badgeDanger,
    neutral: ui.badgeNeutral,
    info: "bg-blue-50 text-blue-600 border border-blue-100",
  };

  return (
    <span className={cn(ui.badge, variants[variant], className)}>
      {status}
    </span>
  );
}
