"use client";

import { useState } from "react";
import { ChevronDown, Terminal, Code2 } from "lucide-react";
import { DocsCodeBlock } from "./code-block";

interface CodeExamplesProps {
  apiUrl: string;
}

export function DocsCodeExamples({ apiUrl }: CodeExamplesProps) {
  const [activeLang, setActiveLang] = useState("powershell");
  const [isResponseOpen, setIsResponseOpen] = useState(false);

  const examples = {
    powershell: {
      label: "PowerShell",
      lang: "powershell",
      code: `$headers = @{
  "Authorization" = "Bearer YOUR_TZOSHOP_API_KEY"
  "Content-Type" = "application/json"
}

$body = @{
  model = "codexai/gpt-5.3-codex"
  messages = @(
    @{
      role = "user"
      content = "Hello, TzoShop API"
    }
  )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod \`
  -Uri "${apiUrl}" \`
  -Method POST \`
  -Headers $headers \`
  -Body $body`
    },
    curl: {
      label: "CURL",
      lang: "bash",
      code: `curl -X POST "${apiUrl}" \\
  -H "Authorization: Bearer YOUR_TZOSHOP_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "codexai/gpt-5.3-codex",
    "messages": [
      {
        "role": "user",
        "content": "Hello, TzoShop API"
      }
    ]
  }'`
    },
    javascript: {
      label: "JavaScript",
      lang: "javascript",
      code: `const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_TZOSHOP_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "codexai/gpt-5.3-codex",
    messages: [
      {
        role: "user",
        content: "Hello, TzoShop API",
      },
    ],
  }),
});

const data = await response.json();
console.log(data);`
    },
    python: {
      label: "Python",
      lang: "python",
      code: `import requests

url = "${apiUrl}"

headers = {
    "Authorization": "Bearer YOUR_TZOSHOP_API_KEY",
    "Content-Type": "application/json",
}

payload = {
    "model": "codexai/gpt-5.3-codex",
    "messages": [
        {
            "role": "user",
            "content": "Hello, TzoShop API",
        }
    ],
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`
    }
  };

  const responseExample = `{
  "id": "chatcmpl-922",
  "object": "chat.completion",
  "created": 1715412345,
  "model": "codexai/gpt-5.3-codex",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Chào bạn! Tôi là TzoShop AI, rất vui được hỗ trợ bạn."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 20,
    "total_tokens": 35
  }
}`;

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div className="bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm inline-flex flex-wrap gap-1">
        {Object.entries(examples).map(([key, ex]) => (
          <button
            key={key}
            onClick={() => setActiveLang(key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeLang === key ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Code Block */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
             <Code2 className="h-4 w-4 text-emerald-600" /> {examples[activeLang as keyof typeof examples].label} Sample
           </h3>
        </div>
        <DocsCodeBlock 
          code={examples[activeLang as keyof typeof examples].code} 
          language={examples[activeLang as keyof typeof examples].lang} 
        />
      </div>

      {/* Response Accordion */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setIsResponseOpen(!isResponseOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="text-base font-black text-slate-900">Response mẫu</span>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isResponseOpen ? "rotate-180" : ""}`} />
        </button>
        
        {isResponseOpen && (
          <div className="p-6 pt-0 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <DocsCodeBlock code={responseExample} language="json" />
          </div>
        )}
      </div>
    </div>
  );
}
