"use client";

import { Settings, Key, Zap, CheckCircle2 } from "lucide-react";
import { DocsCopyButton } from "./copy-button";

interface IdeConfigProps {
  baseUrl: string;
}

export function DocsIdeConfig({ baseUrl }: IdeConfigProps) {
  const checklist = [
    "Đã tạo API key",
    "Đã chọn đúng Base URL",
    "Đã chọn model thuộc gói",
    "Đã tắt stream nếu công cụ có tùy chọn stream",
    "Kiểm tra Usage nếu request bị trừ credits"
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6">Hướng dẫn cấu hình IDE/Extension</h3>
          <p className="text-sm font-bold text-slate-500 mb-8">
            Nếu công cụ của bạn hỗ trợ OpenAI-compatible API, hãy nhập các thông tin sau:
          </p>

          <div className="space-y-6">
            <div className="group">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Base URL</label>
              <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl group-hover:border-emerald-200 transition-colors">
                <code className="text-sm font-mono font-bold text-slate-700 truncate">{baseUrl}</code>
                <DocsCopyButton text={baseUrl} className="bg-white border border-slate-200 shadow-sm" />
              </div>
            </div>

            <div className="group">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">API Key</label>
              <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl group-hover:border-emerald-200 transition-colors">
                <code className="text-sm font-mono font-bold text-slate-700 truncate">API key tạo trong trang API Keys</code>
                <DocsCopyButton text="YOUR_API_KEY" className="bg-white border border-slate-200 shadow-sm" />
              </div>
            </div>

            <div className="group">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Model</label>
              <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl group-hover:border-emerald-200 transition-colors">
                <code className="text-sm font-mono font-bold text-slate-700 truncate">codexai/gpt-5.3-codex</code>
                <DocsCopyButton text="codexai/gpt-5.3-codex" className="bg-white border border-slate-200 shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[32px] shadow-sm h-full">
          <h3 className="text-lg font-black text-emerald-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Checklist
          </h3>
          <ul className="space-y-4">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                   <div className="h-2 w-2 rounded-full bg-emerald-600" />
                </div>
                <span className="text-sm font-bold text-emerald-900/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
