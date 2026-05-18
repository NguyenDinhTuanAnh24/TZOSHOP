"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  KeyRound, 
  Code2, 
  ShieldCheck, 
  AlertCircle, 
  Copy,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { LandingPublicFooter } from "@/components/layout/landing-public-chrome";
import { ToastMessage } from "@/components/ui/toast-message";
import { AppCard } from "@/components/ui/app-card";
import { AppButton } from "@/components/ui/app-button";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

export default function ApiDocsPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

  const baseUrl = "https://api.tzoshop.io.vn/v1";

  const curlExample = `curl https://api.tzoshop.io.vn/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek/deepseek-v4-flash",
    "messages": [
      {
        "role": "user",
        "content": "Hello"
      }
    ]
  }'`;

  const jsExample = `const response = await fetch("https://api.tzoshop.io.vn/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "deepseek/deepseek-v4-flash",
    messages: [
      {
        role: "user",
        content: "Hello",
      },
    ],
  }),
});

const data = await response.json();
console.log(data);`;

  const responseExample = `{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "deepseek/deepseek-v4-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyState((prev) => ({ ...prev, [id]: true }));
    setToast({ message: "Đã copy nội dung.", type: "success" });
    
    setTimeout(() => {
      setCopyState((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-white text-[#0b0f0d]">
      <SiteHeader />

      <section className="bg-[#fbfbf8] border-b border-[#edf1ee]">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#edf1ee] bg-white px-4 py-2 text-sm font-black text-[#00d4a4] shadow-sm">
              <BookOpen className="h-4 w-4" />
              TAI LIỆU KỸ THUẬT
            </div>
            <h1 className={cn(ui.h1, "mb-6")}>
              Tài liệu API
            </h1>
            <p className={cn(ui.pMuted, "text-lg max-w-2xl leading-relaxed")}>
              Tài liệu này hướng dẫn bạn cách sử dụng API key được cấp bởi TzoShop trong IDE, extension hoặc ứng dụng riêng. API tương thích với chuẩn OpenAI, nên có thể dùng với nhiều công cụ hỗ trợ custom Base URL.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/plans">
                <AppButton variant="accent">
                  Mua credits
                  <ChevronRight className="h-4 w-4 ml-2" />
                </AppButton>
              </Link>
            </div>
          </div>
        </div>
      </section>


      <section className="border-b border-indigo-100 bg-indigo-50">
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <p className="text-sm font-medium text-indigo-900 leading-relaxed">
            <strong>💡 Hướng dẫn sử dụng:</strong> Khách hàng chỉ cần mua gói credits tại TzoShop, lấy API key tại trang API Keys, cấu hình Base URL và chọn đúng model thuộc gói đã mua để bắt đầu sử dụng hệ thống xử lý AI của TzoShop.
          </p>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-6 py-16 lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
        <div className="space-y-16">
          {/* Section 2: Base URL */}
          <section id="base-url" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7fff7] text-[#00d4a4] ring-1 ring-[#00d4a4]/20 shadow-sm">
                <Code2 className="h-6 w-6" />
              </div>
              <h2 className={ui.h3}>Base URL</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-1">
              <AppCard className="p-6">
                <p className={ui.label}>Địa chỉ Base URL</p>
                <div className="flex items-center justify-between gap-3 mt-2">
                  <code className="text-sm font-black text-[#00d4a4] break-all">{baseUrl}</code>
                  <AppButton 
                    onClick={() => handleCopy(baseUrl, "base-url-copy")}
                    variant="secondary"
                    size="sm"
                    className="h-10 w-10 p-0"
                  >
                    {copyState["base-url-copy"] ? <CheckCircle2 className="h-4 w-4 text-[#00d4a4]" /> : <Copy className="h-4 w-4 text-[#8a9690]" />}
                  </AppButton>
                </div>
              </AppCard>
            </div>
          </section>

          <section id="authentication" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7fff7] text-[#00d4a4] ring-1 ring-[#00d4a4]/20 shadow-sm">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className={ui.h3}>Xác thực</h2>
            </div>
            
            <AppCard className="p-8">
              <p className={cn(ui.p, "mb-6")}>
                Tất cả các yêu cầu API phải bao gồm API key của bạn trong header <code className="bg-[#fbfbf8] px-2 py-1 rounded border border-[#edf1ee] font-black text-[#00d4a4]">Authorization</code>.
              </p>
              
              <div className="bg-[#0b0f0d] rounded-3xl p-6 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">HTTP Header</span>
                  <AppButton 
                    onClick={() => handleCopy("Authorization: Bearer YOUR_API_KEY", "auth-header")}
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 text-white hover:bg-white/20 border-white/10"
                  >
                    {copyState["auth-header"] ? <span className="text-[#00d4a4]">Đã copy</span> : <Copy className="h-4 w-4" />}
                  </AppButton>
                </div>
                <code className="text-[#00d4a4] text-sm font-mono block">Authorization: Bearer YOUR_API_KEY</code>
              </div>
              
              <div className="mt-8 flex items-start gap-4 rounded-3xl bg-amber-50/50 border border-amber-100 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-amber-800 leading-relaxed">
                  API key của bạn là bí mật tuyệt đối. Đừng bao giờ chia sẻ công khai hoặc nhúng trực tiếp vào mã nguồn phía client (Frontend) để tránh bị đánh cắp credits.
                </p>
              </div>
            </AppCard>
          </section>

          {/* Section 4 & 5: Chat Completions & Examples */}
          <section id="chat-completions" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7fff7] text-[#00d4a4] ring-1 ring-[#00d4a4]/20 shadow-sm">
                <Code2 className="h-6 w-6" />
              </div>
              <h2 className={ui.h3}>Chat Completions</h2>
            </div>

            <div className="space-y-12">
              <div>
                <p className={cn(ui.p, "mb-6")}>
                  Sử dụng endpoint này để tương tác với các dòng AI. Chúng tôi hỗ trợ đầy đủ cấu trúc của OpenAI API giúp bạn dễ dàng chuyển đổi từ OpenAI sang TzoShop.
                </p>
                <div className="flex items-center gap-4 bg-[#fbfbf8] border border-[#edf1ee] rounded-2xl px-6 py-4 shadow-sm">
                  <span className="bg-[#00d4a4] text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm">POST</span>
                  <code className="text-sm font-black text-[#0b0f0d]">/chat/completions</code>
                </div>
              </div>

              {/* Curl Example */}
              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className={cn(ui.label, "text-[#0b0f0d]")}>Ví dụ CURL</h3>
                  <AppButton 
                    onClick={() => handleCopy(curlExample, "curl-code")}
                    variant="secondary"
                    size="sm"
                  >
                    {copyState["curl-code"] ? <CheckCircle2 className="h-4 w-4 text-[#00d4a4] mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copyState["curl-code"] ? "Đã copy" : "Copy nội dung"}
                  </AppButton>
                </div>
                <div className="bg-[#0b0f0d] rounded-[32px] p-8 overflow-x-auto shadow-2xl ring-8 ring-[#fbfbf8]">
                  <pre className="text-sm text-[#00d4a4] font-mono leading-relaxed">
                    <code>{curlExample}</code>
                  </pre>
                </div>
              </div>

              {/* JS Example */}
              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className={cn(ui.label, "text-[#0b0f0d]")}>Ví dụ JavaScript (Fetch)</h3>
                  <AppButton 
                    onClick={() => handleCopy(jsExample, "js-code")}
                    variant="secondary"
                    size="sm"
                  >
                    {copyState["js-code"] ? <CheckCircle2 className="h-4 w-4 text-[#00d4a4] mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copyState["js-code"] ? "Đã copy" : "Copy nội dung"}
                  </AppButton>
                </div>
                <div className="bg-[#0b0f0d] rounded-[32px] p-8 overflow-x-auto shadow-2xl ring-8 ring-[#fbfbf8]">
                  <pre className="text-sm text-[#00d4a4] font-mono leading-relaxed">
                    <code>{jsExample}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Response mẫu */}
          <section id="response" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7fff7] text-[#00d4a4] ring-1 ring-[#00d4a4]/20 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className={ui.h3}>Response mẫu</h2>
            </div>
            
            <AppCard className="overflow-hidden p-0">
              <div className="bg-[#fbfbf8] px-8 py-4 border-b border-[#edf1ee]">
                <span className={ui.label}>JSON Response</span>
              </div>
              <div className="p-8 bg-white overflow-x-auto">
                <pre className="text-sm text-[#47524d] leading-relaxed font-mono font-bold">
                  <code>{responseExample}</code>
                </pre>
              </div>
            </AppCard>
          </section>

          <section id="errors" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-500/20 shadow-sm">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className={ui.h3}>Lỗi thường gặp</h2>
            </div>
            
            <AppCard className="overflow-hidden p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#fbfbf8] border-b border-[#edf1ee]">
                  <tr>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#8a9690]">Mã lỗi</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-[#8a9690]">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1ee]">
                  {[
                    { code: "401", desc: "API key thiếu, sai hoặc đã bị thu hồi." },
                    { code: "403", desc: "API key không có quyền dùng model này. Hãy kiểm tra model có thuộc gói đã mua không." },
                    { code: "402", desc: "Credits không đủ hoặc gói đã hết hạn." },
                    { code: "404", desc: "Endpoint hoặc model không tồn tại. Hãy kiểm tra lại tên model." },
                    { code: "429", desc: "Bạn gửi quá nhiều request trong thời gian ngắn. Vui lòng thử lại sau." },
                    { code: "500", desc: "Hệ thống xử lý AI đang gặp lỗi tạm thời. Vui lòng thử lại sau." },
                    { code: "503", desc: "Model hiện chưa khả dụng. Vui lòng thử model khác trong gói hoặc liên hệ hỗ trợ." },
                  ].map((error) => (
                    <tr key={error.code} className="hover:bg-[#fbfbf8] transition-colors">
                      <td className="px-8 py-5">
                        <span className="font-mono font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">{error.code}</span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-[#47524d]">{error.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AppCard>
          </section>

          {/* Section 7.5: Cấu hình IDE */}
          <section id="ide-config" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7fff7] text-[#00d4a4] ring-1 ring-[#00d4a4]/20 shadow-sm">
                <Code2 className="h-6 w-6" />
              </div>
              <h2 className={ui.h3}>Cấu hình IDE / Extension</h2>
            </div>
            
            <AppCard className="p-8 space-y-6">
              <p className={cn(ui.p, "mb-4")}>
                Bạn có thể tích hợp API Key của TzoShop vào bất kỳ công cụ lập trình, IDE hoặc extension hỗ trợ chuẩn kết nối OpenAI (như VS Code Continue, Cursor, Cline, Copilot...).
              </p>
              
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="p-5 bg-[#fbfbf8] rounded-2xl border border-[#edf1ee]">
                  <h4 className="font-black text-sm text-[#0b0f0d] mb-1">Base URL</h4>
                  <code className="text-xs text-[#00d4a4] font-black break-all">https://api.tzoshop.io.vn/v1</code>
                  <p className="text-xs text-[#8a9690] mt-2">Địa chỉ API chính thức của TzoShop.</p>
                </div>
                
                <div className="p-5 bg-[#fbfbf8] rounded-2xl border border-[#edf1ee]">
                  <h4 className="font-black text-sm text-[#0b0f0d] mb-1">API Key</h4>
                  <code className="text-xs text-indigo-600 font-bold break-all font-mono">API key lấy tại /api-keys</code>
                  <p className="text-xs text-[#8a9690] mt-2">API Key bạn sao chép tại mục /api-keys.</p>
                </div>

                <div className="p-5 bg-[#fbfbf8] rounded-2xl border border-[#edf1ee]">
                  <h4 className="font-black text-sm text-[#0b0f0d] mb-1">Model Name</h4>
                  <code className="text-xs text-[#00d4a4] font-black break-all">deepseek/deepseek-v4-flash</code>
                  <p className="text-xs text-[#8a9690] mt-2">Hoặc model bất kỳ thuộc gói bạn đã mua.</p>
                </div>
              </div>
            </AppCard>
          </section>

          {/* Section 8: Lưu ý */}
          <section id="notes" className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7fff7] text-[#00d4a4] ring-1 ring-[#00d4a4]/20 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className={ui.h3}>Lưu ý quan trọng</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { title: "Bảo mật", content: "Tuyệt đối không chia sẻ API key công khai trên GitHub, mạng xã hội hoặc các diễn đàn." },
                { title: "Gói Credits", content: "Mỗi API key liên kết với một gói credits cụ thể mà bạn đã mua." },
                { title: "Cách tính phí", content: "Credits sẽ bị trừ theo usage thực tế (tokens) của model bạn sử dụng." },
                { title: "Quản lý", content: "Bạn có thể xem lịch sử sử dụng chi tiết và quản lý key tại dashboard cá nhân." },
              ].map((note) => (
                <AppCard key={note.title} className="p-8">
                  <h3 className={cn(ui.label, "text-[#0b0f0d] mb-4 flex items-center gap-3")}>
                    <span className="h-2 w-2 rounded-full bg-[#00d4a4] shadow-[0_0_10px_#00d4a4]" />
                    {note.title}
                  </h3>
                  <p className="text-sm font-bold text-[#47524d] leading-relaxed">{note.content}</p>
                </AppCard>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Navigation */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <div className="bg-[#fbfbf8] rounded-3xl p-6 border border-[#edf1ee]">
              <h4 className={ui.label}>Nội dung chính</h4>
              <nav className="flex flex-col gap-1 mt-4">
                {[
                  { id: "base-url", label: "Base URL" },
                  { id: "authentication", label: "Xác thực" },
                  { id: "chat-completions", label: "Chat Completions" },
                  { id: "response", label: "Response mẫu" },
                  { id: "errors", label: "Lỗi thường gặp" },
                  { id: "ide-config", label: "Cấu hình IDE" },
                  { id: "notes", label: "Lưu ý quan trọng" },
                ].map((item) => (
                  <a 
                    key={item.id} 
                    href={`#${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-black text-[#47524d] hover:text-[#00d4a4] hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#edf1ee] hover:shadow-sm"
                  >
                    <ChevronRight className="h-3 w-3 opacity-30" />
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="p-8 rounded-[32px] bg-[#0b0f0d] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4a4]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[#00d4a4]/20" />
              <h4 className="text-lg font-black mb-3 relative z-10">Cần hỗ trợ?</h4>
              <p className="text-sm font-bold text-white/50 mb-6 leading-relaxed relative z-10">
                Nếu bạn gặp khó khăn trong việc tích hợp, hãy liên hệ với đội ngũ kỹ thuật.
              </p>
              <Link href="/support">
                <AppButton 
                  variant="accent"
                  className="w-full relative z-10"
                >
                  Gửi yêu cầu hỗ trợ <ExternalLink className="h-4 w-4 ml-2" />
                </AppButton>
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <LandingPublicFooter />

      {toast && (
        <ToastMessage 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </main>
  );
}
