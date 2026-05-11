"use client";

import { useState } from "react";
import { ChevronDown, Search, Copy, ExternalLink } from "lucide-react";
import { DocsCopyButton } from "./copy-button";
import Link from "next/link";

interface ModelCategory {
  id: string;
  name: string;
  models: string[];
  count: number;
}

const MODEL_CATEGORIES: ModelCategory[] = [
  {
    id: "codexai",
    name: "CodexAI",
    count: 14,
    models: [
      "codexai/gpt-5.5", "codexai/gpt-5.5-pro", "codexai/gpt-5.4", "codexai/gpt-5.4-mini",
      "codexai/gpt-5.4-pro", "codexai/gpt-5.3-codex", "codexai/gpt-5.2", "codexai/gpt-5.2-pro",
      "codexai/gpt-5.1-codex", "codexai/gpt-5.1", "codexai/gpt-5-codex", "codexai/gpt-5",
      "codexai/gpt-5-pro", "codexai/gpt-5-mini"
    ]
  },
  {
    id: "claude",
    name: "Claude",
    count: 6,
    models: [
      "claude/claude-opus-4.7", "claude/claude-sonnet-4.6", "claude/claude-opus-4.6",
      "claude/claude-opus-4.5", "claude/claude-haiku-4.5", "claude/claude-sonnet-4.5"
    ]
  },
  {
    id: "gemini",
    name: "Gemini",
    count: 4,
    models: [
      "gemini/gemini-3.1-pro-preview", "gemini/gemini-3.1-flash-lite-preview",
      "gemini/gemini-3-flash-preview", "gemini/gemini-2.5-pro"
    ]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    count: 2,
    models: [
      "deepseek/deepseek-v4-flash", "deepseek/deepseek-v4-pro"
    ]
  }
];

export function DocsModelAccordion() {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<string[]>(["codexai"]);

  const toggleCategory = (id: string) => {
    setOpenCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = MODEL_CATEGORIES.map(cat => ({
    ...cat,
    models: cat.models.filter(m => m.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.models.length > 0);

  return (
    <div className="space-y-6">
      {/* Search & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-bold"
          />
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-slate-500">Model bạn dùng được phụ thuộc vào gói credits đã mua.</span>
           <Link href="/my-plans" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-100">
             Xem gói của tôi <ExternalLink className="h-3 w-3" />
           </Link>
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-3">
        {filteredCategories.map((cat) => {
          const isOpen = openCategories.includes(cat.id);
          return (
            <div key={cat.id} className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-slate-900">{cat.name}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 uppercase">{cat.models.length} models</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isOpen && (
                <div className="p-4 pt-0 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cat.models.map(model => (
                    <div key={model} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all group">
                      <div className="overflow-hidden mr-2">
                        <span className="text-sm font-bold text-slate-700 truncate block">{model}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{cat.name} Family</span>
                      </div>
                      <DocsCopyButton text={model} className="h-8 w-8 bg-white border border-slate-200 shadow-sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-500">Không tìm thấy model nào phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
}
