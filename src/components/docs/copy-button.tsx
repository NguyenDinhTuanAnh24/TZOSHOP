"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DocsCopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      showToast("Đã copy", "success");
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      showToast("Không thể copy. Vui lòng thử lại.", "error");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors ${className}`}
      title="Copy"
    >
      {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
