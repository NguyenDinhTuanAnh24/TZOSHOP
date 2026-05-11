"use client";

import { useEffect, useState } from "react";
import { 
  AlertCircle, 
  AlertTriangle, 
  RefreshCcw, 
  ChevronRight, 
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  ShoppingCart,
  Activity,
  Server
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Alert = {
  id: string;
  type: string;
  severity: "WARNING" | "DANGER";
  title: string;
  message: string;
  href: string;
  createdAt: string;
};

type Summary = {
  total: number;
  danger: number;
  warning: number;
};

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const router = useRouter();

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/alerts");
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Fetch alerts failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filter === "ALL" || alert.severity === filter;
    
    let matchesCategory = true;
    if (category !== "ALL") {
      if (category === "CREDITS") matchesCategory = ["LOW_CREDITS", "OUT_OF_CREDITS", "EXPIRING_BUCKET"].includes(alert.type);
      else if (category === "ORDERS") matchesCategory = alert.type === "STALE_PENDING_ORDER";
      else if (category === "USAGE") matchesCategory = alert.type === "HIGH_FAILED_REQUESTS";
      else if (category === "MODEL") matchesCategory = alert.type === "MODEL_FAILED_SPIKE";
    }

    return matchesSeverity && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Realtime Monitoring</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cảnh báo vận hành</h1>
          <p className="text-slate-500 font-bold mt-1">Hệ thống giám sát và phát hiện sự cố tự động.</p>
        </div>
        
        <button 
          onClick={fetchAlerts}
          disabled={isLoading}
          style={{ backgroundColor: '#059669', color: '#ffffff' }}
          className="relative z-10 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black shadow-md active:scale-95 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <RefreshCcw className={`h-4 w-4 text-white ${isLoading ? "animate-spin" : ""}`} />
          <span className="text-white font-black">{isLoading ? "Đang tải..." : "Làm mới"}</span>
        </button>

        <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-slate-50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng cảnh báo</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-slate-900">{summary?.total || 0}</h3>
            <Activity className="h-8 w-8 text-slate-100" />
          </div>
        </div>
        <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100 shadow-sm">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Nguy hiểm (DANGER)</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-rose-600">{summary?.danger || 0}</h3>
            <AlertCircle className="h-8 w-8 text-rose-200" />
          </div>
        </div>
        <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 shadow-sm">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Cần chú ý (WARNING)</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-amber-600">{summary?.warning || 0}</h3>
            <AlertTriangle className="h-8 w-8 text-amber-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "DANGER", label: "Nguy hiểm" },
            { id: "WARNING", label: "Cần chú ý" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filter === item.id 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-slate-100 hidden md:block" />

        <div className="flex flex-wrap gap-2">
          {[
            { id: "ALL", label: "Tất cả loại", icon: Filter },
            { id: "CREDITS", label: "Credits", icon: Zap },
            { id: "ORDERS", label: "Orders", icon: ShoppingCart },
            { id: "USAGE", label: "Usage", icon: Activity },
            { id: "MODEL", label: "Model", icon: Server },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                  category === item.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-32 w-full bg-white rounded-[32px] border border-slate-100 animate-pulse" />
          ))
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-200 border-dashed">
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Hệ thống đang ổn định</h3>
            <p className="text-slate-400 font-bold mt-1">Chưa có cảnh báo vận hành nào cần xử lý.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-6 rounded-[32px] border transition-all hover:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 group ${
                alert.severity === "DANGER" 
                ? "bg-rose-50/30 border-rose-100 hover:border-rose-200" 
                : "bg-amber-50/30 border-amber-100 hover:border-amber-200"
              }`}
            >
              <div className="flex items-start gap-5">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  alert.severity === "DANGER" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                }`}>
                  {alert.severity === "DANGER" ? <AlertCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-black text-slate-900 tracking-tight">{alert.title}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      alert.severity === "DANGER" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed max-w-2xl">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-3">
                     <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.createdAt).toLocaleString("vi-VN")}
                     </span>
                     <span className="text-[11px] font-black text-slate-300">/</span>
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                        TYPE: {alert.type}
                     </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => router.push(alert.href)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all shrink-0 ${
                  alert.severity === "DANGER"
                  ? "bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-200"
                  : "bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-200"
                }`}
              >
                Xem chi tiết
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
