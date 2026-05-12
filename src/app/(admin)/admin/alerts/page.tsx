"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  ChevronRight, 
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  ShoppingCart,
  Activity,
  Server
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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

  const fetchAlerts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlerts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAlerts]);

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
      <PageHeader 
        title="Cảnh báo vận hành" 
        description="Hệ thống giám sát và phát hiện sự cố tự động."
        icon={<AlertCircle className="h-8 w-8 text-rose-500" />}
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#e7fff7] px-4 py-2 text-[10px] font-black text-[#00d4a4] ring-1 ring-[#00d4a4]/20 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-[#00d4a4] animate-pulse shadow-[0_0_8px_#00d4a4]" />
              REALTIME MONITORING
            </div>
            <AppButton 
              onClick={fetchAlerts}
              disabled={isLoading}
              variant="primary"
              size="sm"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              {isLoading ? "Đang tải..." : "Làm mới"}
            </AppButton>
          </div>
        }
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <AppCard className="p-7">
          <p className={ui.label}>Tổng cảnh báo</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-4xl font-black text-[#0b0f0d]">{summary?.total || 0}</h3>
            <Activity className="h-10 w-10 text-[#edf1ee]" />
          </div>
        </AppCard>

        <AppCard className="p-7 bg-rose-50/50 border-rose-100 shadow-sm">
          <p className={cn(ui.label, "text-rose-600")}>Nguy hiểm (DANGER)</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-4xl font-black text-rose-600">{summary?.danger || 0}</h3>
            <AlertCircle className="h-10 w-10 text-rose-200" />
          </div>
        </AppCard>

        <AppCard className="p-7 bg-[#fff9e7]/50 border-[#ffb800]/20 shadow-sm">
          <p className={cn(ui.label, "text-[#ffb800]")}>Cần chú ý (WARNING)</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-4xl font-black text-[#ffb800]">{summary?.warning || 0}</h3>
            <AlertTriangle className="h-10 w-10 text-[#ffb800]/20" />
          </div>
        </AppCard>
      </div>

      <AppCard className="flex flex-wrap gap-4 items-center bg-[#fbfbf8]/50 p-6">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-[#edf1ee]">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "DANGER", label: "Nguy hiểm" },
            { id: "WARNING", label: "Cần chú ý" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black transition-all",
                filter === item.id 
                ? "bg-[#0b0f0d] text-white shadow-lg" 
                : "text-[#8a9690] hover:bg-[#fbfbf8] hover:text-[#0b0f0d]"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="h-10 w-px bg-[#edf1ee] hidden md:block mx-2" />

        <div className="flex flex-wrap gap-2">
          {[
            { id: "ALL", label: "Tất cả loại", icon: Filter },
            { id: "CREDITS", label: "Credits", icon: Zap },
            { id: "ORDERS", label: "Orders", icon: ShoppingCart },
            { id: "USAGE", label: "Usage", icon: Activity },
            { id: "MODEL", label: "Model", icon: Server },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = category === item.id;
            return (
              <AppButton
                key={item.id}
                onClick={() => setCategory(item.id)}
                variant={isActive ? "accent" : "secondary"}
                className="h-11 px-5"
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </AppButton>
            );
          })}
        </div>
      </AppCard>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-32 w-full bg-[#fbfbf8] rounded-[40px] border border-[#edf1ee] animate-pulse" />
          ))
        ) : filteredAlerts.length === 0 ? (
          <AppCard className="flex flex-col items-center justify-center py-20 border-dashed border-2">
            <div className="h-20 w-20 rounded-full bg-[#e7fff7] flex items-center justify-center text-[#00d4a4] mb-4 shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className={ui.h3}>Hệ thống đang ổn định</h3>
            <p className={cn(ui.pMuted, "text-sm mt-1")}>Chưa có cảnh báo vận hành nào cần xử lý.</p>
          </AppCard>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={cn(
                "p-8 rounded-[40px] border transition-all hover:shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 group relative overflow-hidden",
                alert.severity === "DANGER" 
                ? "bg-white border-rose-100 hover:border-rose-200" 
                : "bg-white border-[#ffb800]/20 hover:border-[#ffb800]/40"
              )}
            >
              <div className="flex items-start gap-6 relative z-10">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  alert.severity === "DANGER" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-[#fff9e7] text-[#ffb800] border border-[#ffb800]/10"
                )}>
                  {alert.severity === "DANGER" ? <AlertCircle className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-black text-[#0b0f0d] tracking-tight">{alert.title}</h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
                      alert.severity === "DANGER" ? "bg-rose-600 text-white" : "bg-[#ffb800] text-white"
                    )}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className={cn(ui.pMuted, "text-sm leading-relaxed max-w-2xl font-bold")}>{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                     <span className="flex items-center gap-1.5 text-[11px] font-black text-[#8a9690] uppercase tracking-tighter bg-[#fbfbf8] px-3 py-1.5 rounded-full border border-[#edf1ee]">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(alert.createdAt).toLocaleString("vi-VN")}
                     </span>
                     <span className="text-[11px] font-black text-[#edf1ee]">/</span>
                     <span className="text-[11px] font-black text-[#8a9690] uppercase tracking-tighter bg-[#fbfbf8] px-3 py-1.5 rounded-full border border-[#edf1ee]">
                        TYPE: {alert.type}
                     </span>
                  </div>
                </div>
              </div>

              <AppButton 
                onClick={() => router.push(alert.href)}
                variant={alert.severity === "DANGER" ? "primary" : "accent"}
                className={cn(
                  "lg:w-auto px-8 h-[56px] relative z-10",
                  alert.severity === "DANGER" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : ""
                )}
              >
                Xem chi tiết
                <ChevronRight className="h-4 w-4 ml-2" />
              </AppButton>

              {/* Subtle background decoration */}
              <div className={cn(
                "absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110 duration-500",
                alert.severity === "DANGER" ? "text-rose-600" : "text-[#ffb800]"
              )}>
                {alert.severity === "DANGER" ? <AlertCircle className="h-32 w-32" /> : <AlertTriangle className="h-32 w-32" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
