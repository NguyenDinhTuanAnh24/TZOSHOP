"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IconButton } from "../ui/icon-button";
import { cn } from "@/lib/utils";

export function DocsCopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      showToast("Đã copy", "success");
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      showToast("Không thể copy. Vui lòng thử lại.", "error");
    }
  };

  return (
    <IconButton
      onClick={handleCopy}
      variant="ghost"
      size="sm"
      className={cn("text-slate-400 hover:text-emerald-600", className)}
      title="Copy"
    >
      {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </IconButton>
  );
}
