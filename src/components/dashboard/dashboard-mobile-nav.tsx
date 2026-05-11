"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardBrand from "./dashboard-brand";

import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Wallet,
  KeyRound, 
  CreditCard, 
  UserRound,
  Zap,
  ArrowRight,
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

export default function DashboardMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleRequestLogout = () => {
    setOpen(false); // Đóng menu trước khi mở confirm
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
    <>
      {/* Nút menu trên topbar mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          inline-flex h-10 w-10 items-center justify-center rounded-full
          border border-black/10 bg-white text-[#0b0f0d]
          shadow-sm transition hover:bg-[#f4f8f6]
          lg:hidden
        "
        aria-label="Mở menu"
      >
        <span className="sr-only">Mở menu</span>
        <span className="flex flex-col gap-1.5">
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="block h-0.5 w-5 rounded-full bg-current" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          {/* Overlay */}
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu"
          />

          {/* Drawer */}
          <aside className="relative z-10 flex h-dvh w-[82vw] max-w-[340px] flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-5">
              <DashboardBrand />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-2xl font-bold hover:bg-[#f4f8f6]"
                aria-label="Đóng menu"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <nav className="space-y-1.5 px-4 py-6">
                {menuItems.map((item) => {
                  const isActive = item.activePaths.some(p => pathname === p || pathname.startsWith(p + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-black transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <AppIcon icon={item.icon} className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="px-4 pb-6 mt-4">
                <div className="rounded-[32px] border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AppIcon icon={Zap} className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      Cần thêm Credits?
                    </p>
                  </div>
                  <p className="text-xs font-bold leading-5 text-slate-500">
                    Nạp thêm credits ngay để trải nghiệm các dòng AI mạnh mẽ nhất không bị gián đoạn.
                  </p>

                  <Link
                    href="/plans"
                    onClick={() => setOpen(false)}
                    className="mt-6 flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-black text-white transition hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                  >
                    Mua ngay
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-black/5 px-4 py-6 space-y-4">
              {session?.user && (
                <div className="flex items-center gap-3 px-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 ring-2 ring-white">
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
          </aside>
        </div>
      )}

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
    </>
  );
}
