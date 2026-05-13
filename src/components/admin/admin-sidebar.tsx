"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  BarChart3,
  Boxes,
  ChevronRight,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PanelLeftClose,
  ScrollText,
  ServerCog,
  ShoppingCart,
  TicketPercent,
  Users,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { useConfirm } from "@/hooks/use-confirm";

const menuGroups = [
  {
    title: "TỔNG QUAN",
    items: [
      { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/admin/revenue", label: "Doanh thu", icon: BarChart3 },
    ],
  },
  {
    title: "KINH DOANH",
    items: [
      { href: "/admin/users", label: "Người dùng", icon: Users },
      { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
      { href: "/admin/products", label: "Gói credits", icon: Boxes },
      { href: "/admin/coupons", label: "Mã giảm giá", icon: TicketPercent },
    ],
  },
  {
    title: "HỆ THỐNG API",
    items: [
      { href: "/admin/models", label: "Models", icon: Boxes },
      { href: "/admin/providers", label: "Providers", icon: ServerCog },
      { href: "/admin/usage", label: "Lịch sử dùng", icon: Activity },
    ],
  },
  {
    title: "HỖ TRỢ",
    items: [{ href: "/admin/support", label: "Ticket hỗ trợ", icon: LifeBuoy }],
  },
  {
    title: "HỆ THỐNG",
    items: [
      { href: "/admin/system", label: "Trạng thái hệ thống", icon: Activity },
      { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
    ],
  },
];

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
      title: "Đăng xuất quản trị?",
      description: "Bạn sẽ được đưa về trang đăng nhập.",
      confirmLabel: "Đăng xuất",
      cancelLabel: "Hủy",
      type: "danger",
      onConfirm: async () => signOut({ callbackUrl: "/login" }),
    });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#FFFDF5]">
      <div className="flex h-20 items-center border-b-4 border-black px-3">
        <Link
          href="/admin"
          className={[
            "inline-flex",
            collapsed ? "mx-auto h-12 w-12 items-center justify-center" : "w-full items-center gap-3 px-3 py-2",
          ].join(" ")}
          title="TzoShop Admin Panel"
        >
          {collapsed ? (
            <Image src="/logo.png" alt="TzoShop" width={32} height={32} className="h-8 w-8 object-contain" priority />
          ) : (
            <Image src="/logo.png" alt="TzoShop" width={36} height={36} className="h-9 w-9 object-contain" priority />
          )}
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-black uppercase leading-none text-black">TZOSHOP</span>
              <span className="mt-1 block truncate text-[11px] font-black uppercase tracking-[0.14em] text-black/75">Admin Panel</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-4">
        {menuGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed ? (
              <p className="mb-2 mt-6 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/50">{group.title}</p>
            ) : (
              <div className="mx-auto my-3 h-[2px] w-8 bg-black/15" />
            )}
            <div className="space-y-2">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={[
                      "flex h-11 items-center border-4 text-sm font-black text-black transition-all duration-100 ease-linear",
                      collapsed ? "mx-auto w-11 justify-center px-0" : "gap-3 px-3",
                      active
                        ? "border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]"
                        : "border-transparent hover:-translate-y-0.5 hover:border-black hover:bg-[#FFF3B0] hover:shadow-[3px_3px_0px_0px_#000]",
                    ].join(" ")}
                  >
                    <AppIcon icon={item.icon} className="h-5 w-5 shrink-0 text-black" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t-4 border-black p-3">
        <div className="flex flex-col items-center gap-3">
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className={[
            "inline-flex h-11 items-center border-4 border-black bg-white text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
            collapsed ? "mx-auto w-11 justify-center px-0" : "w-full justify-center gap-2",
          ].join(" ")}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {!collapsed && "Thu gọn"}
        </button>

        <button
          onClick={handleLogout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className={[
            "flex h-11 items-center justify-center gap-2 border-4 border-black bg-[#FF6B6B] text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
            collapsed ? "mx-auto w-11 px-0" : "w-full",
          ].join(" ")}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && "Đăng xuất"}
        </button>
        </div>
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
