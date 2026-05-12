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
  Sparkles,
  BookOpen,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { AppCard } from "@/components/ui/app-card";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import DashboardSubNav from "@/components/dashboard/dashboard-sub-nav";

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
    <div className="space-y-10 pb-20">
      <DashboardSubNav 
        items={[
          { label: "API Keys", href: "/api-keys" },
          { label: "Tài liệu API", href: "/api-docs" },
          { label: "Lịch sử sử dụng", href: "/usage" },
        ]} 
      />
      
      {/* Section Header Card */}
      <AppCard className="p-8 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-sm shrink-0">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Tài liệu API</h2>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Kết nối API key TzoShop với extension, IDE hoặc API client tương thích OpenAI.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/api-keys" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-900/10">
              <Key className="h-4 w-4" />
              Tạo API key
            </Link>
            <Link href="/usage" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50">
              <History className="h-4 w-4 text-emerald-600" />
              Lịch sử sử dụng
            </Link>
          </div>
        </div>
      </AppCard>

      {/* Quick Config Card */}
      <DocsQuickConfig baseUrl={BASE_URL} />

      {/* Tabs nội dung docs */}
      <div className="space-y-6">
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
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
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
