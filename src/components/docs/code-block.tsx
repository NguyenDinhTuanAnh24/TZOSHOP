"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DocsCodeBlock({ code, language = "text", title }: { code: string; language?: string; title?: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      showToast("Đã copy", "success");
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      showToast("Không thể copy. Vui lòng thử lại.", "error");
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm mt-4">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            title="Copy code"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {isCopied ? "Đã copy" : "Copy"}
          </button>
        </div>
      )}
      <div className="relative group">
        {!title && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:text-white"
            title="Copy code"
          >
            {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
        <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
