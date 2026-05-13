"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  DollarSign,
  Inbox,
  Key,
  LayoutDashboard,
  LifeBuoy,
  Server,
  ShieldCheck,
  ShoppingCart,
  Users,
  Zap,
} from "lucide-react";
import { formatVnd, translateStatus } from "@/lib/format";

type AdminStats = {
  totalUsers: number;
  revenueVnd: number;
  pendingOrders: number;
  openTickets: number;
  creditsSold: string;
  creditsGranted: string;
  activeApiKeys: number;
  activeModels: number;
  activeProviders: number;
};

type RecentOrder = {
  id: string;
  orderCode: string;
  amountVnd: number;
  status: string;
  createdAt: string;
  user: {
    email: string;
  };
};

type RecentTicket = {
  id: string;
  subject: string;
  email: string;
  priority: string;
  status: string;
  createdAt: string;
};

function statusClass(status: string) {
  if (status === "PAID" || status === "RESOLVED") return "bg-[#C7F0D8]";
  if (status === "PENDING" || status === "OPEN") return "bg-[#FFD93D]";
  return "bg-[#FF6B6B]";
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="h-8 w-64 bg-[#E9E1D0] animate-pulse" />
        <div className="mt-3 h-4 w-full max-w-[540px] bg-[#E9E1D0] animate-pulse" />
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="min-h-[150px] border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="h-12 w-12 border-4 border-black bg-[#E9E1D0] animate-pulse" />
            <div className="mt-6 h-3 w-28 bg-[#E9E1D0] animate-pulse" />
            <div className="mt-3 h-8 w-24 bg-[#E9E1D0] animate-pulse" />
            <div className="mt-3 h-3 w-32 bg-[#E9E1D0] animate-pulse" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="min-h-[260px] border-4 border-black bg-[#FFFDF5] p-6 shadow-[7px_7px_0px_0px_#000]">
            <div className="h-7 w-56 bg-[#E9E1D0] animate-pulse" />
            <div className="mt-2 h-4 w-64 bg-[#E9E1D0] animate-pulse" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 border-2 border-black bg-[#E9E1D0] animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [resStats, resOrders, resTickets] = await Promise.all([fetch("/api/admin/stats"), fetch("/api/admin/orders"), fetch("/api/admin/support")]);
        const [dataStats, dataOrders, dataTickets] = await Promise.all([resStats.json(), resOrders.json(), resTickets.json()]);
        if (dataStats.success) setStats(dataStats.data);
        if (dataOrders.success) setRecentOrders(dataOrders.data.slice(0, 5));
        if (dataTickets.success) setRecentTickets(dataTickets.data.slice(0, 5));
      } catch (error) {
        console.error("Fetch overview data failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, []);

  if (isLoading) return <AdminDashboardSkeleton />;

  const statCards = [
    {
      label: "TỔNG NGƯỜI DÙNG",
      value: (stats?.totalUsers || 0).toLocaleString(),
      desc: "Người dùng đăng ký",
      icon: Users,
      iconBg: "bg-[#93C5FD]",
    },
    {
      label: "DOANH THU",
      value: formatVnd(stats?.revenueVnd || 0),
      desc: "Tổng doanh thu PAID",
      icon: DollarSign,
      iconBg: "bg-[#C7F0D8]",
    },
    {
      label: "ĐƠN CHỜ NẠP",
      value: (stats?.pendingOrders || 0).toLocaleString(),
      desc: "Đơn hàng PENDING",
      icon: ShoppingCart,
      iconBg: "bg-[#FFD93D]",
    },
    {
      label: "TICKET ĐANG MỞ",
      value: (stats?.openTickets || 0).toLocaleString(),
      desc: "Cần hỗ trợ khách hàng",
      icon: LifeBuoy,
      iconBg: "bg-[#FF6B6B]",
    },
    {
      label: "CREDITS ĐÃ BÁN",
      value: Number(stats?.creditsSold || 0).toLocaleString(),
      desc: "Tổng credits đã cấp thành công",
      icon: Zap,
      iconBg: "bg-[#A78BFA]",
    },
    {
      label: "API KEYS",
      value: (stats?.activeApiKeys || 0).toLocaleString(),
      desc: "Key đang hoạt động",
      icon: Key,
      iconBg: "bg-[#E9E1D0]",
    },
    {
      label: "MODELS",
      value: (stats?.activeModels || 0).toLocaleString(),
      desc: "Models AI đang phục vụ",
      icon: Bot,
      iconBg: "bg-[#C084FC]",
    },
    {
      label: "PROVIDERS",
      value: (stats?.activeProviders || 0).toLocaleString(),
      desc: "Nhà cung cấp hoạt động",
      icon: Server,
      iconBg: "bg-[#99F6E4]",
    },
  ];

  const quickActions = [
    { href: "/admin/orders", label: "Quản lý đơn hàng" },
    { href: "/admin/support", label: "Xem ticket hỗ trợ" },
    { href: "/admin/products", label: "Quản lý gói credits" },
    { href: "/admin/usage", label: "Xem lịch sử sử dụng" },
  ];

  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <LayoutDashboard className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">ADMIN DASHBOARD</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">TỔNG QUAN QUẢN TRỊ</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Theo dõi tình hình vận hành, đơn hàng, credits và hỗ trợ khách hàng.</p>
          </div>
          <div className="inline-flex items-center gap-2 border-4 border-black bg-[#C7F0D8] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black shadow-[4px_4px_0px_0px_#000]">
            <ShieldCheck className="h-4 w-4" />
            LIVE SYSTEM
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="flex min-h-[150px] flex-col justify-between border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000]"
          >
            <div className={`flex h-12 w-12 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${card.iconBg}`}>
              <card.icon className="h-6 w-6 text-black" />
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">{card.label}</p>
              <p className="mt-2 text-3xl font-black leading-none text-black">{card.value}</p>
              <p className="mt-2 text-sm font-bold text-black/70">{card.desc}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action, idx) => (
          <Link
            key={action.href}
            href={action.href}
            className={[
              "inline-flex h-12 items-center justify-center border-4 border-black px-4 text-center text-xs font-black uppercase tracking-[0.08em] text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
              idx % 2 === 0 ? "bg-[#FFD93D]" : "bg-white",
            ].join(" ")}
          >
            {action.label}
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="min-h-[260px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_0px_#000] md:p-6">
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-black">Đơn hàng mới nhất</h2>
              <p className="text-sm font-bold text-black/60">Các giao dịch gần đây trên hệ thống.</p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[3px_3px_0px_0px_#000] transition-all duration-100 hover:bg-[#FF6B6B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          {recentOrders.length === 0 ? (
            <div className="flex min-h-[170px] flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center border-4 border-black bg-[#E9E1D0]">
                <Inbox className="h-6 w-6 text-black" />
              </div>
              <p className="text-base font-black text-black">Chưa có đơn hàng nào.</p>
              <p className="mt-1 text-sm font-bold text-black/60">Dữ liệu đơn hàng mới sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 border-2 border-black bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-black">#{order.orderCode}</p>
                    <p className="truncate text-xs font-bold text-black/60">{order.user.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-black">{formatVnd(order.amountVnd)}</p>
                    <span className={`mt-1 inline-flex border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase text-black ${statusClass(order.status)}`}>
                      {translateStatus(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="min-h-[260px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_0px_#000] md:p-6">
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-black">Ticket cần xử lý</h2>
              <p className="text-sm font-bold text-black/60">Yêu cầu hỗ trợ khách hàng mới nhất.</p>
            </div>
            <Link
              href="/admin/support"
              className="inline-flex h-10 w-10 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[3px_3px_0px_0px_#000] transition-all duration-100 hover:bg-[#FF6B6B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          {recentTickets.length === 0 ? (
            <div className="flex min-h-[170px] flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center border-4 border-black bg-[#E9E1D0]">
                <Inbox className="h-6 w-6 text-black" />
              </div>
              <p className="text-base font-black text-black">Chưa có yêu cầu hỗ trợ nào.</p>
              <p className="mt-1 text-sm font-bold text-black/60">Ticket mới sẽ hiển thị tại đây để xử lý.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between gap-3 border-2 border-black bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-black">{ticket.subject}</p>
                    <p className="truncate text-xs font-bold text-black/60">{ticket.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase text-black ${statusClass(ticket.status)}`}>
                      {translateStatus(ticket.status)}
                    </span>
                    <p className="mt-1 text-[11px] font-bold text-black/60">{new Date(ticket.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
