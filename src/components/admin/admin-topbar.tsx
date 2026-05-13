"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/notification-bell";

const routeConfigs: Record<string, { title: string; description: string }> = {
  "/admin": { title: "Tổng quan", description: "Báo cáo hoạt động và thống kê hệ thống." },
  "/admin/users": { title: "Quản lý người dùng", description: "Danh sách thành viên và phân quyền." },
  "/admin/orders": { title: "Quản lý đơn hàng", description: "Theo dõi doanh thu và trạng thái thanh toán." },
  "/admin/products": { title: "Gói credits", description: "Cấu hình các gói nạp tiền cho người dùng." },
  "/admin/coupons": { title: "Mã giảm giá", description: "Quản lý mã ưu đãi và phát hành theo người dùng." },
  "/admin/models": { title: "Cấu hình models", description: "Quản lý danh sách AI models và giá bán." },
  "/admin/providers": { title: "Providers", description: "Quản lý kết nối API với các nhà cung cấp." },
  "/admin/usage": { title: "Lịch sử sử dụng", description: "Nhật ký tiêu thụ credits toàn hệ thống." },
  "/admin/support": { title: "Ticket hỗ trợ", description: "Xử lý các yêu cầu hỗ trợ từ khách hàng." },
  "/admin/audit-logs": { title: "Audit logs", description: "Nhật ký thao tác quan trọng của quản trị viên." },
  "/admin/system": { title: "Trạng thái hệ thống", description: "Giám sát cấu hình và health-check dịch vụ." },
  "/admin/revenue": { title: "Doanh thu", description: "Thống kê doanh thu và hiệu suất vận hành." },
};

export default function AdminTopbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const currentRoute = Object.keys(routeConfigs).find((route) => pathname === route || (route !== "/admin" && pathname.startsWith(route)));
  const config = routeConfigs[currentRoute || ""] || {
    title: "Tổng quan",
    description: "Báo cáo hoạt động và thống kê hệ thống.",
  };

  return (
    <header className="sticky top-0 z-40 h-20 border-b-4 border-black bg-[#FFFDF5]">
      <div className="flex h-full items-center justify-between gap-3 px-5 md:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-base font-black uppercase text-black sm:text-xl">{config.title}</h1>
          <p className="hidden truncate text-xs font-bold text-black/70 sm:block sm:text-sm">{config.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <div className="hidden max-w-[280px] items-center gap-3 border-4 border-black bg-white px-3 py-2 text-black shadow-[4px_4px_0px_0px_#000] md:flex">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#C7F0D8] text-sm font-black">
              {(session?.user?.name?.[0] || "A").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-black leading-none">{session?.user?.name || "Administrator"}</p>
                <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-2 py-0.5 text-[10px] font-black uppercase">ADMIN</span>
              </div>
              <p className="mt-1 truncate text-xs font-bold leading-none text-black/60">{session?.user?.email || "admin@tzoshop.io.vn"}</p>
            </div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center border-4 border-black bg-[#C7F0D8] text-sm font-black text-black shadow-[4px_4px_0px_0px_#000] md:hidden">
            {(session?.user?.name?.[0] || "A").toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}

