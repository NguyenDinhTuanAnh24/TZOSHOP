"use client";

import { useMemo, useState } from "react";
import { BookOpenText, Copy, Key } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { cn } from "@/lib/utils";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { getApiBaseUrl } from "@/lib/integration-config";

type CodeTab = "curl" | "javascript" | "python";

const SAMPLE_MODEL = "GPT-5.3-Codex";

export default function ApiDocsPage() {
  const [requestTab, setRequestTab] = useState<CodeTab>("curl");
  const { toast, showToast, clearToast } = useToast(3000);

  const baseUrl = getApiBaseUrl();
  const chatUrl = `${baseUrl}/chat/completions`;
  const chatPath = "/chat/completions";

  const requestCode = useMemo(() => {
    const curl = `curl ${chatUrl} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${SAMPLE_MODEL}",
    "messages": [
      { "role": "user", "content": "Hello" }
    ]
  }'`;

    const js = `const response = await fetch("${chatUrl}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "${SAMPLE_MODEL}",
    messages: [{ role: "user", content: "Hello" }],
  }),
});

const data = await response.json();
console.log(data);`;

    const py = `import requests

response = requests.post(
  "${chatUrl}",
  headers={
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  json={
    "model": "${SAMPLE_MODEL}",
    "messages": [{"role": "user", "content": "Hello"}],
  },
)

print(response.json())`;

    if (requestTab === "javascript") return js;
    if (requestTab === "python") return py;
    return curl;
  }, [chatUrl, requestTab]);

  const responseCode = `{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "model": "${SAMPLE_MODEL}",
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

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    showToast("Đã sao chép", "success");
  };

  return (
    <main className="space-y-6 pb-20" aria-busy="false">
      <TextFadeInUp as="section" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <BookOpenText className="h-3.5 w-3.5" /> Hướng dẫn API
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Tài liệu API</h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Bản rút gọn để triển khai nhanh: lấy API key, cấu hình Base URL, gọi endpoint chat completions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CosmicButton href="/api-keys">
              <Key className="h-4 w-4" /> Tạo API key
            </CosmicButton>
            <CosmicButton href="/plans" variant="secondary">Mua credits</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Thông tin cần thiết</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InfoRow label="Base URL" value={baseUrl} onCopy={() => void copyText(baseUrl)} />
          <InfoRow label="Authorization" value="Bearer YOUR_API_KEY" onCopy={() => void copyText("Bearer YOUR_API_KEY")} />
          <InfoRow label="Model mẫu" value={SAMPLE_MODEL} onCopy={() => void copyText(SAMPLE_MODEL)} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Endpoint</h2>
        <p className="mt-2 text-sm text-slate-600">POST endpoint chuẩn OpenAI-compatible:</p>
        <code className="mt-2 block break-all rounded-xl bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
          POST {chatUrl}
        </code>
        <code className="mt-2 block rounded-xl bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700">
          {chatPath}
        </code>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-950">Request mẫu</h2>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {["curl", "javascript", "python"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setRequestTab(tab as CodeTab)}
              className={cn(
                "h-10 rounded-xl px-4 text-sm font-semibold transition-all duration-200",
                requestTab === tab
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                  : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              )}
            >
              {tab === "curl" ? "CURL" : tab === "javascript" ? "JavaScript" : "Python"}
            </button>
          ))}
        </div>
        <CodeBlock title="REQUEST" code={requestCode} onCopy={() => void copyText(requestCode)} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-950">Response mẫu</h2>
        <CodeBlock title="RESPONSE" code={responseCode} onCopy={() => void copyText(responseCode)} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-950">Parameters chính</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Bắt buộc</th>
                <th className="px-4 py-3">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["model", "Có", "Model ID thuộc gói đã mua."],
                ["messages", "Có", "Danh sách hội thoại gồm role và content."],
                ["temperature", "Không", "Điều chỉnh độ sáng tạo phản hồi."],
              ].map(([name, required, desc]) => (
                <tr key={name} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">{name}</td>
                  <td className="px-4 py-3 text-slate-700">{required}</td>
                  <td className="px-4 py-3 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Lỗi thường gặp</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li><span className="font-semibold">401:</span> API key thiếu/sai hoặc đã bị thu hồi.</li>
          <li><span className="font-semibold">402:</span> Credits không đủ hoặc gói đã hết hạn.</li>
          <li><span className="font-semibold">403:</span> API key không có quyền dùng model này.</li>
          <li><span className="font-semibold">429:</span> Gửi quá nhiều request trong thời gian ngắn.</li>
        </ul>
      </section>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </main>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-800">{value}</code>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
          title="Sao chép"
          aria-label="Sao chép"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CodeBlock({ title, code, onCopy }: { title: string; code: string; onCopy: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{title}</p>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
        >
          Sao chép
        </button>
      </div>
      <pre className="max-h-[420px] overflow-auto p-4 text-sm leading-7 text-slate-100">{code}</pre>
    </div>
  );
}
