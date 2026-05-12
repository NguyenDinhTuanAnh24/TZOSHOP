import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui-tokens";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "interactive" | "muted";
}

const AppCard = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: ui.card,
      interactive: ui.cardInteractive,
      muted: ui.cardMuted,
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], "p-6", className)}
        {...props}
      />
    );
  }
);

AppCard.displayName = "AppCard";

export { AppCard };
