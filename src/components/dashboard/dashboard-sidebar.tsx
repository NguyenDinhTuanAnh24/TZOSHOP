"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { MouseEvent } from "react";
import {
  BookOpenText,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PackageCheck,
  Settings,
  ShoppingCart,
  TicketPercent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
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

function SidebarNavItem({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
  mobile,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  collapsed: boolean;
  mobile: boolean;
  onClick?: () => void;
}) {
  if (active) {
    return (
      <Link
        href={href}
        aria-current="page"
        title={collapsed && !mobile ? label : undefined}
        aria-label={collapsed && !mobile ? label : undefined}
        onClick={onClick}
        className={`group relative block overflow-hidden rounded-2xl p-[2px] ${collapsed && !mobile ? "mx-auto w-11" : ""}`}
      >
        <span className="pointer-events-none absolute inset-[-120%] bg-[conic-gradient(from_0deg,transparent,rgba(99,102,241,0.95),rgba(168,85,247,0.95),rgba(79,70,229,0.95),transparent)] opacity-100 tz-animate-gradient-spin" />
        <span
          className={`relative z-10 flex h-11 items-center gap-3 rounded-[14px] bg-white px-3 text-sm font-bold text-slate-900 shadow-[0_12px_30px_-16px_rgba(79,70,229,0.65)] ${
            collapsed && !mobile ? "justify-center" : ""
          }`}
        >
          <AppIcon icon={Icon} className="h-5 w-5 shrink-0 text-slate-900" strokeWidth={2.25} />
          {(!collapsed || mobile) && <span className="truncate">{label}</span>}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      title={collapsed && !mobile ? label : undefined}
      aria-label={collapsed && !mobile ? label : undefined}
      onClick={onClick}
      className={`group flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:translate-x-1 hover:bg-indigo-50 hover:text-indigo-700 ${
        collapsed && !mobile ? "mx-auto w-11 justify-center px-0 hover:translate-x-0" : ""
      }`}
    >
      <AppIcon icon={Icon} className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600" strokeWidth={2.25} />
      {(!collapsed || mobile) && <span className="truncate">{label}</span>}
    </Link>
  );
}


const navGroups: NavGroup[] = [
  { label: "TỔNG QUAN", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "CREDITS",
    items: [
      { href: "/plans", label: "Mua credits", icon: ShoppingCart },
      { href: "/my-plans", label: "Gói của tôi", icon: PackageCheck },
      { href: "/billing", label: "Thanh toán", icon: CreditCard },
      { href: "/coupons", label: "Mã giảm giá", icon: TicketPercent },
    ],
  },
  {
    label: "API",
    items: [
      { href: "/api-keys", label: "API Keys", icon: KeyRound },
      { href: "/api-docs", label: "Tài liệu API", icon: BookOpenText },
      { href: "/usage", label: "Lịch sử sử dụng", icon: ChartNoAxesColumnIncreasing },
    ],
  },
  {
    label: "TÀI KHOẢN",
    items: [
      { href: "/settings", label: "Cài đặt", icon: Settings },
      { href: "/support", label: "Hỗ trợ", icon: LifeBuoy },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/plans") return pathname === "/plans" || pathname.startsWith("/plans/");
  if (href === "/my-plans") return pathname === "/my-plans" || pathname.startsWith("/my-plans/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const handleRequestLogout = (event?: MouseEvent<HTMLButtonElement>, mobile = false) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (mobile) {
      onCloseMobile();
      window.setTimeout(() => {
        askConfirm({
          title: "Đăng xuất tài khoản?",
          description: "Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng dashboard.",
          confirmLabel: "Đăng xuất",
          cancelLabel: "Hủy",
          type: "danger",
          onConfirm: async () => {
            await signOut({ callbackUrl: "/" });
          },
        });
      }, 120);
      return;
    }

    askConfirm({
      title: "Đăng xuất tài khoản?",
      description: "Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng dashboard.",
      confirmLabel: "Đăng xuất",
      cancelLabel: "Hủy",
      type: "danger",
      onConfirm: async () => {
        await signOut({ callbackUrl: "/" });
      },
    });
  };

  const sidebarBody = (mobile = false) => (
    <>
      <div className="flex h-20 shrink-0 items-center px-3">
        <Link
          href="/dashboard"
          onClick={() => mobile && onCloseMobile()}
          aria-label="TzoShop Dashboard"
          title={collapsed && !mobile ? "TzoShop Dashboard" : undefined}
          className={`flex h-16 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition-all duration-200 hover:border-indigo-200 ${
            collapsed && !mobile ? "mx-auto w-16 justify-center px-0" : ""
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <Image
              src="/logo.png"
              alt="TzoShop"
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>

          {(!collapsed || mobile) && (
            <span className="text-[22px] font-extrabold leading-[1.1] tracking-tight text-slate-950">
              TzoShop
            </span>
          )}
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {(!collapsed || mobile) && (
              <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{group.label}</p>
            )}
            <div className="space-y-2">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <SidebarNavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={active}
                    collapsed={collapsed}
                    mobile={mobile}
                    onClick={() => mobile && onCloseMobile()}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <button
          type="button"
          aria-label={collapsed && !mobile ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-expanded={!collapsed}
          title={collapsed && !mobile ? "Mở rộng sidebar" : undefined}
          onClick={onToggleCollapsed}
          className={`mb-3 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 ${
            collapsed && !mobile
              ? "mx-auto inline-flex h-11 w-11 items-center justify-center"
              : "inline-flex h-11 w-full items-center justify-center gap-2 text-center text-sm font-semibold"
          }`}
        >
          {collapsed && !mobile ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {(!collapsed || mobile) && <span className="leading-none">Thu gọn</span>}
        </button>

        <button
          type="button"
          title={collapsed && !mobile ? "Đăng xuất" : undefined}
          onClick={(event) => handleRequestLogout(event, mobile)}
          className={`rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition-colors duration-200 hover:bg-rose-100 ${
            collapsed && !mobile
              ? "mx-auto inline-flex h-11 w-11 items-center justify-center"
              : "inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
          }`}
        >
          <LogOut className="h-5 w-5" />
          {(!collapsed || mobile) && "Đăng xuất"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-200 bg-white lg:flex ${
          collapsed ? "w-24" : "w-[260px]"
        }`}
      >
        {sidebarBody(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onCloseMobile} />
          <aside className="relative z-[81] flex h-full w-[280px] max-w-[86vw] flex-col border-r border-slate-200 bg-white">{sidebarBody(true)}</aside>
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
