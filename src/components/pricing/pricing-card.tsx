"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCredits, formatDuration, formatVnd } from "@/lib/format";

type PricingCardProps = {
  id: string;
  name: string;
  slug: string;
  credits: bigint | number;
  durationDays: number;
  priceVnd: number;
  allowedModels: string[];
  apiKeyLimit?: number;
  featured?: boolean;
};

export function PricingCard({
  id,
  name,
  credits,
  durationDays,
  priceVnd,
  allowedModels,
  apiKeyLimit = 1,
  featured = false,
}: PricingCardProps) {
  const router = useRouter();
  const { status } = useSession();

  const isContactPlan = 
    priceVnd === 0 ||
    name.toLowerCase().includes("enterprise") || 
    name.toLowerCase().includes("custom") || 
    name.toLowerCase().includes("liên hệ");

  function handleChoosePlan() {
    if (isContactPlan) {
      router.push("/support?type=custom-plan");
      return;
    }

    const targetUrl = `/plans?product=${id}`;

    if (status === "authenticated") {
      router.push(targetUrl);
      return;
    }

    router.push(`/login?callbackUrl=${encodeURIComponent(targetUrl)}`);
  }

  return (
    <div
      className={`relative rounded-[32px] border bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md ${
        featured
          ? "border-emerald-300 ring-1 ring-emerald-200"
          : "border-slate-200"
      }`}
    >
      {featured && (
        <span className="absolute right-6 top-6 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          Phổ biến
        </span>
      )}

      <h3 className="pr-20 text-xl font-bold text-slate-950">
        {name}
      </h3>

      <p className="mt-2 text-sm font-medium text-slate-500">
        {formatCredits(credits)} · {formatDuration(durationDays)}
      </p>

      <div className="mt-6 flex items-end gap-1">
        <span className="text-3xl font-black text-slate-950">
          {isContactPlan ? "Liên hệ" : formatVnd(priceVnd)}
        </span>
      </div>

      <div className="mt-5 rounded-3xl bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Model hỗ trợ
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {allowedModels.slice(0, 3).map((model) => (
            <span
              key={model}
              title={model}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
            >
              {model}
            </span>
          ))}

          {allowedModels.length > 3 && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              +{allowedModels.length - 3} model
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Thời hạn</p>
          <p className="mt-1 font-bold text-slate-950">
            {formatDuration(durationDays)}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">API key</p>
          <p className="mt-1 font-bold text-slate-950">
            {apiKeyLimit} key
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleChoosePlan}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
      >
        {isContactPlan ? "Liên hệ tư vấn" : "Chọn gói này"}
      </button>
    </div>
  );
}
