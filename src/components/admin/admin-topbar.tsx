"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";

const routeConfigs: Record<string, { title: string; description: string }> = {
  "/admin": { title: "Tổng quan", description: "Báo cáo hoạt động và thống kê hệ thống." },
  "/admin/users": { title: "Quản lý người dùng", description: "Danh sách thành viên và phân quyền." },
  "/admin/orders": { title: "Quản lý đơn hàng", description: "Theo dõi doanh thu và trạng thái thanh toán." },
  "/admin/products": { title: "Gói Credits", description: "Cấu hình các gói nạp tiền cho người dùng." },
  "/admin/models": { title: "Cấu hình Models", description: "Quản lý danh sách AI models và giá bán." },
  "/admin/providers": { title: "Providers", description: "Quản lý kết nối API với các nhà cung cấp." },
  "/admin/usage": { title: "Lịch sử sử dụng", description: "Nhật ký tiêu thụ credits của toàn hệ thống." },
  "/admin/support": { title: "Ticket hỗ trợ", description: "Xử lý các yêu cầu trợ giúp từ khách hàng." },
  "/admin/audit-logs": { title: "Audit Logs", description: "Nhật ký các thao tác quan trọng trên hệ thống." },
};

import { NotificationBell } from "@/components/notifications/notification-bell";

export default function AdminTopbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { askConfirm } = useConfirm();

  const currentRoute = Object.keys(routeConfigs).find(route => 
    pathname === route || (route !== "/admin" && pathname.startsWith(route))
  );

  const config = routeConfigs[currentRoute || ""] || { 
    title: "Admin Panel", 
    description: "Quản trị hệ thống TzoShop." 
  };

  const handleLogout = () => {
    askConfirm({
      title: "Đăng xuất?",
      description: "Bạn có chắc chắn muốn thoát khỏi phiên làm việc này?",
      confirmLabel: "Đăng xuất",
      cancelLabel: "Hủy",
      type: "danger",
      onConfirm: async () => {
        await signOut({ callbackUrl: "/login" });
      },
    });
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">
          {config.title}
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          {config.description}
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Dynamic Notifications */}
        <NotificationBell />

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-bold text-slate-900">
                {session?.user?.name || "Administrator"}
              </span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              {session?.user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
