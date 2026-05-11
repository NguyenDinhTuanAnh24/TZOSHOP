"use client";

import { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  Wallet,
  Key,
  Zap,
  Bot,
  Server,
  LifeBuoy,
  ShoppingCart,
  AlertCircle,
  Activity,
  ArrowRight,
  Inbox,
  LayoutDashboard
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { formatVnd } from "@/lib/format";
import Link from "next/link";
import { AdminAlertsBlock } from "@/components/admin/admin-alerts-block";

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

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [resStats, resOrders, resTickets] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/orders"),
          fetch("/api/admin/support")
        ]);

        const [dataStats, dataOrders, dataTickets] = await Promise.all([
          resStats.json(),
          resOrders.json(),
          resTickets.json()
        ]);

        if (dataStats.success) setStats(dataStats.data);
        if (dataOrders.success) setRecentOrders(dataOrders.data.slice(0, 5));
        if (dataTickets.success) setRecentTickets(dataTickets.data.slice(0, 5));
      } catch (error) {
        console.error("Fetch overview data failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-black text-slate-500 animate-pulse uppercase tracking-widest">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  // Logic hiển thị Credits Sold vs Credits Granted
  const sold = Number(stats?.creditsSold || 0);
  const granted = Number(stats?.creditsGranted || 0);
  
  const creditsLabel = (sold === 0 && granted > 0) ? "Credits đã cấp" : "Credits đã bán";
  const creditsValue = (sold === 0 && granted > 0) ? granted : sold;
  const creditsDesc = (sold === 0 && granted > 0) ? "Tổng credits trong hệ thống" : "Tổng credits nạp qua đơn hàng";

  const statCards = [
    {
      label: "Tổng người dùng",
      value: (stats?.totalUsers || 0).toLocaleString(),
      desc: "Người dùng đăng ký",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Doanh thu",
      value: formatVnd(stats?.revenueVnd || 0),
      desc: "Tổng doanh thu PAID",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Đơn chờ nạp",
      value: stats?.pendingOrders || 0,
      desc: "Đơn hàng PENDING",
      icon: ShoppingCart,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      label: "Ticket đang mở",
      value: stats?.openTickets || 0,
      desc: "Cần hỗ trợ khách hàng",
      icon: LifeBuoy,
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      label: creditsLabel,
      value: creditsValue.toLocaleString(),
      desc: creditsDesc,
      icon: Zap,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      label: "API Keys",
      value: stats?.activeApiKeys || 0,
      desc: "Key đang hoạt động",
      icon: Key,
      color: "text-slate-600",
      bg: "bg-slate-50"
    },
    {
      label: "Models",
      value: stats?.activeModels || 0,
      desc: "Models AI đang phục vụ",
      icon: Bot,
      color: "text-violet-600",
      bg: "bg-violet-50"
    },
    {
      label: "Providers",
      value: stats?.activeProviders || 0,
      desc: "Nhà cung cấp hoạt động",
      icon: Server,
      color: "text-teal-600",
      bg: "bg-teal-50"
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header Overview */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tổng quan quản trị</h1>
            <p className="text-slate-500 font-bold mt-1">Theo dõi tình hình vận hành, đơn hàng, credits và hỗ trợ khách hàng.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600 ring-1 ring-emerald-500/10">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-7 transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.bg} ${card.color} transition-transform group-hover:scale-110 duration-300`}>
              <AppIcon icon={card.icon} className="h-7 w-7" />
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{card.value}</h3>
              <p className="mt-1.5 text-xs font-bold text-slate-400">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <AdminAlertsBlock />

      {/* Lists Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đơn hàng mới nhất</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Các giao dịch gần đây trên hệ thống.</p>
            </div>
            <Link href="/admin/orders" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic font-bold">
                <Inbox className="h-10 w-10 mb-3 opacity-20" />
                Chưa có đơn hàng nào.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 border border-slate-100/50 group hover:bg-white hover:border-emerald-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 group-hover:text-emerald-600 shadow-sm border border-slate-100 transition-colors">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight">#{order.orderCode}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{order.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{formatVnd(order.amountVnd)}</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <span className={`inline-flex h-1.5 w-1.5 rounded-full ${order.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{order.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tickets to Process */}
        <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ticket cần xử lý</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Yêu cầu hỗ trợ khách hàng mới nhất.</p>
            </div>
            <Link href="/admin/support" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 italic font-bold">
                <Inbox className="h-10 w-10 mb-3 opacity-20" />
                Chưa có yêu cầu hỗ trợ nào.
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 border border-slate-100/50 group hover:bg-white hover:border-rose-100 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 group-hover:text-rose-600 shadow-sm border border-slate-100 transition-colors">
                      <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 leading-tight truncate">{ticket.subject}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">{ticket.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${ticket.priority === 'URGENT' ? 'bg-rose-100 text-rose-600' :
                        ticket.priority === 'HIGH' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-200 text-slate-600'
                      }`}>
                      {ticket.priority}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                      {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
