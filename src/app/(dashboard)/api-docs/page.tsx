"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Key,
  Database,
  History,
  LayoutGrid,
  Code2,
  ListTree,
  AlertTriangle,
  Settings,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

// Sub-components
import { DocsQuickConfig } from "@/components/docs/quick-config";
import { DocsQuickStart } from "@/components/docs/quick-start";
import { DocsCodeExamples } from "@/components/docs/code-examples";
import { DocsModelAccordion } from "@/components/docs/model-accordion";
import { DocsErrorAccordion } from "@/components/docs/error-accordion";
import { DocsIdeConfig } from "@/components/docs/ide-config";
import { DocsSupportCard } from "@/components/docs/support-card";

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState("start");
  const { toast, clearToast } = useToast();

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3004" : "https://tzoshop.io.vn");
  const BASE_URL = `${APP_URL}/api/v1`;
  const CHAT_URL = `${BASE_URL}/chat/completions`;

  const tabs = [
    { id: "start", label: "Bắt đầu nhanh", icon: Zap },
    { id: "code", label: "Ví dụ code", icon: Code2 },
    { id: "models", label: "Models", icon: ListTree },
    { id: "errors", label: "Lỗi thường gặp", icon: AlertTriangle },
    { id: "ide", label: "Cấu hình IDE/Extension", icon: Settings },
  ];

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4 sm:px-0">
      {/* Header Section */}
      <div className="bg-white p-8 sm:p-12 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              <Sparkles className="h-3 w-3" /> OpenAI-compatible
            </div>
            <div className="text-xs font-bold text-slate-400">
              Version 1.0.0
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Tài liệu API
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 font-bold max-w-2xl leading-relaxed">
            Kết nối API key TzoShop với extension, IDE hoặc API client tương thích OpenAI.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-colors">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base URL</span>
                <code className="text-sm font-mono font-bold text-slate-700">{BASE_URL}</code>
             </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-10">
            <Link href="/api-keys" className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 hover:-translate-y-0.5 active:translate-y-0">
              <Key className="h-4 w-4 text-white" /> Tạo API key
            </Link>
            <Link href="/my-plans" className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-4 text-sm font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0">
              <Database className="h-4 w-4 text-emerald-600" /> Gói của tôi
            </Link>
            <Link href="/usage" className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-4 text-sm font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0">
              <History className="h-4 w-4 text-emerald-600" /> Lịch sử sử dụng
            </Link>
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -right-20 -bottom-20 h-80 w-80 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Config Card - Right at the top */}
      <DocsQuickConfig baseUrl={BASE_URL} />

      {/* Main Navigation Tabs */}
      <div className="bg-white p-2 rounded-[32px] border border-slate-200 shadow-sm sticky top-4 z-40 overflow-x-auto hide-scrollbar">
        <div className="flex items-center min-w-max gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Section */}
      <div className="min-h-[400px]">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "start" && <DocsQuickStart baseUrl={BASE_URL} />}
          {activeTab === "code" && <DocsCodeExamples apiUrl={CHAT_URL} />}
          {activeTab === "models" && <DocsModelAccordion />}
          {activeTab === "errors" && <DocsErrorAccordion />}
          {activeTab === "ide" && <DocsIdeConfig baseUrl={BASE_URL} />}
        </div>
      </div>

      {/* Global Support Card */}
      <DocsSupportCard />

      {/* Toast Notifications */}
      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}
