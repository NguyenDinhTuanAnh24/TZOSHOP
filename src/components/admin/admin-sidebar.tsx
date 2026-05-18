"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  ShoppingCart,
  TicketPercent,
  TrendingUp,
  Users,
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

const adminNavGroups: NavGroup[] = [
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

export default function AdminSidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const handleLogout = () => {
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
  };

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white/90 backdrop-blur-xl transition-all duration-300 ease-out lg:flex lg:flex-col",
          collapsed ? "w-[88px]" : "w-[280px]",
        )}
      >
        <div className="flex h-20 items-center px-3">
          <Link
            href="/admin"
            title="TzoShop Admin Panel"
            className={cn(
              "flex h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30",
              collapsed ? "mx-auto w-14 justify-center px-0" : "w-full",
            )}
          >
            <Image src="/logo.png" alt="TzoShop" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" priority />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold leading-[1.15] text-slate-950">TzoShop</p>
                <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Admin Panel</p>
              </div>
            ) : null}
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {adminNavGroups.map((group) => (
            <section key={group.label}>
              {!collapsed ? <p className="px-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{group.label}</p> : <div className="mx-auto h-px w-7 bg-slate-200" />}
              <div className={cn("mt-2 space-y-1.5", collapsed && "mt-3")}>
                {group.items.map((item) => {
                  const active = isActive(item.href, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex h-11 items-center gap-3 overflow-hidden rounded-2xl px-3 text-sm font-semibold transition-all duration-300 ease-out",
                        collapsed ? "mx-auto h-12 w-12 justify-center px-0" : "",
                        active
                          ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-[0_16px_36px_-18px_rgba(79,70,229,0.85)] hover:translate-x-0 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60"
                          : "text-slate-600 hover:translate-x-0.5 hover:bg-indigo-50 hover:text-indigo-700",
                      )}
                    >
                      {active ? (
                        <>
                          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/18 via-white/8 to-transparent" />
                          <span className="pointer-events-none absolute -right-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-white/15 blur-2xl" />
                          <span className="pointer-events-none absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
                        </>
                      ) : null}

                      <item.icon
                        className={cn(
                          "relative z-10 h-5 w-5 shrink-0 transition-all duration-300",
                          active ? "text-white drop-shadow-sm" : "text-slate-400 group-hover:scale-110 group-hover:text-indigo-600",
                        )}
                      />
                      {!collapsed ? <span className={cn("relative z-10 truncate", active ? "text-white" : "")}>{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "mb-3 flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]",
              collapsed ? "mx-auto w-11" : "w-full gap-2",
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed ? <span>Thu gọn</span> : null}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "flex h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98]",
              collapsed ? "mx-auto w-11" : "w-full gap-2",
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed ? <span>Đăng xuất</span> : null}
          </button>
        </div>
      </aside>

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
