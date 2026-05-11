"use client";

import { useEffect, useState } from "react";
import { 
  AlertCircle, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  Activity,
  Clock
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

export function AdminAlertsBlock() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/admin/alerts");
        const data = await res.json();
        if (data.success) {
          setAlerts(data.alerts.slice(0, 5));
          setSummary(data.summary);
          setIsError(false);
        } else {
          setIsError(true);
        }
      } catch (error) {
        console.error("Fetch alerts failed:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-100 rounded-full mb-6" />
        <div className="space-y-4">
          <div className="h-24 w-full bg-slate-50 rounded-3xl" />
          <div className="h-24 w-full bg-slate-50 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-50 p-8 rounded-[40px] border border-rose-100 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="font-black text-rose-900">Không thể tải cảnh báo</h3>
        <p className="text-sm font-bold text-rose-600 mt-1">Vui lòng tải lại trang hoặc kiểm tra lại sau.</p>
      </div>
    );
  }

  if (!summary || summary.total === 0) {
    return (
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center py-12">
        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4 ring-8 ring-emerald-50">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Hệ thống đang ổn định</h3>
        <p className="text-sm font-bold text-slate-400 mt-1">Mọi hoạt động vận hành đều đang diễn ra bình thường.</p>
        <Link href="/admin/alerts" className="mt-6 text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2">
           Xem lịch sử cảnh báo <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cảnh báo vận hành</h2>
             {summary.total > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-lg shadow-rose-200 animate-bounce">
                   {summary.total}
                </span>
             )}
          </div>
          <p className="text-sm font-bold text-slate-500">Các vấn đề cần can thiệp ngay lập tức.</p>
        </div>
        <Link href="/admin/alerts" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all">
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={`p-5 rounded-3xl border transition-all flex items-start gap-4 group cursor-pointer ${
              alert.severity === "DANGER" 
              ? "bg-rose-50/50 border-rose-100 hover:border-rose-200" 
              : "bg-amber-50/50 border-amber-100 hover:border-amber-200"
            }`}
            onClick={() => router.push(alert.href)}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              alert.severity === "DANGER" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
            }`}>
              {alert.severity === "DANGER" ? <AlertCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-black text-slate-900 truncate tracking-tight">{alert.title}</h3>
                <span className="text-[10px] font-bold text-slate-400 shrink-0">
                   {new Date(alert.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-relaxed">
                {alert.message}
              </p>
            </div>

            <div className="self-center translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
               <ChevronRight className={`h-4 w-4 ${alert.severity === "DANGER" ? "text-rose-400" : "text-amber-400"}`} />
            </div>
          </div>
        ))}
      </div>

      <Link href="/admin/alerts" style={{ color: '#ffffff' }} className="mt-8 block w-full py-4 rounded-2xl bg-emerald-600 text-center text-xs font-black text-white hover:bg-emerald-700 transition-all uppercase tracking-widest">
        Xem tất cả cảnh báo
      </Link>
    </div>
  );
}
