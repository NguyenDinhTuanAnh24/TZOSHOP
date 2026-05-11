"use client";

import Link from "next/link";
import { Zap, Key, Settings, Terminal, CheckCircle2 } from "lucide-react";
import { DocsCodeBlock } from "./code-block";

interface QuickStartProps {
  baseUrl: string;
}

export function DocsQuickStart({ baseUrl }: QuickStartProps) {
  const steps = [
    {
      title: "Bước 1: Mua hoặc kích hoạt gói credits",
      desc: "Chọn gói phù hợp tại trang Credits/Pricing.",
      link: "/plans",
      linkText: "Xem bảng giá",
      icon: Zap,
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "Bước 2: Tạo API key",
      desc: "Vào API Keys, tạo key và liên kết với gói đang hoạt động.",
      link: "/api-keys",
      linkText: "Tạo Key ngay",
      icon: Key,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Bước 3: Cấu hình Base URL",
      desc: `Sử dụng URL: ${baseUrl}`,
      icon: Settings,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Bước 4: Gửi request",
      desc: "Chọn model được hỗ trợ trong gói và gửi request chuẩn OpenAI.",
      icon: Terminal,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50"
    }
  ];

  const minBody = `{
  "model": "codexai/gpt-5.3-codex",
  "messages": [
    {
      "role": "user",
      "content": "Hello, TzoShop API"
    }
  ]
}`;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative group hover:border-emerald-200 transition-all">
              <div className={`h-12 w-12 rounded-2xl ${step.bgColor} ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2 leading-tight">{step.title}</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed mb-4">{step.desc}</p>
              {step.link && (
                <Link href={step.link} className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:underline">
                  {step.linkText} <CheckCircle2 className="h-3 w-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-600" /> Request body tối thiểu
          </h3>
        </div>
        <DocsCodeBlock code={minBody} language="json" />
      </div>
    </div>
  );
}
