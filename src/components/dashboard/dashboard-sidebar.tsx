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

function TzoShopLogo({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="TzoShop"
      width={size}
      height={size}
      className={`h-auto w-auto object-contain ${className}`}
      priority
    />
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
    if (mobile) onCloseMobile();
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

  const sidebarBody = (mobile = false) => (
    <>
      <div className="flex h-20 shrink-0 items-center justify-center border-b-4 border-black px-3">
        <Link
          href="/dashboard"
          onClick={() => mobile && onCloseMobile()}
          aria-label="TzoShop Dashboard"
          title={collapsed && !mobile ? "TzoShop Dashboard" : undefined}
          className={`inline-flex max-w-full items-center gap-3 text-black transition-all duration-100 ease-linear ${
            collapsed && !mobile ? "mx-auto justify-center" : ""
          }`}
        >
          {collapsed && !mobile ? <TzoShopLogo size={34} /> : <TzoShopLogo size={30} />}
          {(!collapsed || mobile) && (
            <span className="min-w-0 truncate text-xl font-black uppercase leading-none tracking-tight text-black md:text-2xl">TZOSHOP</span>
          )}
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {(!collapsed || mobile) && (
              <p className="mb-2 mt-5 px-3 text-[11px] font-black uppercase tracking-[0.12em] text-black/55">{group.label}</p>
            )}
            <div className="space-y-2">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed && !mobile ? item.label : undefined}
                    aria-label={collapsed && !mobile ? item.label : undefined}
                    onClick={() => mobile && onCloseMobile()}
                    className={`flex h-11 items-center gap-3 border-4 px-3 text-sm font-bold text-black transition-all ${
                      collapsed && !mobile ? "justify-center" : ""
                    } ${
                      active
                        ? "border-black bg-[#FFD93D] font-black shadow-[4px_4px_0px_0px_#000]"
                        : "border-transparent hover:-translate-y-0.5 hover:border-black hover:bg-[#FFD93D] hover:shadow-[3px_3px_0px_0px_#000]"
                    }`}
                  >
                    <AppIcon icon={item.icon} className="h-5 w-5 shrink-0 text-black" strokeWidth={2.5} />
                    {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t-4 border-black bg-[#FFFDF5] p-3">
        <button
          type="button"
          aria-label={collapsed && !mobile ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-expanded={!collapsed}
          title={collapsed && !mobile ? "Mở rộng sidebar" : undefined}
          onClick={onToggleCollapsed}
          className={`mb-3 border-4 border-black bg-white font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            collapsed && !mobile ? "mx-auto inline-flex h-11 w-11 items-center justify-center" : "inline-flex h-11 w-full items-center justify-center gap-2 text-center"
          }`}
        >
          {collapsed && !mobile ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {(!collapsed || mobile) && <span className="leading-none">THU GỌN</span>}
        </button>

        <button
          type="button"
          title={collapsed && !mobile ? "Đăng xuất" : undefined}
          onClick={(event) => handleRequestLogout(event, mobile)}
          className={`border-4 border-black bg-[#FF6B6B] font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            collapsed && !mobile ? "mx-auto flex h-11 w-11 items-center justify-center" : "flex h-11 w-full items-center justify-center gap-2"
          }`}
        >
          <LogOut className="h-5 w-5" />
          {(!collapsed || mobile) && "ĐĂNG XUẤT"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r-4 border-black bg-[#FFFDF5] lg:flex ${
          collapsed ? "w-20" : "w-[250px]"
        }`}
      >
        {sidebarBody(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="relative z-10 flex h-full w-[280px] flex-col border-r-4 border-black bg-[#FFFDF5]">{sidebarBody(true)}</aside>
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
