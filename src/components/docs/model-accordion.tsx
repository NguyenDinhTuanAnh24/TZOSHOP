"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Search, ExternalLink, Loader2 } from "lucide-react";
import { DocsCopyButton } from "./copy-button";
import Link from "next/link";

interface ModelCategory {
  id: string;
  name: string;
  models: string[];
}

export function DocsModelAccordion() {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<ModelCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("/api/models");
        const json = await response.json();
        
        if (json.data) {
          const models = json.data;
          // Group models by family
          const grouped: Record<string, string[]> = {};
          models.forEach((m: Record<string, unknown>) => {
            const family = String(m.apiFamily);
            if (!grouped[family]) grouped[family] = [];
            grouped[family].push(String(m.publicName));
          });

          const catArray = Object.entries(grouped).map(([family, models]) => ({
            id: family.toLowerCase(),
            name: family.charAt(0).toUpperCase() + family.slice(1).toLowerCase(),
            models: models as string[]
          }));

          setCategories(catArray);
          if (catArray.length > 0) setOpenCategories([catArray[0].id]);
        }
      } catch (error) {
        console.error("Failed to fetch models for docs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, []);

  const toggleCategory = (id: string) => {
    setOpenCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    models: cat.models.filter(m => m.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.models.length > 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">Đang tải danh sách model...</p>
      </div>
    );
  }

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
            <p className="text-sm font-bold text-slate-500">Không tìm thấy model nào phù hợp hoặc hiện chưa có model nào khả dụng.</p>
          </div>
        )}
      </div>
    </div>
  );
}
