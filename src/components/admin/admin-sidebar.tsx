"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  Boxes, 
  ServerCog, 
  LifeBuoy, 
  ScrollText, 
  LogOut, 
  ShieldCheck,
  Activity,
  BarChart3
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import Image from "next/image";

const menuGroups = [
  {
    title: "Tổng quan",
    items: [
      { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
      { href: "/admin/revenue", label: "Doanh thu", icon: BarChart3 },
    ]
  },
  {
    title: "Kinh doanh",
    items: [
      { href: "/admin/users", label: "Người dùng", icon: Users },
      { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
      { href: "/admin/products", label: "Gói Credits", icon: Package },
    ]
  },
  {
    title: "Hệ thống API",
    items: [
      { href: "/admin/models", label: "Models", icon: Boxes },
      { href: "/admin/providers", label: "Providers", icon: ServerCog },
      { href: "/admin/usage", label: "Lịch sử dùng", icon: Activity },
    ]
  },
  {
    title: "Hỗ trợ",
    items: [
      { href: "/admin/support", label: "Ticket hỗ trợ", icon: LifeBuoy },
    ]
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/admin/system", label: "Trạng thái hệ thống", icon: Activity },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    ]
  }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const handleLogout = () => {
    askConfirm({
      title: "Đăng xuất quản trị?",
      description: "Bạn sẽ được đưa quay lại trang đăng nhập.",
      confirmLabel: "Đăng xuất",
      cancelLabel: "Hủy",
      type: "danger",
      onConfirm: async () => {
        await signOut({ callbackUrl: "/login" });
      },
    });
  };

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand */}
      <div className="px-6 py-8">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="block text-lg font-black tracking-tight text-slate-900">
              TzoShop
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
        <nav className="space-y-8">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="px-4 mb-3 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <AppIcon 
                        icon={item.icon} 
                        className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} 
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50"
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
