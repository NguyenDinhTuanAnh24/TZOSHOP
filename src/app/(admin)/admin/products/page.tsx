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
import { AdminPagination } from "@/components/admin/admin-pagination";

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

type ModelOption = {
  id: string;
  publicName: string;
  apiFamily: string;
  isActive: boolean;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ProductSummary = {
  totalProducts: number;
  activeProducts: number;
  hiddenProducts: number;
  familyCount: number;
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
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState<FamilyFilter>("ALL");
  const [filterActive, setFilterActive] = useState<ActiveFilter>("ALL");
  const [filterTier, setFilterTier] = useState<TierFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortFilter>("NEWEST");
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<ProductSummary | null>(null);

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

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        family: filterFamily,
        status: filterActive,
        tier: filterTier,
        sort: sortBy,
      });

      const [productsRes, modelsRes] = await Promise.all([
        fetch(`/api/admin/products?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/admin/models/options", { cache: "no-store" }),
      ]);

      const [productsJson, modelsJson] = await Promise.all([productsRes.json(), modelsRes.json()]);

      if (!productsRes.ok || !productsJson.success) {
        throw new Error("LOAD_PRODUCTS_FAILED");
      }

      setProducts((productsJson.items ?? productsJson.products ?? productsJson.data ?? []) as Product[]);
      setPagination((productsJson.pagination ?? null) as Pagination | null);
      setSummary((productsJson.summary ?? null) as ProductSummary | null);

      if (modelsRes.ok) {
        setModelOptions((modelsJson.items ?? modelsJson.models ?? []) as ModelOption[]);
      }
    } catch {
      setLoadError("Không thể tải danh sách gói credits. Vui lòng thử lại sau ít phút.");
    } finally {
      setIsLoading(false);
    }
  }, [filterActive, filterFamily, filterTier, page, pageSize, search, sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const availableModels = useMemo(
    () =>
      modelOptions
        .filter((model) => model.apiFamily === formData.apiFamily && model.isActive)
        .sort((left, right) => left.publicName.localeCompare(right.publicName)),
    [formData.apiFamily, modelOptions]
  );

  const filteredAvailableModels = useMemo(() => {
    const keyword = modelSearch.trim().toLowerCase();
    if (!keyword) return availableModels;
    return availableModels.filter((model) => model.publicName.toLowerCase().includes(keyword));
  }, [availableModels, modelSearch]);

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
        allowedModels: Array.isArray(product.allowedModels) ? product.allowedModels : [],
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
      showToast("Chưa chọn model cho gói credits.", "warning");
      return;
    }

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message || result?.message || "SAVE_PRODUCT_FAILED");
      }

      showToast(editingId ? "Đã cập nhật gói credits." : "Đã tạo gói credits.", "success");
      setIsModalOpen(false);
      void fetchData();
    } catch {
      showToast("Không thể lưu gói credits.", "error");
    }
  };

  const handleToggleActive = (productId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    askConfirm({
      title: nextStatus ? "Hiển thị gói credits?" : "Ẩn gói credits?",
      description: nextStatus
        ? "Gói này sẽ hiển thị lại trên trang mua credits."
        : "Gói này sẽ bị ẩn với người dùng mới, nhưng dữ liệu đơn hàng cũ vẫn được giữ nguyên.",
      confirmLabel: nextStatus ? "Hiển thị" : "Ẩn gói",
      type: nextStatus ? "primary" : "warning",
      onConfirm: async () => {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: nextStatus }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          showToast(nextStatus ? "Đã hiển thị gói credits." : "Đã ẩn gói credits.", "success");
          void fetchData();
        } else {
          showToast("Không thể cập nhật trạng thái gói credits.", "error");
        }
      },
    });
  };

  const toggleModel = (modelName: string) => {
    setFormData((prev) => {
      const exists = prev.allowedModels.includes(modelName);
      return {
        ...prev,
        allowedModels: exists
          ? prev.allowedModels.filter((item) => item !== modelName)
          : [...prev.allowedModels, modelName],
      };
    });
  };

  const handleFamilyChange = (nextFamily: string) => {
    const nextFamilyModelNames = modelOptions
      .filter((model) => model.apiFamily === nextFamily && model.isActive)
      .map((model) => model.publicName);

    setFormData((prev) => ({
      ...prev,
      apiFamily: nextFamily,
      allowedModels: prev.allowedModels.filter((modelName) => nextFamilyModelNames.includes(modelName)),
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

  if (isLoading && !products.length) return <ProductSkeleton />;

  if (loadError && !products.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải danh sách gói credits</h2>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Thử lại
        </button>
      </section>
    );
  }

  const summaryCards = [
    {
      label: "Tổng gói credits",
      value: summary?.totalProducts ?? 0,
      desc: "Tất cả gói trong cơ sở dữ liệu",
      cls: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Đang bán",
      value: summary?.activeProducts ?? 0,
      desc: "Gói đang hiển thị công khai",
      cls: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Đang ẩn",
      value: summary?.hiddenProducts ?? 0,
      desc: "Gói tạm thời ẩn",
      cls: "bg-slate-100 text-slate-700",
    },
    {
      label: "Dòng AI hỗ trợ",
      value: summary?.familyCount ?? 0,
      desc: "Số dòng AI có gói credits",
      cls: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="space-y-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-1">
      <TextFadeInUp
        as="section"
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8"
      >
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
              Quản trị sản phẩm
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Gói credits</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Quản lý gói credits, giá bán, thời hạn, API key limit và danh sách model hỗ trợ.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <CosmicButton onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4" />
              Thêm gói credits
            </CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <TextFadeInUp
            key={card.label}
            delay={Math.min(index * 0.05, 0.25)}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200"
          >
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", card.cls)}>
              <Package className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950">{card.value.toLocaleString("vi-VN")}</p>
            <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên gói, slug hoặc model..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={filterFamily}
            onChange={(event) => {
              setFilterFamily(event.target.value as FamilyFilter);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
          >
            <option value="ALL">Tất cả dòng AI</option>
            <option value="CODEXAI">CodexAI</option>
            <option value="CLAUDE">Claude</option>
            <option value="GEMINI">Gemini</option>
            <option value="DEEPSEEK">DeepSeek</option>
          </select>
          <select
            value={filterActive}
            onChange={(event) => {
              setFilterActive(event.target.value as ActiveFilter);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="INACTIVE">Đang ẩn</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={filterTier}
              onChange={(event) => {
                setFilterTier(event.target.value as TierFilter);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
            >
              <option value="ALL">Tất cả cấp độ</option>
              <option value="TRIAL">Trial</option>
              <option value="MINI">Mini</option>
              <option value="PLUS">Plus</option>
              <option value="PRO">Pro</option>
              <option value="MAX">Max</option>
              <option value="ULTRA">Ultra</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortFilter);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
            >
              <option value="NEWEST">Mới nhất</option>
              <option value="PRICE_LOW">Giá thấp</option>
              <option value="PRICE_HIGH">Giá cao</option>
              <option value="CREDITS_HIGH">Credits nhiều</option>
              <option value="DURATION_HIGH">Thời hạn dài</option>
            </select>
          </div>
        </div>
      </TextFadeInUp>

      {products.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Package className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950">Chưa có gói credits</h2>
          <p className="mt-2 text-sm text-slate-600">
            Tạo gói credits đầu tiên để người dùng có thể mua và sử dụng AI qua TzoShop.
          </p>
          <div className="mt-6 flex justify-center">
            <CosmicButton onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4" />
              Thêm gói credits
            </CosmicButton>
          </div>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => {
              const isExpanded = expandedModels[product.id] || false;
              const models = Array.isArray(product.allowedModels) ? product.allowedModels : [];
              const visibleModels = isExpanded ? models : models.slice(0, MAX_VISIBLE_MODELS);
              const hiddenCount = Math.max(models.length - visibleModels.length, 0);

              return (
                <TextFadeInUp
                  key={product.id}
                  delay={Math.min(index * 0.04, 0.25)}
                  as="article"
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_18px_45px_-22px_rgba(79,70,229,0.30)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-extrabold text-slate-950">{product.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{product.slug}</p>
                    </div>
                    {product.isPopular ? (
                      <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Ưu tiên
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", familyClass(product.apiFamily))}>
                      {product.apiFamily}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        product.isActive
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      )}
                    >
                      {product.isActive ? "Đang bán" : "Đang ẩn"}
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-extrabold text-slate-950">
                    {product.isContactOnly ? "Liên hệ" : formatVnd(product.priceVnd ?? 0)}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <p className="text-xs text-slate-500">Credits</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {Number(product.credits).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <p className="text-xs text-slate-500">Thời hạn</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {product.durationDays ? `${product.durationDays} ngày` : "Vĩnh viễn"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <p className="text-xs text-slate-500">API key limit</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{product.apiKeyLimit}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedModels((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Models hỗ trợ</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {visibleModels.map((model) => (
                        <span key={model} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {model}
                        </span>
                      ))}
                      {!isExpanded && hiddenCount > 0 ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          +{hiddenCount} model
                        </span>
                      ) : null}
                    </div>
                  </button>

                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(product)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Pencil className="h-4 w-4" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(product.id, product.isActive)}
                      className={cn(
                        "inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
                        product.isActive
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      )}
                    >
                      {product.isActive ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </TextFadeInUp>
              );
            })}
          </section>

          {pagination ? (
            <AdminPagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Cập nhật gói credits" : "Thêm gói credits"}
        description="Thiết lập tên gói, giá bán, credits, thời hạn, API key limit và models hỗ trợ."
        maxWidthClassName="max-w-6xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <CosmicButton onClick={handleSave}>{editingId ? "Lưu gói credits" : "Thêm gói credits"}</CosmicButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tên gói</label>
              <input
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</label>
              <input
                value={formData.slug}
                onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Dòng AI</label>
              <select
                value={formData.apiFamily}
                onChange={(event) => handleFamilyChange(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
              >
                <option value="CODEXAI">CodexAI</option>
                <option value="CLAUDE">Claude</option>
                <option value="GEMINI">Gemini</option>
                <option value="DEEPSEEK">DeepSeek</option>
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Credits</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.credits}
                    onChange={(event) => setFormData((prev) => ({ ...prev, credits: event.target.value }))}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Thời hạn ngày</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.durationDays ?? ""}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        durationDays: event.target.value === "" ? null : Number(event.target.value),
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Giá VND</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.priceVnd}
                    onChange={(event) => setFormData((prev) => ({ ...prev, priceVnd: Number(event.target.value) }))}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
                    disabled={formData.isContactOnly}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">API key limit</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.apiKeyLimit}
                    onChange={(event) => setFormData((prev) => ({ ...prev, apiKeyLimit: Number(event.target.value) }))}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950"
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <span>Đang bán</span>
                  <Switch checked={formData.isActive} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <span>Ưu tiên</span>
                  <Switch checked={formData.isPopular} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, isPopular: value }))} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <span>Liên hệ</span>
                  <Switch checked={formData.isContactOnly} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, isContactOnly: value }))} />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-900">Models hỗ trợ ({formData.allowedModels.length})</p>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={modelSearch}
                  onChange={(event) => setModelSearch(event.target.value)}
                  placeholder="Tìm model..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950"
                />
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllModels}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={clearAllModels}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
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
                      key={model.id}
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
