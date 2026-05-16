"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Loader2, Search } from "lucide-react";
import { DocsCopyButton } from "./copy-button";

interface ModelCategory {
  id: string;
  name: string;
  models: string[];
}

export function DocsModelAccordion() {
  const [search, setSearch] = useState("");
  const [openModelFamily, setOpenModelFamily] = useState("");
  const [categories, setCategories] = useState<ModelCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async (withLoading = true) => {
    try {
      if (withLoading) setIsLoading(true);
      setError(null);
      const response = await fetch("/api/models", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message ?? "Không thể tải model.");

      const models = (json.items ?? json.models ?? json.data ?? []) as Array<{ apiFamily: string; publicName: string }>;
      const grouped: Record<string, string[]> = {};
      models.forEach((m) => {
        const family = m.apiFamily;
        if (!grouped[family]) grouped[family] = [];
        grouped[family].push(m.publicName);
      });

      const orderedFamilies = ["CODEXAI", "CLAUDE", "GEMINI", "DEEPSEEK"];
      const catArray = orderedFamilies
        .filter((family) => grouped[family]?.length)
        .map((family) => ({
          id: family.toLowerCase(),
          name: family === "CODEXAI" ? "CodexAI" : family.charAt(0) + family.slice(1).toLowerCase(),
          models: grouped[family].sort((a, b) => a.localeCompare(b)),
        }));

      setCategories(catArray);
      setOpenModelFamily("");
    } catch {
      setError("Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu lỗi tiếp tục xảy ra.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchModels(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => ({
        ...cat,
        models: cat.models.filter((model) => model.toLowerCase().includes(search.toLowerCase())),
      }))
      .filter((cat) => cat.models.length > 0);
  }, [categories, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] py-16 shadow-[6px_6px_0px_0px_#000]" aria-hidden="true">
        <Loader2 className="mb-4 h-9 w-9 animate-spin text-black" />
        <p className="text-sm font-black uppercase text-black/70">Đang tải danh sách model...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-4 border-black bg-[#FF6B6B] p-6 text-black shadow-[8px_8px_0px_0px_#000]">
        <h3 className="text-xl font-black uppercase">Không thể tải tài liệu API</h3>
        <p className="mt-2 text-sm font-bold text-black/80">{error}</p>
        <button
          type="button"
          onClick={() => void fetchModels()}
          className="mt-4 h-11 border-4 border-black bg-white px-5 text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm model"
            className="h-11 w-full border-4 border-black bg-[#FFFDF5] pl-10 pr-3 text-sm font-bold text-black outline-none focus-visible:ring-2 focus-visible:ring-black"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-black/70">
          <span>Model bạn dùng được phụ thuộc vào gói credits đã mua.</span>
          <Link href="/my-plans" className="inline-flex items-center border-2 border-black bg-[#FFD93D] px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
            Xem gói của tôi <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCategories.map((cat) => {
          const isOpen = openModelFamily === cat.id;
          return (
            <section key={cat.id} className="overflow-hidden border-4 border-black bg-[#FFFDF5] shadow-[6px_6px_0px_0px_#000]">
              <button
                type="button"
                onClick={() => setOpenModelFamily((prev) => (prev === cat.id ? "" : cat.id))}
                className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-[#FFD93D]/25"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FFD93D] text-black shadow-[2px_2px_0px_0px_#000]">
                    {cat.name.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-xl font-black text-black">{cat.name}</p>
                  <span className="border-2 border-black bg-[#C7F0D8] px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                    {cat.models.length} models
                  </span>
                </div>
                <ChevronDown className={`h-5 w-5 text-black transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen ? (
                <div className="border-t-4 border-black bg-[#FFFDF5] p-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {cat.models.map((model) => (
                      <div key={model} className="flex items-center justify-between gap-3 border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]">
                        <div className="min-w-0">
                          <p className="break-all font-mono text-sm font-bold text-black">{model}</p>
                        </div>
                        <DocsCopyButton text={model} ariaLabel={`Sao chép model ${model}`} className="h-8 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}

        {filteredCategories.length === 0 ? (
          <div className="border-4 border-black bg-[#FFFDF5] p-10 text-center shadow-[6px_6px_0px_0px_#000]">
            <p className="text-sm font-bold text-black/70">Không tìm thấy model nào phù hợp hoặc hiện chưa có model nào khả dụng.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
