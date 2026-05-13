"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "KHU VỰC QUẢN LÝ",
    description: "Theo dõi credits, API key và mức sử dụng của bạn.",
  },
  "/plans": {
    title: "MUA CREDITS",
    description: "Chọn gói credits phù hợp để sử dụng trong tài khoản của bạn.",
  },
  "/my-plans": {
    title: "GÓI CỦA TÔI",
    description: "Xem các gói credits đang hoạt động và thời hạn sử dụng.",
  },
  "/billing": {
    title: "THANH TOÁN",
    description: "Quản lý đơn hàng, thanh toán và lịch sử giao dịch.",
  },
  "/coupons": {
    title: "MÃ GIẢM GIÁ",
    description: "Quản lý và sử dụng các mã ưu đãi dành riêng cho bạn.",
  },
  "/api-keys": {
    title: "API KEYS",
    description: "Tạo, quản lý và bảo vệ các API key trong tài khoản của bạn.",
  },
  "/api-docs": {
    title: "TÀI LIỆU API",
    description: "Hướng dẫn tích hợp API, endpoint chung và danh sách model hỗ trợ.",
  },
  "/usage": {
    title: "LỊCH SỬ SỬ DỤNG",
    description: "Theo dõi request, credits đã dùng và phát hiện bất thường.",
  },
  "/settings": {
    title: "CÀI ĐẶT",
    description: "Cập nhật hồ sơ, thông báo và các tùy chọn tài khoản.",
  },
  "/support": {
    title: "HỖ TRỢ",
    description: "Liên hệ và gửi yêu cầu hỗ trợ khi sử dụng TzoShop.",
  },
};

function getMeta(pathname: string) {
  const exact = pageMeta[pathname];
  if (exact) return exact;
  const matched = Object.keys(pageMeta)
    .sort((a, b) => b.length - a.length)
    .find((p) => pathname.startsWith(`${p}/`));
  return matched ? pageMeta[matched] : pageMeta["/dashboard"];
}

export default function DashboardTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname();
  const meta = getMeta(pathname);
  const { data: session } = useSession();
  const userName = session?.user?.name?.trim() || "Người dùng";
  const userEmail = session?.user?.email?.trim() || "user@tzoshop.vn";
  const userInitial = userName.charAt(0).toUpperCase();
  const userImage = session?.user?.image;

  return (
    <header className="sticky top-0 z-40 h-20 border-b-4 border-black bg-[#FFFDF5]">
      <div className="flex h-full items-center justify-between gap-3 px-5 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobile}
            className="flex h-11 w-11 items-center justify-center border-4 border-black bg-white shadow-[3px_3px_0px_0px_#000] lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black uppercase text-black sm:text-xl">{meta.title}</h1>
            <p className="hidden truncate text-xs font-bold text-black/70 sm:block sm:text-sm">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center border-4 border-black bg-[#C7F0D8] text-sm font-black text-black shadow-[4px_4px_0px_0px_#000] md:hidden"
            title={userName}
            aria-label="Tài khoản"
          >
            {userImage ? (
              <Image src={userImage} alt={`${userName} avatar`} width={32} height={32} className="h-8 w-8 object-cover" />
            ) : (
              userInitial
            )}
          </div>

          <div className="hidden h-12 max-w-[260px] items-center gap-3 border-4 border-black bg-[#FFFDF5] px-3 text-black shadow-[4px_4px_0px_0px_#000] md:flex">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#C7F0D8] font-black text-black">
              {userImage ? (
                <Image src={userImage} alt={`${userName} avatar`} width={32} height={32} className="h-8 w-8 object-cover" />
              ) : (
                userInitial
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black leading-none text-black">{userName}</p>
              <p className="mt-1 truncate text-xs font-bold leading-none text-black/60">{userEmail}</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
