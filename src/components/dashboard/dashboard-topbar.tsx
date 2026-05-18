"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Skeleton } from "@/components/ui/skeleton";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Khu vực quản lý",
    description: "Theo dõi credits, API key và mức sử dụng của bạn.",
  },
  "/plans": {
    title: "Mua credits",
    description: "Chọn gói credits phù hợp để sử dụng trong tài khoản của bạn.",
  },
  "/my-plans": {
    title: "Gói của tôi",
    description: "Xem các gói credits đang hoạt động và thời hạn sử dụng.",
  },
  "/billing": {
    title: "Thanh toán",
    description: "Quản lý đơn hàng, thanh toán và lịch sử giao dịch.",
  },
  "/coupons": {
    title: "Mã giảm giá",
    description: "Quản lý và sử dụng các mã ưu đãi dành riêng cho bạn.",
  },
  "/api-keys": {
    title: "API Keys",
    description: "Tạo, quản lý và bảo vệ các API key trong tài khoản của bạn.",
  },
  "/api-docs": {
    title: "Tài liệu API",
    description: "Hướng dẫn tích hợp API, endpoint chung và danh sách model hỗ trợ.",
  },
  "/usage": {
    title: "Lịch sử sử dụng",
    description: "Theo dõi request, credits đã dùng và phát hiện bất thường.",
  },
  "/settings": {
    title: "Cài đặt",
    description: "Cập nhật hồ sơ, thông báo và các tùy chọn tài khoản.",
  },
  "/support": {
    title: "Hỗ trợ",
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

function TopbarUserSkeleton() {
  return (
    <div className="flex items-center gap-2 sm:gap-3" aria-hidden="true">
      <div className="hidden md:block">
        <Skeleton className="h-10 w-10 rounded-xl border border-slate-200" />
      </div>
      <Skeleton className="h-10 w-10 rounded-xl border border-slate-200 md:hidden" />

      <div className="flex h-11 max-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <div className="hidden min-w-0 space-y-2 sm:block">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname();
  const meta = getMeta(pathname);
  const { data: session, status } = useSession();
  const isUserLoading = status === "loading";

  const userName = session?.user?.name?.trim() || "Người dùng";
  const userEmail = session?.user?.email?.trim() || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const userImage = session?.user?.image;

  return (
    <header className="sticky top-0 z-40 h-[72px] border-b border-slate-200 bg-white/85 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-3 px-5 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobile}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-slate-950 sm:text-lg">{meta.title}</h1>
            <p className="hidden truncate text-xs text-slate-600 sm:block sm:text-sm">{meta.description}</p>
          </div>
        </div>

        {isUserLoading ? (
          <TopbarUserSkeleton />
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            <div className="flex h-11 max-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2" title={userName} aria-label="Tài khoản">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {userImage ? (
                  <Image src={userImage} alt={`${userName} avatar`} width={28} height={28} className="h-7 w-7 object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="truncate text-sm font-semibold leading-none text-slate-900">{userName}</p>
                <p className="mt-1 truncate text-xs leading-none text-slate-500">{userEmail}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

