"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { label: "Trang chủ", href: "/" },
  { label: "Gói credits", href: "/plans" },
  { label: "Tài liệu", href: "/api-docs" },
  { label: "Hỗ trợ", href: "/support" },
];

export function SiteHeader() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name?.trim() || "Tài khoản";
  const userImage = session?.user?.image;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-[#edf1ee] bg-white/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="TzoShop" width={160} height={42} priority className="h-9 w-auto" />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-semibold text-[#47524d] transition hover:text-[#0b0f0d]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                title={userName}
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                  {userImage ? (
                    <Image src={userImage} alt={`${userName} avatar`} width={28} height={28} className="h-7 w-7 object-cover" />
                  ) : (
                    userInitial
                  )}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">{userName}</span>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm font-semibold text-[#47524d] transition hover:text-[#0b0f0d] sm:inline-flex">
                Đăng nhập
              </Link>

              <Link href="/plans" className="btn-primary">
                Bắt đầu
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
