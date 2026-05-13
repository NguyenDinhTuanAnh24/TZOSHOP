"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Activity,
  BarChart3,
  Boxes,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  ScrollText,
  ServerCog,
  ShoppingCart,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
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
      { href: "/admin/products", label: "Gói credits", icon: Package },
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

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { askConfirm } = useConfirm();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    askConfirm({
      title: "Đăng xuất?",
      description: "Bạn có chắc chắn muốn đăng xuất?",
      confirmLabel: "Đăng xuất",
      cancelLabel: "Hủy",
      type: "danger",
      onConfirm: async () => signOut({ callbackUrl: "/login" }),
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        aria-label="Mở menu admin"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[10000] lg:hidden">
          <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Đóng menu" />
          <aside className="relative z-10 flex h-dvh w-[86vw] max-w-[320px] flex-col border-r-4 border-black bg-[#FFFDF5]">
            <div className="flex items-center justify-between border-b-4 border-black p-4">
              <div className="inline-flex items-center gap-2 border-4 border-black bg-[#FFD93D] px-3 py-2 shadow-[4px_4px_0px_0px_#000]">
                <span className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white">
                  <Image src="/logo.png" alt="TzoShop" width={24} height={24} className="h-6 w-6 object-contain" priority />
                </span>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-black">Admin</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-white shadow-[3px_3px_0px_0px_#000]"
                aria-label="Đóng menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              {menuGroups.map((group) => (
                <div key={group.title} className="mb-4">
                  <p className="mb-2 mt-5 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-black/50">{group.title}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={[
                            "flex h-11 items-center gap-3 border-4 px-3 text-sm font-black text-black transition-all duration-100 ease-linear",
                            active
                              ? "border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]"
                              : "border-transparent hover:-translate-y-0.5 hover:border-black hover:bg-[#FFF3B0] hover:shadow-[3px_3px_0px_0px_#000]",
                          ].join(" ")}
                        >
                          <AppIcon icon={item.icon} className="h-5 w-5 shrink-0 text-black" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-4 border-black p-3">
              <div className="mb-3 border-4 border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
                <p className="truncate text-sm font-black text-black">{session?.user?.name || "Administrator"}</p>
                <p className="truncate text-xs font-bold text-black/60">{session?.user?.email || "admin@tzoshop.io.vn"}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-11 w-full items-center justify-center gap-2 border-4 border-black bg-[#FF6B6B] text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]"
              >
                <LogOut className="h-5 w-5" />
                Đăng xuất
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
