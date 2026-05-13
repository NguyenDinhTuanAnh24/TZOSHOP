import AdminSidebar from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import AdminTopbar from "@/components/admin/admin-topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <aside className="fixed inset-y-0 left-0 hidden w-[260px] lg:block">
        <AdminSidebar />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[260px]">
        <div className="hidden lg:block">
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

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
