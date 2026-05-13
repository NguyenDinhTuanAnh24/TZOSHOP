"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardTopbar from "@/components/dashboard/dashboard-topbar";

const SIDEBAR_KEY = "tzoshop-sidebar-collapsed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(SIDEBAR_KEY);
      setCollapsed(saved === "1");
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleToggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  const effectiveCollapsed = mounted ? collapsed : false;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FFFDF5]">
      <DashboardSidebar
        collapsed={effectiveCollapsed}
        onToggleCollapsed={handleToggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`min-h-screen min-w-0 overflow-x-clip bg-[#FFFDF5] transition-[margin-left] duration-200 ${
          effectiveCollapsed ? "lg:ml-20" : "lg:ml-[250px]"
        }`}
      >
        <DashboardTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="min-w-0 overflow-x-clip px-4 py-5 sm:px-5 md:px-6 md:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

