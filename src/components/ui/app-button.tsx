import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { ui } from "@/lib/ui-tokens";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "secondary" | "danger" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AppButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: ui.buttonPrimary,
      accent: ui.buttonAccent,
      secondary: ui.buttonSecondary,
      danger: "inline-flex items-center justify-center rounded-full bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 ease-out hover:bg-rose-700 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:ring-offset-2",
      ghost: "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold text-[#47524d] transition-all duration-150 ease-out hover:bg-slate-100 hover:text-slate-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2",
      dark: "inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 ease-out hover:bg-slate-800 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40 focus-visible:ring-offset-2",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          variants[variant],
          size !== "md" && sizes[size], // Override default padding if size is not md
          (disabled || isLoading) && "btn-disabled",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
        ) : null}
        {!isLoading && leftIcon && <span className="mr-2 shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

AppButton.displayName = "AppButton";

export { AppButton };
