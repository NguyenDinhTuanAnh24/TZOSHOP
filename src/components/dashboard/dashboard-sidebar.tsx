"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardBrand from "./dashboard-brand";
import { buttonStyles } from "@/lib/ui-styles";

import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Wallet,
  KeyRound, 
  CreditCard, 
  UserRound,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";

const menuItems = [
  { 
    href: "/dashboard", 
    label: "Tổng quan", 
    icon: LayoutDashboard,
    activePaths: ["/dashboard"]
  },
  { 
    href: "/plans", 
    label: "Credits", 
    icon: Wallet,
    activePaths: ["/plans", "/my-plans"]
  },
  { 
    href: "/api-keys", 
    label: "API", 
    icon: KeyRound,
    activePaths: ["/api-keys", "/api-docs", "/usage"]
  },
  { 
    href: "/billing", 
    label: "Thanh toán", 
    icon: CreditCard,
    activePaths: ["/billing"]
  },
  { 
    href: "/settings", 
    label: "Tài khoản", 
    icon: UserRound,
    activePaths: ["/settings", "/support"]
  },
];

import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const handleRequestLogout = () => {
    askConfirm({
      title: "Đăng xuất tài khoản?",
      description: "Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng dashboard.",
      confirmLabel: "Đăng xuất",
      cancelLabel: "Hủy",
      type: "danger",
      onConfirm: async () => {
        await signOut({ callbackUrl: "/login" });
      },
    });
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      {/* Logo */}
      <div className="shrink-0 border-b border-black/5 px-4 py-5">
        <DashboardBrand />
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = item.activePaths.some(p => pathname === p || pathname.startsWith(p + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <AppIcon icon={item.icon} className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User & Logout */}
      <div className="shrink-0 border-t border-black/5 px-3 py-4 space-y-3">
        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 ring-2 ring-white">
              {session.user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {session.user.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {session.user.email}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleRequestLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>

      {confirmState && (
        <ConfirmDialog
          open={!!confirmState}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
