"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  Boxes,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Server,
  ShoppingCart,
  TicketPercent,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/admin/revenue", label: "Doanh thu", icon: TrendingUp },
    ],
  },
  {
    label: "Kinh doanh",
    items: [
      { href: "/admin/users", label: "Người dùng", icon: Users },
      { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
      { href: "/admin/products", label: "Gói credits", icon: Boxes },
      { href: "/admin/coupons", label: "Mã giảm giá", icon: TicketPercent },
    ],
  },
  {
    label: "Hệ thống API",
    items: [
      { href: "/admin/models", label: "Models", icon: Boxes },
      { href: "/admin/providers", label: "Providers", icon: Server },
      { href: "/admin/usage", label: "Lịch sử dùng", icon: Activity },
    ],
  },
  {
    label: "Hỗ trợ",
    items: [{ href: "/admin/support", label: "Ticket hỗ trợ", icon: LifeBuoy }],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/system", label: "Trạng thái hệ thống", icon: Activity },
      { href: "/admin/audit-logs", label: "Audit logs", icon: ClipboardList },
    ],
  },
];

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const requestLogout = () => {
    setOpen(false);
    window.setTimeout(() => {
      askConfirm({
        title: "Đăng xuất khỏi Admin?",
        description: "Bạn sẽ cần đăng nhập lại để tiếp tục quản lý hệ thống TzoShop.",
        confirmLabel: "Đăng xuất",
        cancelLabel: "Ở lại",
        type: "danger",
        onConfirm: async () => {
          await signOut({ callbackUrl: "/" });
        },
      });
    }, 120);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 lg:hidden"
        aria-label="Mở menu admin"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && typeof window !== "undefined"
        ? createPortal(
            <>
          <div className="fixed inset-0 z-[80] lg:hidden">
            <button
              type="button"
              aria-label="Đóng menu"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <aside className="relative z-[81] flex h-dvh w-[min(320px,calc(100vw-1.5rem))] flex-col overflow-hidden border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-4">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex h-14 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm"
              >
                <Image src="/logo.png" alt="TzoShop" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" priority />
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold leading-tight text-slate-950">TzoShop</p>
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">Admin Panel</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-6">
                {navGroups.map((group) => (
                  <section key={group.label} className="space-y-2">
                    <p className="px-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{group.label}</p>

                    <div className="space-y-1.5">
                      {group.items.map((item) => {
                        const active = isActive(item.href, pathname);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "group relative flex h-11 items-center gap-3 overflow-hidden rounded-2xl px-3 text-sm font-semibold transition-all duration-300",
                              active
                                ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-[0_16px_36px_-18px_rgba(79,70,229,0.85)]"
                                : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                            )}
                          >
                            {active ? (
                              <>
                                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/18 via-white/8 to-transparent" />
                                <span className="pointer-events-none absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
                              </>
                            ) : null}

                            <item.icon
                              className={cn(
                                "relative z-10 h-5 w-5 shrink-0 transition",
                                active ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                              )}
                            />
                            <span className="relative z-10 truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </nav>

            <div className="shrink-0 border-t border-slate-200 bg-white p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mb-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
              >
                <ChevronLeft className="h-4 w-4" />
                Thu gọn
              </button>
              <button
                type="button"
                onClick={requestLogout}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
            </aside>
          </div>
            </>,
            document.body
          )
        : null}

      {confirmState ? (
        <ConfirmDialog
          open={Boolean(confirmState)}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      ) : null}
    </>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
