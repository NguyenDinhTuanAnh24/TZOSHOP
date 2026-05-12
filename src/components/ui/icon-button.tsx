import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "ghost" | "dark" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "outline", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      outline: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-300 hover:shadow-md",
      ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      dark: "border-transparent bg-slate-950 text-white hover:bg-slate-800 hover:shadow-md",
      danger: "border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700",
      success: "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700",
    };

    const sizes = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border shadow-sm transition-all duration-150 ease-out",
          "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-60",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export { IconButton };
