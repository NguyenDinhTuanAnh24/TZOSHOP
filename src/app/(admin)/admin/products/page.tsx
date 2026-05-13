"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Search,
  Plus,
  Power,
  PowerOff,
  Star,
  Filter,
  Pencil,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/format";
import { AiFamilyLogo, familyIconBoxClass } from "@/components/admin/ai-family-logo";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";

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

function familyStyle(apiFamily: string) {
  if (apiFamily === "CODEXAI") return "bg-[#C7F0D8]";
  if (apiFamily === "CLAUDE") return "bg-[#FFD93D]";
  if (apiFamily === "GEMINI") return "bg-[#A78BFA]";
  if (apiFamily === "DEEPSEEK") return "bg-[#FF6B6B]";
  return "bg-[#93C5FD]";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ALL");
  const [filterContact, setFilterContact] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
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
  }>({
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

  const [modelSearch, setModelSearch] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    minCredits: "",
    maxCredits: "",
    minPrice: "",
    maxPrice: "",
    minApiKeys: "",
    maxApiKeys: "",
    activeOnly: false,
    inactiveOnly: false,
    priorityOnly: false,
    customOnly: false,
    trialOnly: false,
    enterpriseOnly: false,
    freeOnly: false,
    sortBy: "newest",
  });

  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const activeAdvancedFilterCount = [
    advancedFilters.minCredits !== "",
    advancedFilters.maxCredits !== "",
    advancedFilters.minPrice !== "",
    advancedFilters.maxPrice !== "",
    advancedFilters.minApiKeys !== "",
    advancedFilters.maxApiKeys !== "",
    advancedFilters.activeOnly,
    advancedFilters.inactiveOnly,
    advancedFilters.priorityOnly,
    advancedFilters.customOnly,
    advancedFilters.trialOnly,
    advancedFilters.enterpriseOnly,
    advancedFilters.freeOnly,
    advancedFilters.sortBy !== "newest",
  ].filter(Boolean).length;

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      minCredits: "",
      maxCredits: "",
      minPrice: "",
      maxPrice: "",
      minApiKeys: "",
      maxApiKeys: "",
      activeOnly: false,
      inactiveOnly: false,
      priorityOnly: false,
      customOnly: false,
      trialOnly: false,
      enterpriseOnly: false,
      freeOnly: false,
      sortBy: "newest",
    });
    setCurrentPage(1);
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resProducts, resModels] = await Promise.all([fetch("/api/admin/products"), fetch("/api/admin/models")]);
      const [dataProducts, dataModels] = await Promise.all([resProducts.json(), resModels.json()]);

      if (dataProducts.success) setProducts(dataProducts.data);
      if (dataModels.success) setModels(dataModels.data.filter((m: AiModel) => m.isActive));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [search, filterFamily, filterActive, filterContact, advancedFilters]);

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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModelSearch("");
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/admin/products/${editingId}` : `/api/admin/products`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        showToast(editingId ? "Đã cập nhật." : "Đã tạo.", "success");
        handleCloseModal();
        fetchData();
      } else {
        showToast(result.error?.message || result.message || "Lỗi khi lưu.", "error");
      }
    } catch {
      showToast("Lỗi hệ thống.", "error");
    }
  };

  const handleToggleActive = (productId: string, currentStatus: boolean) => {
    const isActivating = !currentStatus;
    const action = isActivating ? "Bật" : "Tắt";

    askConfirm({
      title: `${action} gói sản phẩm?`,
      description: isActivating
        ? "Gói này sẽ xuất hiện lại trên bảng giá cho người dùng mua."
        : "Người dùng sẽ không thể mua gói này nữa.",
      confirmLabel: `Xác nhận ${action}`,
      cancelLabel: "Hủy",
      type: isActivating ? "warning" : "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: isActivating }),
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Đã ${action.toLowerCase()} gói.`, "success");
          fetchData();
        } else {
          showToast("Có lỗi xảy ra.", "error");
        }
      },
    });
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
      const matchesFamily = filterFamily === "ALL" || p.apiFamily === filterFamily;
      const matchesActive = filterActive === "ALL" || (filterActive === "ACTIVE" ? p.isActive : !p.isActive);
      const matchesContact = filterContact === "ALL" || (filterContact === "CONTACT" ? p.isContactOnly : !p.isContactOnly);

      const matchesMinCredits = advancedFilters.minCredits === "" || Number(p.credits) >= Number(advancedFilters.minCredits);
      const matchesMaxCredits = advancedFilters.maxCredits === "" || Number(p.credits) <= Number(advancedFilters.maxCredits);
      const matchesMinPrice = advancedFilters.minPrice === "" || p.priceVnd >= Number(advancedFilters.minPrice);
      const matchesMaxPrice = advancedFilters.maxPrice === "" || p.priceVnd <= Number(advancedFilters.maxPrice);
      const matchesMinApiKeys = advancedFilters.minApiKeys === "" || p.apiKeyLimit >= Number(advancedFilters.minApiKeys);
      const matchesMaxApiKeys = advancedFilters.maxApiKeys === "" || p.apiKeyLimit <= Number(advancedFilters.maxApiKeys);

      const matchesActiveOnly = !advancedFilters.activeOnly || p.isActive === true;
      const matchesInactiveOnly = !advancedFilters.inactiveOnly || p.isActive === false;
      const matchesPriorityOnly = !advancedFilters.priorityOnly || p.isPopular === true;
      const matchesCustomOnly = !advancedFilters.customOnly || p.isContactOnly === true;

      const matchesTrialOnly = !advancedFilters.trialOnly || p.name.toLowerCase().includes("trial");
      const matchesEnterpriseOnly = !advancedFilters.enterpriseOnly || p.name.toLowerCase().includes("enterprise");
      const matchesFreeOnly = !advancedFilters.freeOnly || p.priceVnd === 0;

      return (
        matchesSearch &&
        matchesFamily &&
        matchesActive &&
        matchesContact &&
        matchesMinCredits &&
        matchesMaxCredits &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinApiKeys &&
        matchesMaxApiKeys &&
        matchesActiveOnly &&
        matchesInactiveOnly &&
        matchesPriorityOnly &&
        matchesCustomOnly &&
        matchesTrialOnly &&
        matchesEnterpriseOnly &&
        matchesFreeOnly
      );
    })
    .sort((a, b) => {
      switch (advancedFilters.sortBy) {
        case "price-asc":
          return a.priceVnd - b.priceVnd;
        case "price-desc":
          return b.priceVnd - a.priceVnd;
        case "credits-asc":
          return Number(a.credits) - Number(b.credits);
        case "credits-desc":
          return Number(b.credits) - Number(a.credits);
        case "api-keys-desc":
          return b.apiKeyLimit - a.apiKeyLimit;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return 0;
      }
    });

  const availableModels = models.filter((m) => m.apiFamily === formData.apiFamily);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.length - activeCount;
  const familiesCount = new Set(products.map((p) => p.apiFamily)).size;

  const brutalInput =
    "h-12 w-full border-4 border-black bg-white px-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none";

  return (
    <div className="space-y-8 overflow-x-hidden">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <Package className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">PRODUCTS</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black md:text-4xl">QUẢN LÝ GÓI CREDITS</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Thiết kế và quản lý các gói nạp credits cho người dùng.</p>
          </div>
          <AppButton onClick={() => handleOpenModal()} variant="primary" size="sm" className="h-12 border-4 border-black bg-[#FF6B6B] px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_#000]">
            <Plus className="mr-2 h-4 w-4" />
            TẠO GÓI MỚI
          </AppButton>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "TỔNG GÓI", value: products.length, sub: "Credits packages", bg: "bg-[#DBEAFE]" },
          { label: "ĐANG BẬT", value: activeCount, sub: "Khả dụng", bg: "bg-[#C7F0D8]" },
          { label: "ĐANG TẮT", value: inactiveCount, sub: "Tạm ẩn", bg: "bg-[#FF6B6B]" },
          { label: "DÒNG AI", value: familiesCount, sub: "Đang bán", bg: "bg-[#FFD93D]" },
        ].map((card) => (
          <article key={card.label} className="min-h-[110px] border-4 border-black bg-[#FFFDF5] p-4 shadow-[5px_5px_0px_0px_#000]">
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_#000] ${card.bg}`}>
                <Package className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-black/60">{card.label}</p>
                <p className="mt-1 text-2xl font-black leading-none text-black">{card.value.toLocaleString("vi-VN")}</p>
                <p className="mt-1 text-sm font-bold text-black/60">{card.sub}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4 border-4 border-black bg-white p-4 shadow-[7px_7px_0px_0px_#000] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px_auto]">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
              <input type="text" placeholder="Tên gói hoặc slug..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${brutalInput} pl-10`} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Dòng AI</label>
            <select value={filterFamily} onChange={(e) => setFilterFamily(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả dòng AI</option>
              <option value="CODEXAI">CodeX AI</option>
              <option value="CLAUDE">Claude</option>
              <option value="GEMINI">Gemini</option>
              <option value="DEEPSEEK">DeepSeek</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Trạng thái</label>
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className={brutalInput}>
              <option value="ALL">Mọi trạng thái</option>
              <option value="ACTIVE">Đang bật</option>
              <option value="INACTIVE">Đang tắt</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Loại gói</label>
            <select value={filterContact} onChange={(e) => setFilterContact(e.target.value)} className={brutalInput}>
              <option value="ALL">Tất cả</option>
              <option value="NORMAL">Gói thường</option>
              <option value="CONTACT">Liên hệ</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Lọc nâng cao</label>
            <AppButton
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="secondary"
              size="sm"
              className={cn(
                "relative h-12 w-full border-4 border-black px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]",
                showAdvancedFilters || activeAdvancedFilterCount > 0 ? "bg-[#FFD93D]" : "bg-white",
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              LỌC
              {activeAdvancedFilterCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center border-2 border-black bg-[#FF6B6B] text-[10px] font-black text-black">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </AppButton>
          </div>
        </div>
      </section>

      {showAdvancedFilters && (
        <section className="space-y-6 border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black uppercase text-black">BỘ LỌC NÂNG CAO</h3>
            <AppButton onClick={resetAdvancedFilters} variant="secondary" size="sm" className="h-10 border-4 border-black bg-white px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
              XÓA BỘ LỌC
            </AppButton>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Credits min</label>
              <input type="number" value={advancedFilters.minCredits} onChange={(e) => setAdvancedFilters({ ...advancedFilters, minCredits: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Credits max</label>
              <input type="number" value={advancedFilters.maxCredits} onChange={(e) => setAdvancedFilters({ ...advancedFilters, maxCredits: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Giá min</label>
              <input type="number" value={advancedFilters.minPrice} onChange={(e) => setAdvancedFilters({ ...advancedFilters, minPrice: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Giá max</label>
              <input type="number" value={advancedFilters.maxPrice} onChange={(e) => setAdvancedFilters({ ...advancedFilters, maxPrice: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">API keys min</label>
              <input type="number" value={advancedFilters.minApiKeys} onChange={(e) => setAdvancedFilters({ ...advancedFilters, minApiKeys: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">API keys max</label>
              <input type="number" value={advancedFilters.maxApiKeys} onChange={(e) => setAdvancedFilters({ ...advancedFilters, maxApiKeys: e.target.value })} className={brutalInput} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Sắp xếp</label>
              <select value={advancedFilters.sortBy} onChange={(e) => setAdvancedFilters({ ...advancedFilters, sortBy: e.target.value })} className={brutalInput}>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="credits-asc">Credits thấp đến cao</option>
                <option value="credits-desc">Credits cao đến thấp</option>
                <option value="api-keys-desc">API keys nhiều nhất</option>
                <option value="name-asc">Tên gói A-Z</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            {[
              { k: "priorityOnly", label: "Ưu tiên" },
              { k: "customOnly", label: "Liên hệ" },
              { k: "trialOnly", label: "Gói trial" },
              { k: "enterpriseOnly", label: "Enterprise" },
              { k: "freeOnly", label: "Miễn phí" },
              { k: "activeOnly", label: "Đang bật" },
              { k: "inactiveOnly", label: "Đang tắt" },
            ].map((item) => {
              const checked = advancedFilters[item.k as keyof typeof advancedFilters] as boolean;
              return (
                <label key={item.k} className={cn("flex cursor-pointer items-center gap-2 border-2 border-black px-3 py-2 text-xs font-black uppercase", checked ? "bg-[#FFD93D]" : "bg-white")}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, [item.k]: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-h-[280px] border-4 border-black bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_0px_#000]">
              <div className="h-full w-full animate-pulse bg-[#E9E1D0]" />
            </div>
          ))
        ) : paginatedProducts.length === 0 ? (
          <div className="col-span-full flex min-h-[320px] flex-col items-center justify-center border-4 border-black bg-[#FFFDF5] p-8 text-center shadow-[8px_8px_0px_0px_#000]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000]">
              <Package className="h-7 w-7 text-black" />
            </div>
            <h4 className="text-xl font-black text-black">{products.length === 0 ? "CHƯA CÓ GÓI CREDITS NÀO" : "KHÔNG TÌM THẤY GÓI CREDITS"}</h4>
            <p className="mt-2 text-sm font-bold text-black/60">Thử đổi bộ lọc hoặc tạo gói credits mới.</p>
          </div>
        ) : (
          paginatedProducts.map((p) => (
            <article
              key={p.id}
              className={cn(
                "group relative flex min-h-[280px] flex-col overflow-visible border-4 border-black bg-[#FFFDF5] p-5 shadow-[7px_7px_0px_0px_#000] transition-all duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-[9px_9px_0px_0px_#000]",
                !p.isActive && "opacity-70",
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={cn("h-12 w-12 shrink-0", familyIconBoxClass(p.apiFamily))}>
                    <AiFamilyLogo family={p.apiFamily} className="h-7 w-7 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-xl font-black leading-tight text-black">{p.name}</h3>
                    <p className="mt-1 break-all text-xs font-bold text-black/60">{p.slug}</p>
                  </div>
                </div>
                {p.isPopular && (
                  <span className="inline-flex items-center gap-1 border-2 border-black bg-[#FF6B6B] px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                    <Star className="h-3 w-3" />
                    ƯU TIÊN
                  </span>
                )}
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className={cn("inline-flex border-2 border-black px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]", familyStyle(p.apiFamily))}>{p.apiFamily}</span>
                <span className={cn("inline-flex border-2 border-black px-2 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]", p.isActive ? "bg-[#C7F0D8]" : "bg-[#FF6B6B]")}>{p.isActive ? "ĐANG BẬT" : "ĐANG TẮT"}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000]">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Credits</p>
                  <p className="mt-1 text-2xl font-black text-black">{Number(p.credits).toLocaleString("vi-VN")}</p>
                </div>
                <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000]">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Giá bán</p>
                  <p className="mt-1 text-2xl font-black text-black">{p.isContactOnly ? "Liên hệ" : formatVnd(p.priceVnd)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm font-bold text-black">
                <div className="flex items-center justify-between gap-3 border-b-2 border-black/10 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Hiệu lực</span>
                  <span className="text-right font-black">{p.durationDays ? `${p.durationDays} ngày` : "Vĩnh viễn"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b-2 border-black/10 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-black/60">API keys</span>
                  <span className="text-right font-black">{p.apiKeyLimit} key</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b-2 border-black/10 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-black/60">Models</span>
                  <span className="text-right font-black">Hỗ trợ {p.allowedModels.length} model</span>
                </div>
              </div>
              <div className="mt-auto grid grid-cols-[1fr_auto] gap-3 pt-4">
                <AppButton onClick={() => handleOpenModal(p)} variant="secondary" className="h-11 border-4 border-black bg-white font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFD93D]">
                  <Pencil className="mr-2 h-4 w-4" />
                  SỬA
                </AppButton>
                <AppButton
                  onClick={() => handleToggleActive(p.id, p.isActive)}
                  variant="secondary"
                  className={cn(
                    "h-11 w-11 border-4 border-black p-0 font-black text-black shadow-[4px_4px_0px_0px_#000]",
                    p.isActive ? "bg-[#FF6B6B]" : "bg-[#C7F0D8]",
                  )}
                  title={p.isActive ? "Tắt gói" : "Bật gói"}
                >
                  {p.isActive ? <PowerOff className="h-5 w-5" /> : <Power className="h-5 w-5" />}
                </AppButton>
              </div>
            </article>
          ))
        )}
      </section>

      {!isLoading && filteredProducts.length > PAGE_SIZE && (
        <section className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-bold text-black/70">
            Hiển thị <span className="font-black text-black">{(currentPage - 1) * PAGE_SIZE + 1}</span> - <span className="font-black text-black">{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}</span> trong tổng <span className="font-black text-black">{filteredProducts.length}</span> gói
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <AppButton onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} variant="secondary" className="h-11 border-4 border-black bg-white px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">
              <ChevronLeft className="mr-1 h-4 w-4" />
              TRƯỚC
            </AppButton>
            <div className="flex h-11 items-center border-4 border-black bg-[#FFD93D] px-4 text-sm font-black text-black shadow-[4px_4px_0px_0px_#000]">Trang {currentPage}/{totalPages}</div>
            <AppButton onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} variant="secondary" className="h-11 border-4 border-black bg-white px-4 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">
              SAU
              <ChevronRight className="ml-1 h-4 w-4" />
            </AppButton>
          </div>
        </section>
      )}

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Cập nhật gói sản phẩm" : "Thêm gói sản phẩm mới"}
        maxWidthClassName="max-w-6xl"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <AppButton onClick={handleCloseModal} variant="secondary" className="h-12 border-4 border-black bg-white px-8 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
              HỦY
            </AppButton>
            <AppButton onClick={handleSave} variant="primary" isLoading={isLoading} className="h-12 border-4 border-black bg-[#FFD93D] px-10 font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
              {editingId ? "CẬP NHẬT" : "TẠO GÓI"}
            </AppButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <div className="space-y-4 border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-black/60">Thông tin cơ bản</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Tên gói sản phẩm</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ví dụ: Starter Pack" className={brutalInput} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Slug</label>
                  <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="starter-pack" className={brutalInput} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Dòng AI</label>
                  <select value={formData.apiFamily} onChange={(e) => setFormData({ ...formData, apiFamily: e.target.value, allowedModels: [] })} className={brutalInput}>
                    <option value="CODEXAI">CodeX AI</option>
                    <option value="CLAUDE">Claude</option>
                    <option value="GEMINI">Gemini</option>
                    <option value="DEEPSEEK">DeepSeek</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Tổng credits</label>
                  <input type="number" required min="0" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })} className={brutalInput} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Thời hạn (ngày)</label>
                  <input type="number" min="0" value={formData.durationDays ?? ""} onChange={(e) => setFormData({ ...formData, durationDays: e.target.value === "" ? null : Number(e.target.value) })} placeholder="0 = vĩnh viễn" className={brutalInput} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Giới hạn API keys</label>
                  <input type="number" required min="1" value={formData.apiKeyLimit} onChange={(e) => setFormData({ ...formData, apiKeyLimit: Number(e.target.value) })} className={brutalInput} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.14em] text-black/60">Giá bán (VNĐ)</label>
                  <input type="number" required={!formData.isContactOnly} disabled={formData.isContactOnly} min="0" value={formData.priceVnd} onChange={(e) => setFormData({ ...formData, priceVnd: Number(e.target.value) })} className={cn(brutalInput, formData.isContactOnly && "bg-[#E9E1D0]")} />
                </div>
              </div>
            </div>
            <div className="space-y-3 border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000]">
              <h4 className="text-xs font-black uppercase tracking-[0.16em] text-black/60">Trạng thái</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center justify-between border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase text-black">
                  <span>Kích hoạt</span>
                  <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} />
                </label>
                <label className="flex cursor-pointer items-center justify-between border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase text-black">
                  <span>Ưu tiên</span>
                  <Switch checked={formData.isPopular} onCheckedChange={(v) => setFormData({ ...formData, isPopular: v })} />
                </label>
                <label className="flex cursor-pointer items-center justify-between border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase text-black">
                  <span>Liên hệ</span>
                  <Switch checked={formData.isContactOnly} onCheckedChange={(v) => setFormData({ ...formData, isContactOnly: v })} />
                </label>
              </div>
            </div>
          </div>
          <div className="flex min-h-[520px] flex-col border-4 border-black bg-[#FFFDF5] p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-lg font-black text-black">Models hỗ trợ ({formData.apiFamily})</h4>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-black/60">Đã chọn {formData.allowedModels.length} model</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
                <input type="text" placeholder="Tìm model..." value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} className={`${brutalInput} pl-10`} />
              </div>
            </div>
            <div className="min-h-[390px] flex-1 overflow-y-auto border-2 border-black bg-white p-3">
              {availableModels.filter((m) => m.publicName.toLowerCase().includes(modelSearch.toLowerCase())).length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <LayoutGrid className="mb-3 h-10 w-10 text-black/60" />
                  <p className="text-sm font-black text-black/70">Không tìm thấy model phù hợp.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {availableModels
                    .filter((m) => m.publicName.toLowerCase().includes(modelSearch.toLowerCase()))
                    .map((model) => {
                      const isSelected = formData.allowedModels.includes(model.publicName);
                      return (
                        <label key={model.publicName} className={cn("flex cursor-pointer items-center gap-3 border-2 border-black px-3 py-2 text-sm font-bold text-black", isSelected ? "bg-[#FFD93D]" : "bg-[#FFFDF5]")}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((f) => ({ ...f, allowedModels: [...f.allowedModels, model.publicName] }));
                              } else {
                                setFormData((f) => ({ ...f, allowedModels: f.allowedModels.filter((m) => m !== model.publicName) }));
                              }
                            }}
                          />
                          <span className="break-all">{model.publicName}</span>
                        </label>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
      {confirmState && (
        <ConfirmDialog
          open={!!confirmState}
          title={confirmState.title}
          description={confirmState.description}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          type={confirmState.type}
          isLoading={isConfirming}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
