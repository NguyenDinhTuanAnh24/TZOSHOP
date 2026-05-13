"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpenText,
  Code2,
  History,
  Key,
  ListTree,
  Settings,
  Zap,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { AppButton } from "@/components/ui/app-button";
import { DocsQuickConfig } from "@/components/docs/quick-config";
import { DocsQuickStart } from "@/components/docs/quick-start";
import { DocsCodeExamples } from "@/components/docs/code-examples";
import { DocsModelAccordion } from "@/components/docs/model-accordion";
import { DocsErrorAccordion } from "@/components/docs/error-accordion";
import { DocsIdeConfig } from "@/components/docs/ide-config";
import { DocsSupportCard } from "@/components/docs/support-card";

type DocsTab = "start" | "code" | "models" | "errors" | "ide";

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<DocsTab>("start");
  const { toast, clearToast } = useToast();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://tzoshop.io.vn";
  const apiBaseUrl = `${appUrl}/api/v1`;
  const chatUrl = `${apiBaseUrl}/chat/completions`;

  const tabs: Array<{ id: DocsTab; label: string; icon: ComponentType<{ className?: string }> }> = [
    { id: "start", label: "Bắt đầu nhanh", icon: Zap },
    { id: "code", label: "Ví dụ code", icon: Code2 },
    { id: "models", label: "Models", icon: ListTree },
    { id: "errors", label: "Lỗi thường gặp", icon: AlertTriangle },
    { id: "ide", label: "Cấu hình IDE/Extension", icon: Settings },
  ];

  return (
    <main className="space-y-8 lg:space-y-10" aria-busy="false">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border-4 border-black bg-[#FFD93D] text-black shadow-[5px_5px_0px_0px_#000]">
              <BookOpenText className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">TÀI LIỆU API</h2>
              <p className="mt-2 text-sm font-bold text-black/70 md:text-base">
                Kết nối API key TzoShop với extension, IDE hoặc API client tương thích OpenAI.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">
            <Link href="/api-keys" className="w-full sm:w-auto">
              <AppButton variant="primary" className="h-12 w-full px-6 sm:w-auto">
                <Key className="mr-2 h-4 w-4" />
                Tạo API key
              </AppButton>
            </Link>
            <Link href="/usage" className="w-full sm:w-auto">
              <AppButton variant="secondary" className="h-12 w-full px-6 sm:w-auto">
                <History className="mr-2 h-4 w-4" />
                Xem usage
              </AppButton>
            </Link>
          </div>
        </div>
      </section>

      <DocsQuickConfig onOpenCodeExamples={() => setActiveTab("code")} />

      <section className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <div className="flex w-max gap-3 pr-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "inline-flex h-11 items-center whitespace-nowrap border-4 border-black px-4 text-xs font-black uppercase tracking-wide text-black transition-all duration-100 ease-linear focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                  active
                    ? "bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]"
                    : "bg-[#FFFDF5] shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:bg-[#FFD93D]",
                ].join(" ")}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
          </div>
        </div>

        <div role="tabpanel" className="space-y-6">
          {activeTab === "start" && <DocsQuickStart baseUrl={apiBaseUrl} onGoCode={() => setActiveTab("code")} />}
          {activeTab === "code" && <DocsCodeExamples apiBaseUrl={apiBaseUrl} apiUrl={chatUrl} />}
          {activeTab === "models" && <DocsModelAccordion />}
          {activeTab === "errors" && <DocsErrorAccordion />}
          {activeTab === "ide" && <DocsIdeConfig baseUrl={apiBaseUrl} />}
        </div>
      </section>

      <DocsSupportCard />

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </main>
  );
}
