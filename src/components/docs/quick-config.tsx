"use client";

import { Settings } from "lucide-react";
import { DocsCopyButton } from "./copy-button";
import { AppCard } from "@/components/ui/app-card";


interface QuickConfigProps {
  baseUrl: string;
}

export function DocsQuickConfig({ baseUrl }: QuickConfigProps) {
  return (
    <AppCard className="p-8 sm:p-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
          <Settings className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Cấu hình nhanh</h2>
      </div>

      <div className="grid gap-6">
        {/* Base URL */}
        <div className="group">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5 block px-1">
            Base URL
          </label>
          <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl group-hover:border-emerald-200 transition-colors">
            <code className="text-sm font-mono font-bold text-slate-700 truncate">{baseUrl}</code>
            <DocsCopyButton text={baseUrl} className="bg-white border border-slate-200 shadow-sm" />
          </div>
        </div>

        {/* Endpoint */}
        <div className="group">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5 block px-1">
            Endpoint
          </label>
          <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl group-hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-[10px] font-black text-white uppercase">POST</span>
              <code className="text-sm font-mono font-bold text-slate-700">/chat/completions</code>
            </div>
            <DocsCopyButton text="/chat/completions" className="bg-white border border-slate-200 shadow-sm" />
          </div>
        </div>

        {/* Header */}
        <div className="group">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2.5 block px-1">
            Header
          </label>
          <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl group-hover:border-emerald-200 transition-colors">
            <div className="overflow-hidden">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Authorization</span>
              <code className="text-sm font-mono font-bold text-slate-700 truncate block">Bearer YOUR_TZOSHOP_API_KEY</code>
            </div>
            <DocsCopyButton text="Authorization: Bearer YOUR_TZOSHOP_API_KEY" className="bg-white border border-slate-200 shadow-sm" />
          </div>
        </div>
      </div>
      <div className="mt-8 p-5 rounded-[24px] bg-emerald-50 border border-emerald-100/50">
        <p className="text-sm font-bold text-emerald-800 leading-relaxed">
          <span className="font-black">Lưu ý:</span> Tất cả model đều dùng chung endpoint OpenAI-compatible của TzoShop. Một số model có thể được TzoShop tự động chuyển tiếp sang endpoint nội bộ phù hợp, người dùng không cần cấu hình riêng.
        </p>
      </div>
    </AppCard>
  );
}
