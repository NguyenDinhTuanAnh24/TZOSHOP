"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Package, Pencil, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";

type Product = {
  id: string;
  name: string;
  slug: string;
  apiFamily: string;
  credits: string;
  durationDays: number | null;
  priceVnd: number;
  apiKeyLimit: number;
  allowedModels: string[];
  isActive: boolean;
  isPopular: boolean;
  isContactOnly: boolean;
};

type AiModel = {
  id: string;
  publicName: string;
  apiFamily: string;
  isActive: boolean;
};

type FamilyFilter = "ALL" | "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";
type TierFilter = "ALL" | "TRIAL" | "MINI" | "PLUS" | "PRO" | "MAX" | "ULTRA" | "ENTERPRISE";
type SortFilter = "NEWEST" | "PRICE_LOW" | "PRICE_HIGH" | "CREDITS_HIGH" | "DURATION_HIGH";

const MAX_VISIBLE_MODELS = 3;

function familyClass(apiFamily: string) {
  if (apiFamily === "CODEXAI") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (apiFamily === "CLAUDE") return "border-orange-100 bg-orange-50 text-orange-700";
  if (apiFamily === "GEMINI") return "border-sky-100 bg-sky-50 text-sky-700";
  if (apiFamily === "DEEPSEEK") return "border-violet-100 bg-violet-50 text-violet-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function ProductSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <Skeleton className="h-5 w-36 rounded-full" />
        <Skeleton className="mt-4 h-10 w-64 rounded-xl" />
        <Skeleton className="mt-3 h-5 w-[660px] max-w-full rounded-full" />
      </section>
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="mt-5 h-4 w-24 rounded-full" />
            <Skeleton className="mt-3 h-8 w-20 rounded-xl" />
          </div>
        ))}
      </section>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState<FamilyFilter>("ALL");
  const [filterActive, setFilterActive] = useState<ActiveFilter>("ALL");
  const [filterTier, setFilterTier] = useState<TierFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortFilter>("NEWEST");
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    apiFamily: "CODEXAI",
    credits: "100000",
    durationDays: 0 as number | null,
    priceVnd: 50000,
    apiKeyLimit: 1,
    allowedModels: [] as string[],
    isActive: true,
    isPopular: false,
    isContactOnly: false,
  });
  const [modelSearch, setModelSearch] = useState("");
  const { toast, showToast, clearToast } = useToast(3000);
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const resProducts = await fetch("/api/admin/products", { cache: "no-store" });
      const dataProducts = await resProducts.json();
      if (!resProducts.ok || !dataProducts.success) throw new Error();
      setProducts(dataProducts.data || []);
      const allModels: AiModel[] = [];
      let page = 1;
      let hasNextPage = true;
      while (hasNextPage) {
        const resModels = await fetch(`/api/admin/models?page=${page}&pageSize=50`, { cache: "no-store" });
        const dataModels = await resModels.json();
        if (!resModels.ok || !dataModels.success) break;
        allModels.push(...((dataModels.data || []) as AiModel[]));
        hasNextPage = Boolean(dataModels.pagination?.hasNextPage);
        page += 1;
      }
      setModels(allModels.filter((m) => m.isActive));
    } catch {
      setLoadError("Vui lòng thử lại sau ít phút.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        slug: product.slug,
        apiFamily: product.apiFamily,
        credits: product.credits,
        durationDays: product.durationDays,
        priceVnd: product.priceVnd,
        apiKeyLimit: product.apiKeyLimit,
        allowedModels: product.allowedModels || [],
        isActive: product.isActive,
        isPopular: product.isPopular,
        isContactOnly: product.isContactOnly,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        slug: "",
        apiFamily: "CODEXAI",
        credits: "100000",
        durationDays: 0,
        priceVnd: 50000,
        apiKeyLimit: 1,
        allowedModels: [],
        isActive: true,
        isPopular: false,
        isContactOnly: false,
      });
    }
    setModelSearch("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (formData.allowedModels.length === 0) {
      showToast("Chưa chọn model", "warning");
      return;
    }

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(editingId ? "Đã lưu gói credits" : "Đã tạo gói credits", "success");
        setIsModalOpen(false);
        void fetchData();
      } else {
        showToast(result?.error?.message || result?.message || "Không thể lưu gói credits", "error");
      }
    } catch {
      showToast("Không thể lưu gói credits", "error");
    }
  };

  const handleToggleActive = (productId: string, currentStatus: boolean) => {
    const nextActive = !currentStatus;
    askConfirm({
      title: nextActive ? "Hiển thị gói credits?" : "Ẩn gói credits này?",
      description: nextActive
        ? "Gói này sẽ xuất hiện lại trong danh sách mua credits của người dùng."
        : "Gói này sẽ không còn hiển thị cho người dùng mua mới, nhưng các đơn hàng và gói đã mua trước đó vẫn được giữ nguyên.",
      confirmLabel: nextActive ? "Hiển thị" : "Ẩn gói",
      type: nextActive ? "primary" : "warning",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: nextActive }),
        });
        const result = await res.json();
        if (res.ok && result.success) {
          showToast(nextActive ? "Đã hiển thị gói credits" : "Đã ẩn gói credits", "success");
          void fetchData();
        } else {
          showToast("Không thể lưu gói credits", "error");
        }
      },
    });
  };

  const filteredProducts = useMemo(() => {
    const list = products
      .filter((p) => {
        const kw = search.trim().toLowerCase();
        if (!kw) return true;
        return (
          p.name.toLowerCase().includes(kw) ||
          p.slug.toLowerCase().includes(kw) ||
          (p.allowedModels || []).some((m) => m.toLowerCase().includes(kw))
        );
      })
      .filter((p) => (filterFamily === "ALL" ? true : p.apiFamily === filterFamily))
      .filter((p) => (filterActive === "ALL" ? true : filterActive === "ACTIVE" ? p.isActive : !p.isActive))
      .filter((p) => {
        if (filterTier === "ALL") return true;
        const tierName = p.name.toUpperCase();
        return tierName.includes(filterTier);
      });

    if (sortBy === "PRICE_LOW") return [...list].sort((a, b) => a.priceVnd - b.priceVnd);
    if (sortBy === "PRICE_HIGH") return [...list].sort((a, b) => b.priceVnd - a.priceVnd);
    if (sortBy === "CREDITS_HIGH") return [...list].sort((a, b) => Number(b.credits) - Number(a.credits));
    if (sortBy === "DURATION_HIGH") return [...list].sort((a, b) => (b.durationDays || 0) - (a.durationDays || 0));
    return list;
  }, [products, search, filterFamily, filterActive, filterTier, sortBy]);

  const availableModels = useMemo(
    () =>
      models
        .filter((m) => m.apiFamily === formData.apiFamily)
        .sort((a, b) => a.publicName.localeCompare(b.publicName)),
    [models, formData.apiFamily]
  );

  const filteredAvailableModels = useMemo(
    () => availableModels.filter((m) => m.publicName.toLowerCase().includes(modelSearch.toLowerCase())),
    [availableModels, modelSearch]
  );

  const toggleModel = (model: string) => {
    setFormData((prev) => {
      const exists = prev.allowedModels.includes(model);
      return {
        ...prev,
        allowedModels: exists
          ? prev.allowedModels.filter((item) => item !== model)
          : [...prev.allowedModels, model],
      };
    });
  };

  const handleFamilyChange = (nextFamily: string) => {
    const nextFamilyModelNames = models
      .filter((m) => m.apiFamily === nextFamily && m.isActive)
      .map((m) => m.publicName);
    setFormData((prev) => ({
      ...prev,
      apiFamily: nextFamily,
      allowedModels: prev.allowedModels.filter((model) => nextFamilyModelNames.includes(model)),
    }));
  };

  const selectAllModels = () => {
    setFormData((prev) => ({
      ...prev,
      allowedModels: availableModels.map((model) => model.publicName),
    }));
  };

  const clearAllModels = () => {
    setFormData((prev) => ({
      ...prev,
      allowedModels: [],
    }));
  };

  const summary = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const inactive = total - active;
    const families = new Set(products.map((p) => p.apiFamily)).size;
    return { total, active, inactive, families };
  }, [products]);

  if (isLoading && !products.length) return <ProductSkeleton />;

  if (loadError && !products.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải danh sách gói credits</h2>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <button type="button" onClick={() => void fetchData()} className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">Thử lại</button>
      </section>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-1">
      <TextFadeInUp as="section" className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Quản trị sản phẩm</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Gói credits</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Quản lý các gói credits, giá bán, thời hạn, giới hạn API key và danh sách model hỗ trợ.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <CosmicButton onClick={() => handleOpenModal()}><Plus className="h-4 w-4" />Thêm gói credits</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng gói credits", value: summary.total, desc: "Tất cả gói sản phẩm", cls: "bg-indigo-50 text-indigo-700" },
          { label: "Đang bán", value: summary.active, desc: "Gói hiển thị công khai", cls: "bg-emerald-50 text-emerald-700" },
          { label: "Đang ẩn", value: summary.inactive, desc: "Gói tạm thời ẩn", cls: "bg-slate-100 text-slate-700" },
          { label: "Dòng AI hỗ trợ", value: summary.families, desc: "Số dòng AI đang có", cls: "bg-violet-50 text-violet-700" },
        ].map((card, i) => (
          <TextFadeInUp key={card.label} delay={Math.min(i * 0.05, 0.25)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", card.cls)}><Package className="h-5 w-5" /></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950">{card.value.toLocaleString("vi-VN")}</p>
            <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên gói, slug hoặc model..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
          <select value={filterFamily} onChange={(e) => setFilterFamily(e.target.value as FamilyFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="ALL">Tất cả dòng AI</option><option value="CODEXAI">CodexAI</option><option value="CLAUDE">Claude</option><option value="GEMINI">Gemini</option><option value="DEEPSEEK">DeepSeek</option></select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as ActiveFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang bán</option><option value="INACTIVE">Đang ẩn</option></select>
          <div className="grid grid-cols-2 gap-3"><select value={filterTier} onChange={(e) => setFilterTier(e.target.value as TierFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="ALL">Tất cả cấp độ</option><option value="TRIAL">Trial</option><option value="MINI">Mini</option><option value="PLUS">Plus</option><option value="PRO">Pro</option><option value="MAX">Max</option><option value="ULTRA">Ultra</option><option value="ENTERPRISE">Enterprise</option></select><select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="NEWEST">Mới nhất</option><option value="PRICE_LOW">Giá thấp</option><option value="PRICE_HIGH">Giá cao</option><option value="CREDITS_HIGH">Credits nhiều</option><option value="DURATION_HIGH">Thời hạn dài</option></select></div>
        </div>
      </TextFadeInUp>

      {filteredProducts.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Package className="h-7 w-7" /></div>
          <h2 className="text-2xl font-extrabold text-slate-950">Chưa có gói credits</h2>
          <p className="mt-2 text-sm text-slate-600">Tạo gói credits đầu tiên để người dùng có thể mua và sử dụng AI qua TzoShop.</p>
          <div className="mt-6 flex justify-center"><CosmicButton onClick={() => handleOpenModal()}><Plus className="h-4 w-4" />Thêm gói credits</CosmicButton></div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((p, index) => {
            const isExpanded = expandedModels[p.id] || false;
            const visibleModels = isExpanded ? p.allowedModels : p.allowedModels.slice(0, MAX_VISIBLE_MODELS);
            const hiddenCount = Math.max(p.allowedModels.length - MAX_VISIBLE_MODELS, 0);
            return (
              <TextFadeInUp key={p.id} delay={Math.min(index * 0.04, 0.25)} as="article" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-extrabold text-slate-950">{p.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{p.slug}</p>
                  </div>
                  {p.isPopular ? <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Ưu tiên</span> : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", familyClass(p.apiFamily))}>{p.apiFamily}</span>
                  <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", p.isActive ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600")}>{p.isActive ? "Đang bán" : "Đang ẩn"}</span>
                </div>

                <p className="mt-5 text-3xl font-extrabold text-slate-950">{p.isContactOnly ? "Liên hệ" : formatVnd(p.priceVnd ?? 0)}</p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"><p className="text-xs text-slate-500">Credits</p><p className="mt-1 text-sm font-semibold text-slate-900">{Number(p.credits).toLocaleString("vi-VN")}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"><p className="text-xs text-slate-500">Thời hạn</p><p className="mt-1 text-sm font-semibold text-slate-900">{p.durationDays ? `${p.durationDays} ngày` : "Vĩnh viễn"}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"><p className="text-xs text-slate-500">API key limit</p><p className="mt-1 text-sm font-semibold text-slate-900">{p.apiKeyLimit}</p></div>
                </div>

                <button type="button" onClick={() => setExpandedModels((prev) => ({ ...prev, [p.id]: !prev[p.id] }))} className="mt-4 w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Models hỗ trợ</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {visibleModels.map((model) => (
                      <span key={model} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{model}</span>
                    ))}
                    {!isExpanded && hiddenCount > 0 ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">+{hiddenCount} model</span> : null}
                  </div>
                </button>

                <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                  <button type="button" onClick={() => handleOpenModal(p)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Pencil className="h-4 w-4" />Sửa</button>
                  <button type="button" onClick={() => handleToggleActive(p.id, p.isActive)} className={cn("inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition", p.isActive ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}>{p.isActive ? "Ẩn" : "Hiện"}</button>
                </div>
              </TextFadeInUp>
            );
          })}
        </section>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Cập nhật gói credits" : "Thêm gói credits"}
        description="Thiết lập tên gói, giá bán, credits, thời hạn, API key limit và models hỗ trợ."
        maxWidthClassName="max-w-6xl"
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy</button>
            <CosmicButton onClick={handleSave}>{editingId ? "Lưu gói credits" : "Thêm gói credits"}</CosmicButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tên gói</label>
              <input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</label>
              <input value={formData.slug} onChange={(e) => setFormData((f) => ({ ...f, slug: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Dòng AI</label>
              <select value={formData.apiFamily} onChange={(e) => handleFamilyChange(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"><option value="CODEXAI">CodexAI</option><option value="CLAUDE">Claude</option><option value="GEMINI">Gemini</option><option value="DEEPSEEK">DeepSeek</option></select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Credits</label><input type="number" min={0} value={formData.credits} onChange={(e) => setFormData((f) => ({ ...f, credits: e.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950" /></div>
                <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Thời hạn ngày</label><input type="number" min={0} value={formData.durationDays ?? ""} onChange={(e) => setFormData((f) => ({ ...f, durationDays: e.target.value === "" ? null : Number(e.target.value) }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950" /></div>
                <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Giá VND</label><input type="number" min={0} value={formData.priceVnd} onChange={(e) => setFormData((f) => ({ ...f, priceVnd: Number(e.target.value) }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950" disabled={formData.isContactOnly} /></div>
                <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">API key limit</label><input type="number" min={1} value={formData.apiKeyLimit} onChange={(e) => setFormData((f) => ({ ...f, apiKeyLimit: Number(e.target.value) }))} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950" /></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"><span>Đang bán</span><Switch checked={formData.isActive} onCheckedChange={(v) => setFormData((f) => ({ ...f, isActive: v }))} /></label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"><span>Ưu tiên</span><Switch checked={formData.isPopular} onCheckedChange={(v) => setFormData((f) => ({ ...f, isPopular: v }))} /></label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"><span>Liên hệ</span><Switch checked={formData.isContactOnly} onCheckedChange={(v) => setFormData((f) => ({ ...f, isContactOnly: v }))} /></label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-900">Models hỗ trợ ({formData.allowedModels.length})</p>
              <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Tìm model..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950" /></div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button type="button" onClick={selectAllModels} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                Chọn tất cả
              </button>
              <button type="button" onClick={clearAllModels} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                Bỏ chọn
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredAvailableModels.map((model) => {
                    const checked = formData.allowedModels.includes(model.publicName);
                    return (
                      <button
                        type="button"
                        key={model.publicName}
                        onClick={() => toggleModel(model.publicName)}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                          checked
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/60"
                        )}
                      >
                        <span className="min-w-0 truncate font-mono text-xs">{model.publicName}</span>
                        {checked ? <Check className="h-4 w-4 shrink-0" /> : null}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
      {confirmState ? (
        <ConfirmDialog
          open={Boolean(confirmState)}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      ) : null}
    </div>
  );
}
