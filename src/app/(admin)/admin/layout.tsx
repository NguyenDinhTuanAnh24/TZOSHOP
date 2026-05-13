"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import AdminTopbar from "@/components/admin/admin-topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("tzoshop-admin-sidebar-collapsed");
    if (saved === "true") {
      const rafId = window.requestAnimationFrame(() => setCollapsed(true));
      return () => window.cancelAnimationFrame(rafId);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tzoshop-admin-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FFFDF5]">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 hidden border-r-4 border-black bg-[#FFFDF5] transition-[width] duration-200 ease-linear lg:block",
          collapsed ? "w-[88px]" : "w-[260px]",
        ].join(" ")}
      >
        <AdminSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((prev) => !prev)} />
      </aside>

      <div
        className={[
          "flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-linear",
          collapsed ? "lg:pl-[88px]" : "lg:pl-[260px]",
        ].join(" ")}
      >
        <div
          className={[
            "fixed right-0 top-0 z-40 hidden lg:block",
            collapsed ? "left-[88px]" : "left-[260px]",
          ].join(" ")}
        >
          <AdminTopbar />
        </div>

        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b-4 border-black bg-[#FFFDF5] px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <Link href="/admin" aria-label="TzoShop Admin Panel" title="TzoShop Admin Panel" className="inline-flex items-center justify-center">
              <Image src="/logo.png" alt="TzoShop" width={36} height={36} className="h-9 w-9 object-contain" priority />
            </Link>
            <span className="text-base font-black uppercase tracking-[0.1em] text-black">Admin</span>
          </div>
          <AdminMobileNav />
        </header>

        <main className="min-w-0 flex-1 px-4 pb-5 pt-4 md:px-6 md:pb-6 md:pt-5 lg:px-8 lg:pb-8 lg:pt-24">
          <div className="mx-auto w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
