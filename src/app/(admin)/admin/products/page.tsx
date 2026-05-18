"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, Pencil, Plus, Search } from "lucide-react";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { Modal } from "@/components/ui/modal";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Switch } from "@/components/ui/switch";
import {
  ADMIN_AI_FAMILIES,
  ADMIN_PLAN_TYPES,
  buildPlanSuggestion,
  detectFamilyKeyFromSlug,
  detectPlanTypeFromSlug,
  getSelectableModels,
  NEWAPI_GROUP_BY_PREFIX,
  type AdminAiFamilyKey,
  type AdminPlanTypeKey,
} from "@/lib/admin-product-catalog";

type Product = {
  id: string;
  name: string;
  slug: string;
  apiFamily: string;
  tier?: string;
  credits: string;
  durationDays: number | null;
  priceVnd: number;
  apiKeyLimit: number;
  allowedModels: string[];
  isActive: boolean;
  isPopular: boolean;
  isContactOnly: boolean;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type FamilyFilter = "ALL" | "ALL_MODELS" | "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";
type PlanFilter = "ALL" | "TRIAL" | "MONTHLY" | "QUARTERLY" | "YEARLY";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortFilter = "NEWEST" | "PRICE_LOW" | "PRICE_HIGH" | "CREDITS_LOW" | "CREDITS_HIGH" | "DURATION_LOW" | "DURATION_HIGH";

function resolveFamilyLabelFromSlug(slug: string) {
  const key = detectFamilyKeyFromSlug(slug);
  return ADMIN_AI_FAMILIES.find((f) => f.key === key)?.label || "Unknown";
}

function resolvePlanLabelFromSlug(slug: string) {
  const planKey = detectPlanTypeFromSlug(slug);
  return ADMIN_PLAN_TYPES.find((p) => p.key === planKey)?.label || "Khác";
}

function getNewApiGroupFromSlug(slug: string) {
  return NEWAPI_GROUP_BY_PREFIX[detectFamilyKeyFromSlug(slug)];
}

export default function AdminProductsPage() {
  const { toast, showToast, clearToast } = useToast(3000);

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState<FamilyFilter>("ALL");
  const [filterPlan, setFilterPlan] = useState<PlanFilter>("ALL");
  const [filterActive, setFilterActive] = useState<ActiveFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortFilter>("NEWEST");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [familyKey, setFamilyKey] = useState<AdminAiFamilyKey>("deepseek");
  const [planType, setPlanType] = useState<AdminPlanTypeKey>("trial");
  const [modelSearch, setModelSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    apiFamily: "DEEPSEEK",
    tier: "TRIAL",
    credits: "5",
    durationDays: 7,
    priceVnd: 39000,
    apiKeyLimit: 1,
    allowedModels: [] as string[],
    isActive: true,
    isPopular: false,
    isContactOnly: false,
  });

  const selectableModels = useMemo(() => getSelectableModels(familyKey), [familyKey]);
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return selectableModels;
    return selectableModels.filter((m) => m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [modelSearch, selectableModels]);

  const applyPlanSuggestion = useCallback((nextFamilyKey: AdminAiFamilyKey, nextPlanType: AdminPlanTypeKey) => {
    const suggestion = buildPlanSuggestion(nextFamilyKey, nextPlanType);
    const apiFamily = ADMIN_AI_FAMILIES.find((f) => f.key === nextFamilyKey)?.apiFamily || "DEEPSEEK";
    const tier = nextPlanType.toUpperCase();
    setFormData((prev) => ({
      ...prev,
      name: suggestion.name,
      slug: suggestion.slug,
      durationDays: suggestion.durationDays,
      apiFamily,
      tier,
      allowedModels: prev.allowedModels.filter((m) => getSelectableModels(nextFamilyKey).some((model) => model.id === m)),
    }));
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        family: filterFamily,
        status: filterActive,
        tier: filterPlan,
        sort: sortBy,
      });
      const res = await fetch(`/api/admin/products?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || "LOAD_PRODUCTS_FAILED");
      setProducts(json.items || []);
      setPagination(json.pagination || null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể tải danh sách gói credits.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filterActive, filterFamily, filterPlan, page, pageSize, search, showToast, sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchProducts(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchProducts]);

  const openCreate = () => {
    setEditingId(null);
    setFamilyKey("deepseek");
    setPlanType("trial");
    const suggestion = buildPlanSuggestion("deepseek", "trial");
    setFormData({
      name: suggestion.name,
      slug: suggestion.slug,
      apiFamily: "DEEPSEEK",
      tier: "TRIAL",
      credits: "5",
      durationDays: suggestion.durationDays,
      priceVnd: 39000,
      apiKeyLimit: 1,
      allowedModels: ["deepseek/deepseek-v4-flash", "deepseek/deepseek-v4-pro"],
      isActive: true,
      isPopular: false,
      isContactOnly: false,
    });
    setModelSearch("");
    setIsModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    const detectedFamilyKey = detectFamilyKeyFromSlug(product.slug);
    const detectedPlanType = detectPlanTypeFromSlug(product.slug);
    setFamilyKey(detectedFamilyKey);
    setPlanType(detectedPlanType);
    setFormData({
      name: product.name,
      slug: product.slug,
      apiFamily: product.apiFamily,
      tier: product.tier || detectedPlanType.toUpperCase(),
      credits: product.credits,
      durationDays: product.durationDays || 7,
      priceVnd: product.priceVnd,
      apiKeyLimit: product.apiKeyLimit,
      allowedModels: product.allowedModels || [],
      isActive: product.isActive,
      isPopular: product.isPopular,
      isContactOnly: product.isContactOnly,
    });
    setModelSearch("");
    setIsModalOpen(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Tên gói là bắt buộc.";
    if (!formData.slug.trim()) return "Slug là bắt buộc.";
    if (Number(formData.credits) <= 0) return "Credits phải lớn hơn 0.";
    if (!formData.durationDays || Number(formData.durationDays) <= 0) return "Thời hạn ngày phải lớn hơn 0.";
    if (!formData.isContactOnly && Number(formData.priceVnd) < 0) return "Giá bán không hợp lệ.";
    if (Number(formData.apiKeyLimit) < 1) return "Giới hạn API key phải từ 1 trở lên.";
    if (!Array.isArray(formData.allowedModels) || formData.allowedModels.length === 0) return "Vui lòng chọn ít nhất một model hỗ trợ.";
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      showToast(error, "warning");
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
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || "SAVE_FAILED");
      showToast(editingId ? "Đã cập nhật gói credits." : "Đã tạo gói credits.", "success");
      setIsModalOpen(false);
      await fetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể lưu gói credits.", "error");
    }
  };

  const toggleSale = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || "TOGGLE_FAILED");
      showToast(!product.isActive ? "Đã bật bán gói." : "Đã tắt bán gói.", "success");
      await fetchProducts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể đổi trạng thái gói.", "error");
    }
  };

  const toggleModel = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedModels: prev.allowedModels.includes(id)
        ? prev.allowedModels.filter((m) => m !== id)
        : [...prev.allowedModels, id],
    }));
  };

  const selectAllModels = () => {
    setFormData((prev) => ({ ...prev, allowedModels: selectableModels.map((m) => m.id) }));
  };

  const clearModels = () => {
    setFormData((prev) => ({ ...prev, allowedModels: [] }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950">Quản lý gói credits</h1>
            <p className="mt-2 text-sm text-slate-600">Tạo, sửa, bật/tắt các gói bán trên shop.</p>
          </div>
          <CosmicButton onClick={openCreate}><Plus className="h-4 w-4" />Tạo gói</CosmicButton>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm theo tên/slug/model" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm" />
          </div>
          <select value={filterFamily} onChange={(e) => { setFilterFamily(e.target.value as FamilyFilter); setPage(1); }} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="ALL">Tất cả dòng AI</option>
            <option value="ALL_MODELS">All Models</option>
            <option value="CODEXAI">CodexAI</option>
            <option value="CLAUDE">Claude</option>
            <option value="GEMINI">Gemini</option>
            <option value="DEEPSEEK">DeepSeek</option>
          </select>
          <select value={filterPlan} onChange={(e) => { setFilterPlan(e.target.value as PlanFilter); setPage(1); }} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="ALL">Tất cả loại gói</option>
            <option value="TRIAL">Trial 7 ngày</option>
            <option value="MONTHLY">1 tháng</option>
            <option value="QUARTERLY">3 tháng</option>
            <option value="YEARLY">1 năm</option>
          </select>
          <select value={filterActive} onChange={(e) => { setFilterActive(e.target.value as ActiveFilter); setPage(1); }} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="INACTIVE">Đã tắt</option>
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as SortFilter); setPage(1); }} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
            <option value="NEWEST">Mới nhất</option>
            <option value="PRICE_LOW">Giá thấp</option>
            <option value="PRICE_HIGH">Giá cao</option>
            <option value="CREDITS_LOW">Credits thấp</option>
            <option value="CREDITS_HIGH">Credits cao</option>
            <option value="DURATION_LOW">Thời hạn ngắn</option>
            <option value="DURATION_HIGH">Thời hạn dài</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Tên gói</th><th className="px-4 py-3 text-left">Slug</th><th className="px-4 py-3 text-left">Dòng AI</th><th className="px-4 py-3 text-left">Loại gói</th><th className="px-4 py-3 text-right">Credits</th><th className="px-4 py-3 text-right">Thời hạn</th><th className="px-4 py-3 text-right">Giá VND</th><th className="px-4 py-3 text-right">API key</th><th className="px-4 py-3 text-right">Model</th><th className="px-4 py-3 text-left">Trạng thái</th><th className="px-4 py-3 text-left">Nổi bật</th><th className="px-4 py-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.slug}</td>
                <td className="px-4 py-3">{resolveFamilyLabelFromSlug(p.slug)}</td>
                <td className="px-4 py-3">{resolvePlanLabelFromSlug(p.slug)}</td>
                <td className="px-4 py-3 text-right">{Number(p.credits).toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 text-right">{p.durationDays} ngày</td>
                <td className="px-4 py-3 text-right">{p.isContactOnly ? "Liên hệ" : formatVnd(p.priceVnd)}</td>
                <td className="px-4 py-3 text-right">{p.apiKeyLimit}</td>
                <td className="px-4 py-3 text-right">{p.allowedModels.length}</td>
                <td className="px-4 py-3">{p.isActive ? "Đang bán" : "Đã tắt"}</td>
                <td className="px-4 py-3">{p.isPopular ? "Phổ biến" : "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => toggleSale(p)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">{p.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                    <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Xem</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {pagination ? (
        <AdminPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(next) => { setPageSize(next); setPage(1); }}
        />
      ) : null}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Sửa gói credits" : "Tạo gói credits"}
        description="Gói này sẽ tự liên kết đến nhóm NewAPI tương ứng khi khách tạo API key."
        maxWidthClassName="max-w-6xl"
        footer={<><button type="button" onClick={() => setIsModalOpen(false)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm">Hủy</button><CosmicButton onClick={handleSave}>{editingId ? "Lưu" : "Tạo gói"}</CosmicButton></>}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">Dòng AI</label>
              <select value={familyKey} onChange={(e) => { const v = e.target.value as AdminAiFamilyKey; setFamilyKey(v); applyPlanSuggestion(v, planType); }} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                {ADMIN_AI_FAMILIES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <label className="mb-2 mt-4 block text-xs font-semibold uppercase text-slate-500">Loại gói</label>
              <select value={planType} onChange={(e) => { const v = e.target.value as AdminPlanTypeKey; setPlanType(v); applyPlanSuggestion(familyKey, v); }} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                {ADMIN_PLAN_TYPES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">NewAPI group sẽ dùng: <span className="font-semibold">{getNewApiGroupFromSlug(formData.slug)}</span></p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Tên gói</label><input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Slug</label><input value={formData.slug} onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Credits</label><input type="number" min={1} value={formData.credits} onChange={(e) => setFormData((p) => ({ ...p, credits: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Thời hạn ngày</label><input type="number" min={1} value={formData.durationDays} onChange={(e) => setFormData((p) => ({ ...p, durationDays: Number(e.target.value) }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Giá VND</label><input type="number" min={0} value={formData.priceVnd} onChange={(e) => setFormData((p) => ({ ...p, priceVnd: Number(e.target.value) }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Giới hạn API key</label><input type="number" min={1} value={formData.apiKeyLimit} onChange={(e) => setFormData((p) => ({ ...p, apiKeyLimit: Number(e.target.value) }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><span>Đang bán</span><Switch checked={formData.isActive} onCheckedChange={(v) => setFormData((p) => ({ ...p, isActive: v }))} /></label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><span>Nổi bật</span><Switch checked={formData.isPopular} onCheckedChange={(v) => setFormData((p) => ({ ...p, isPopular: v }))} /></label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><span>Liên hệ</span><Switch checked={formData.isContactOnly} onCheckedChange={(v) => setFormData((p) => ({ ...p, isContactOnly: v }))} /></label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Models hỗ trợ ({formData.allowedModels.length})</p>
              <div className="flex gap-2">
                <button type="button" onClick={selectAllModels} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">{familyKey === "all_models" ? "Chọn tất cả model" : "Chọn tất cả model của dòng này"}</button>
                <button type="button" onClick={clearModels} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Bỏ chọn</button>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Tìm model" className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm" />
            </div>
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredModels.map((m) => {
                  const checked = formData.allowedModels.includes(m.id);
                  return (
                    <button key={m.id} type="button" onClick={() => toggleModel(m.id)} className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm", checked ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-700") }>
                      <span className="min-w-0 truncate">{m.label}</span>
                      {checked ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">UI hiển thị tên đẹp, hệ thống lưu model id thật vào <span className="font-mono">allowedModels</span>.</p>
          </div>
        </div>
      </Modal>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
      {isLoading ? <p className="text-sm text-slate-500">Đang tải...</p> : null}
    </div>
  );
}

