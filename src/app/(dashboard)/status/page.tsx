"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Wrench } from "lucide-react";

import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { cn } from "@/lib/utils";

type ServiceStatus = "operational" | "degraded" | "maintenance" | "incident";

type ServiceItem = {
  name: string;
  status: ServiceStatus;
  description: string;
};

type StatusData = {
  overall: ServiceStatus;
  updatedAt: string;
  services: ServiceItem[];
};

function toLabel(status: ServiceStatus) {
  if (status === "operational") return "Hoạt động bình thường";
  if (status === "maintenance") return "Đang bảo trì";
  if (status === "incident") return "Gặp sự cố";
  return "Đang gián đoạn một phần";
}

function toClass(status: ServiceStatus) {
  if (status === "operational") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "maintenance") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (status === "incident") return "border-rose-100 bg-rose-50 text-rose-700";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/system-status", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error("Không thể tải trạng thái hệ thống.");
      setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải trạng thái hệ thống.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const overall = useMemo(() => {
    if (!data) return { label: "Đang kiểm tra", icon: Clock3, cls: "text-slate-700" };
    if (data.overall === "incident") return { label: "Gặp sự cố", icon: AlertTriangle, cls: "text-rose-700" };
    if (data.overall === "maintenance") return { label: "Đang bảo trì", icon: Wrench, cls: "text-indigo-700" };
    if (data.overall === "degraded") return { label: "Đang gián đoạn một phần", icon: AlertTriangle, cls: "text-amber-700" };
    return { label: "Hoạt động bình thường", icon: CheckCircle2, cls: "text-emerald-700" };
  }, [data]);

  return (
    <main className="space-y-8 pb-20">
      <TextFadeInUp as="section" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Trạng thái hệ thống</h1>
        <p className="mt-2 text-sm text-slate-600">Theo dõi tình trạng Website TzoShop, thanh toán, API, cấp phát API key và đồng bộ credits.</p>
      </TextFadeInUp>

      {error ? <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</section> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <overall.icon className={cn("h-5 w-5", overall.cls)} />
          <p className={cn("text-xl font-bold", overall.cls)}>{overall.label}</p>
        </div>
        <p className="mt-2 text-sm text-slate-600">Cập nhật gần nhất: {data ? new Date(data.updatedAt).toLocaleString("vi-VN") : "--"}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(data?.services || []).map((service) => (
          <article key={service.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{service.name}</p>
            <span className={cn("mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", toClass(service.status))}>{toLabel(service.status)}</span>
            <p className="mt-2 text-sm text-slate-600">{service.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
