"use client";

import { useEffect, useState } from "react";
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
          "flex min-h-screen flex-1 flex-col transition-[padding] duration-200 ease-linear",
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
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000]">
              <span className="text-sm font-black text-black">TZ</span>
            </div>
            <span className="text-sm font-black uppercase tracking-[0.12em] text-black">Admin</span>
          </div>
          <AdminMobileNav />
        </header>

        <main className="flex-1 px-4 pb-5 pt-4 md:px-6 md:pb-6 md:pt-5 lg:px-8 lg:pb-8 lg:pt-24">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
