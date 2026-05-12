"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Package,
  Search,
  Plus,
  Power,
  PowerOff,
  Star,
  Clock,
  ChevronRight,
  Filter,
  Key,
  Pencil,
  ChevronLeft,
  LayoutGrid
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/format";
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
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
      const [resProducts, resModels] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/models")
      ]);
      const [dataProducts, dataModels] = await Promise.all([
        resProducts.json(),
        resModels.json()
      ]);
      
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
      const url = editingId 
        ? `/api/admin/products/${editingId}`
        : `/api/admin/products`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
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
          body: JSON.stringify({ isActive: isActivating })
        });
        const result = await res.json();
        if (result.success) {
          showToast(`Đã ${action.toLowerCase()} gói.`, "success");
          fetchData();
        } else {
          showToast("Có lỗi xảy ra.", "error");
        }
      }
    });
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
      const matchesFamily = filterFamily === "ALL" || p.apiFamily === filterFamily;
      const matchesActive = filterActive === "ALL" || (filterActive === "ACTIVE" ? p.isActive : !p.isActive);
      const matchesContact = filterContact === "ALL" || (filterContact === "CONTACT" ? p.isContactOnly : !p.isContactOnly);
      
      // Advanced Filters
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
        matchesSearch && matchesFamily && matchesActive && matchesContact &&
        matchesMinCredits && matchesMaxCredits && matchesMinPrice && matchesMaxPrice &&
        matchesMinApiKeys && matchesMaxApiKeys && matchesActiveOnly && matchesInactiveOnly &&
        matchesPriorityOnly && matchesCustomOnly && matchesTrialOnly && matchesEnterpriseOnly &&
        matchesFreeOnly
      );
    })
    .sort((a, b) => {
      switch (advancedFilters.sortBy) {
        case "price-asc": return a.priceVnd - b.priceVnd;
        case "price-desc": return b.priceVnd - a.priceVnd;
        case "credits-asc": return Number(a.credits) - Number(b.credits);
        case "credits-desc": return Number(b.credits) - Number(a.credits);
        case "api-keys-desc": return b.apiKeyLimit - a.apiKeyLimit;
        case "name-asc": return a.name.localeCompare(b.name);
        case "newest":
        default:
          return 0; // Default order from API
      }
    });

  const availableModels = models.filter(m => m.apiFamily === formData.apiFamily);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Quản lý Gói Credits" 
        description="Thiết kế và quản lý các gói nạp credits cho người dùng."
        icon={<Package className="h-8 w-8 text-[#00d4a4]" />}
        actions={
          <AppButton 
            onClick={() => handleOpenModal()}
            variant="primary"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo gói mới
          </AppButton>
        }
      />

      <AppCard className="p-4 bg-[#fbfbf8]/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a9690]" />
            <input
              type="text"
              placeholder="Tìm tên gói hoặc slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(ui.input, "pl-12 bg-white")}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterFamily}
              onChange={(e) => setFilterFamily(e.target.value)}
              className={cn(ui.input, "w-auto min-w-[140px] h-11 py-0 px-4")}
            >
              <option value="ALL">Tất cả dòng AI</option>
              <option value="CODEXAI">CodeX AI</option>
              <option value="CLAUDE">Claude</option>
              <option value="GEMINI">Gemini</option>
              <option value="DEEPSEEK">DeepSeek</option>
            </select>

            <select 
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className={cn(ui.input, "w-auto min-w-[140px] h-11 py-0 px-4")}
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ACTIVE">Đang bật</option>
              <option value="INACTIVE">Đang tắt</option>
            </select>

             <AppButton 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant={showAdvancedFilters || activeAdvancedFilterCount > 0 ? "primary" : "secondary"}
              size="sm"
              className={cn(
                "h-11 relative",
                showAdvancedFilters && "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50 text-emerald-950",
                !showAdvancedFilters && activeAdvancedFilterCount > 0 && "border-emerald-200 bg-emerald-50/50"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Lọc nâng cao
              {activeAdvancedFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#00d4a4] text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </AppButton>
          </div>
        </div>
      </AppCard>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <AppCard className="p-6 bg-white border-slate-200 shadow-xl rounded-[32px] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Bộ lọc nâng cao</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Thu hẹp danh sách theo giá, credits và trạng thái</p>
            </div>
            <button 
              onClick={resetAdvancedFilters}
              className="text-xs font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest hover:underline transition-all"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Credits Range */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khoảng Credits</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min"
                  value={advancedFilters.minCredits}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, minCredits: e.target.value})}
                  className={cn(ui.input, "h-11 text-xs font-bold")}
                />
                <span className="text-slate-300">—</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={advancedFilters.maxCredits}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, maxCredits: e.target.value})}
                  className={cn(ui.input, "h-11 text-xs font-bold")}
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khoảng Giá (VNĐ)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Từ"
                  value={advancedFilters.minPrice}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, minPrice: e.target.value})}
                  className={cn(ui.input, "h-11 text-xs font-bold")}
                />
                <span className="text-slate-300">—</span>
                <input 
                  type="number" 
                  placeholder="Đến"
                  value={advancedFilters.maxPrice}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, maxPrice: e.target.value})}
                  className={cn(ui.input, "h-11 text-xs font-bold")}
                />
              </div>
            </div>

            {/* API Keys Limit */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số lượng API Keys</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min Keys"
                  value={advancedFilters.minApiKeys}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, minApiKeys: e.target.value})}
                  className={cn(ui.input, "h-11 text-xs font-bold")}
                />
                <span className="text-slate-300">—</span>
                <input 
                  type="number" 
                  placeholder="Max Keys"
                  value={advancedFilters.maxApiKeys}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, maxApiKeys: e.target.value})}
                  className={cn(ui.input, "h-11 text-xs font-bold")}
                />
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sắp xếp theo</label>
              <select 
                value={advancedFilters.sortBy}
                onChange={(e) => setAdvancedFilters({...advancedFilters, sortBy: e.target.value})}
                className={cn(ui.input, "h-11 text-xs font-bold")}
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="credits-asc">Credits: Thấp đến Cao</option>
                <option value="credits-desc">Credits: Cao đến Thấp</option>
                <option value="api-keys-desc">Nhiều API Keys nhất</option>
                <option value="name-asc">Tên gói: A-Z</option>
              </select>
            </div>

            {/* Flags / Checkboxes */}
            <div className="md:col-span-2 xl:col-span-4 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
              <label className={cn(
                "flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all",
                advancedFilters.priorityOnly ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"
              )}>
                <input type="checkbox" checked={advancedFilters.priorityOnly} onChange={(e) => setAdvancedFilters({...advancedFilters, priorityOnly: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                <span className="text-xs font-bold text-slate-700">Ưu tiên</span>
              </label>

              <label className={cn(
                "flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all",
                advancedFilters.customOnly ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"
              )}>
                <input type="checkbox" checked={advancedFilters.customOnly} onChange={(e) => setAdvancedFilters({...advancedFilters, customOnly: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                <span className="text-xs font-bold text-slate-700">Liên hệ</span>
              </label>

              <label className={cn(
                "flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all",
                advancedFilters.trialOnly ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"
              )}>
                <input type="checkbox" checked={advancedFilters.trialOnly} onChange={(e) => setAdvancedFilters({...advancedFilters, trialOnly: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                <span className="text-xs font-bold text-slate-700">Gói Trial</span>
              </label>

              <label className={cn(
                "flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all",
                advancedFilters.enterpriseOnly ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"
              )}>
                <input type="checkbox" checked={advancedFilters.enterpriseOnly} onChange={(e) => setAdvancedFilters({...advancedFilters, enterpriseOnly: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                <span className="text-xs font-bold text-slate-700">Enterprise</span>
              </label>

              <label className={cn(
                "flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all",
                advancedFilters.freeOnly ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"
              )}>
                <input type="checkbox" checked={advancedFilters.freeOnly} onChange={(e) => setAdvancedFilters({...advancedFilters, freeOnly: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                <span className="text-xs font-bold text-slate-700">Gói Miễn phí</span>
              </label>

              <label className={cn(
                "flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all",
                advancedFilters.activeOnly ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"
              )}>
                <input type="checkbox" checked={advancedFilters.activeOnly} onChange={(e) => setAdvancedFilters({...advancedFilters, activeOnly: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                <span className="text-xs font-bold text-slate-700">Đang hoạt động</span>
              </label>

              <label className={cn(
                "flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all",
                advancedFilters.inactiveOnly ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200" : "bg-white border-slate-100 hover:border-slate-200"
              )}>
                <input type="checkbox" checked={advancedFilters.inactiveOnly} onChange={(e) => setAdvancedFilters({...advancedFilters, inactiveOnly: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20" />
                <span className="text-xs font-bold text-slate-700">Đang tạm ẩn</span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <AppButton 
              onClick={() => setShowAdvancedFilters(false)}
              variant="primary"
              className="h-12 px-10 rounded-full font-bold"
            >
              Áp dụng bộ lọc
            </AppButton>
          </div>
        </AppCard>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 rounded-[40px] bg-[#fbfbf8] animate-pulse border border-[#edf1ee]" />
          ))
        ) : paginatedProducts.length === 0 ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-[#fbfbf8] rounded-[40px] border border-dashed border-[#edf1ee]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 mb-4">
              <Package className="h-8 w-8 text-[#8a9690] opacity-40" />
            </div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight">Không tìm thấy gói phù hợp</h4>
            <p className={cn(ui.pMuted, "mt-1 italic")}>Thử thay đổi bộ lọc hoặc xoá lọc nâng cao để xem thêm kết quả.</p>
            {(activeAdvancedFilterCount > 0 || search !== "" || filterFamily !== "ALL" || filterActive !== "ALL" || filterContact !== "ALL") && (
              <AppButton 
                onClick={() => {
                  setSearch("");
                  setFilterFamily("ALL");
                  setFilterActive("ALL");
                  setFilterContact("ALL");
                  resetAdvancedFilters();
                }}
                variant="secondary"
                size="sm"
                className="mt-6 h-10 px-6"
              >
                Xóa tất cả bộ lọc
              </AppButton>
            )}
          </div>
        ) : (
          paginatedProducts.map((p) => (
            <AppCard key={p.id} className={cn(
              "group relative overflow-hidden p-8 transition-all hover:border-[#00d4a4]/30 hover:shadow-xl",
              !p.isActive && "opacity-60 bg-[#fbfbf8]"
            )}>
              {p.isPopular && (
                <div className="absolute top-6 right-6 flex items-center gap-1.5 rounded-full bg-[#ffb800]/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#ffb800] ring-1 ring-[#ffb800]/20">
                  <Star className="h-3 w-3 fill-[#ffb800]" />
                  Ưu tiên
                </div>
              )}

              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b0f0d] text-white shadow-lg transition-transform group-hover:scale-110">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0b0f0d] tracking-tight group-hover:text-[#00d4a4] transition-colors">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-[#8a9690] uppercase tracking-widest bg-[#fbfbf8] px-2 py-0.5 rounded-lg border border-[#edf1ee]">
                      {p.apiFamily}
                    </span>
                    {!p.isActive && (
                       <StatusBadge status="Tắt" variant="danger" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <span className={ui.label}>Credits</span>
                  <span className="text-xl font-black text-[#0b0f0d]">{Number(p.credits).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={ui.label}>Giá bán</span>
                  {p.isContactOnly ? (
                    <span className="text-sm font-black text-[#ffb800] uppercase">Liên hệ</span>
                  ) : (
                    <span className="text-xl font-black text-[#00d4a4]">{formatVnd(p.priceVnd)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-[#edf1ee] pt-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8a9690]">
                    <Clock className="h-3.5 w-3.5" />
                    {p.durationDays ? `${p.durationDays} ngày` : "Vĩnh viễn"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8a9690]">
                    <Key className="h-3.5 w-3.5" />
                    {p.apiKeyLimit} Keys
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AppButton
                  onClick={() => handleOpenModal(p)}
                  variant="secondary"
                  className="flex-1 h-10"
                >
                  <Pencil className="h-4 w-4 shrink-0 text-slate-700" />
                  <span>Sửa</span>
                </AppButton>
                <AppButton
                  onClick={() => handleToggleActive(p.id, p.isActive)}
                  variant="secondary"
                  className={cn(
                    "h-10 w-10 p-0 rounded-full shrink-0 flex items-center justify-center",
                    p.isActive ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700" : "text-[#00d4a4] hover:bg-[#e7fff7]"
                  )}
                >
                  {p.isActive ? <PowerOff className="h-5 w-5 shrink-0" /> : <Power className="h-5 w-5 shrink-0" />}
                </AppButton>
              </div>
            </AppCard>
          ))
        )}
      </div>

      {/* Pagination UI */}
      {!isLoading && filteredProducts.length > PAGE_SIZE && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
          <p className="text-sm font-bold text-slate-400">
            Hiển thị <span className="text-slate-900">{((currentPage - 1) * PAGE_SIZE) + 1}</span> - <span className="text-slate-900">{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}</span> trong tổng <span className="text-slate-900">{filteredProducts.length}</span> gói
          </p>

          <div className="flex items-center gap-2">
            <AppButton 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="secondary"
              className="h-10 px-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </AppButton>
            <div className="flex h-10 px-4 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-sm font-black text-slate-900">
              Trang {currentPage} / {totalPages}
            </div>
            <AppButton 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="secondary"
              className="h-10 px-4"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </AppButton>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={handleCloseModal}
        title={editingId ? "Cập nhật gói sản phẩm" : "Thêm gói sản phẩm mới"}
        maxWidthClassName="max-w-7xl"
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <AppButton
              onClick={handleCloseModal}
              variant="secondary"
              className="h-12 px-8 rounded-full"
            >
              Hủy
            </AppButton>
            <AppButton
              onClick={handleSave}
              variant="primary"
              isLoading={isLoading}
              className="h-12 px-10 rounded-full font-bold"
            >
              {editingId ? "Cập nhật ngay" : "Tạo gói sản phẩm"}
            </AppButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
          {/* Left Column: Basic Info & Status */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Thông tin cơ bản</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className={ui.label}>Tên gói sản phẩm</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="ví dụ: Starter Pack"
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Slug (Đường dẫn)</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                    placeholder="ví dụ: starter-pack"
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Dòng AI</label>
                  <select
                    value={formData.apiFamily}
                    onChange={e => setFormData({...formData, apiFamily: e.target.value, allowedModels: []})}
                    className={ui.input}
                  >
                    <option value="CODEXAI">CodeX AI</option>
                    <option value="CLAUDE">Claude</option>
                    <option value="GEMINI">Gemini</option>
                    <option value="DEEPSEEK">DeepSeek</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Tổng Credits</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.credits}
                    onChange={e => setFormData({...formData, credits: e.target.value})}
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Thời hạn (ngày)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.durationDays ?? ""}
                    onChange={e => setFormData({...formData, durationDays: e.target.value === "" ? null : Number(e.target.value)})}
                    placeholder="0 = vĩnh viễn"
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Giới hạn API Keys</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.apiKeyLimit}
                    onChange={e => setFormData({...formData, apiKeyLimit: Number(e.target.value)})}
                    className={ui.input}
                  />
                </div>
                <div className="space-y-2">
                  <label className={ui.label}>Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    required={!formData.isContactOnly}
                    disabled={formData.isContactOnly}
                    min="0"
                    value={formData.priceVnd}
                    onChange={e => setFormData({...formData, priceVnd: Number(e.target.value)})}
                    className={cn(ui.input, formData.isContactOnly && "opacity-50 bg-slate-100")}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Trạng thái & Hiển thị</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer",
                  formData.isActive ? "bg-white border-emerald-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60"
                )}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Kích hoạt</span>
                  <Switch 
                    checked={formData.isActive}
                    onCheckedChange={v => setFormData({...formData, isActive: v})}
                  />
                </label>
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer",
                  formData.isPopular ? "bg-white border-amber-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60"
                )}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ưu tiên</span>
                  <Switch 
                    checked={formData.isPopular}
                    onCheckedChange={v => setFormData({...formData, isPopular: v})}
                  />
                </label>
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer",
                  formData.isContactOnly ? "bg-white border-blue-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60"
                )}>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Liên hệ</span>
                  <Switch 
                    checked={formData.isContactOnly}
                    onCheckedChange={v => setFormData({...formData, isContactOnly: v})}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Models List */}
          <div className="flex flex-col h-full">
            <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50/40 p-6 flex flex-col min-h-[500px]">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">Models hỗ trợ ({formData.apiFamily})</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Đã chọn {formData.allowedModels.length} models</p>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Tìm model..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[400px]">
                {availableModels.filter(m => m.publicName.toLowerCase().includes(modelSearch.toLowerCase())).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <LayoutGrid className="h-12 w-12 mb-4" />
                    <p className="text-sm font-black italic">Không tìm thấy model nào phù hợp.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                    {availableModels
                      .filter(m => m.publicName.toLowerCase().includes(modelSearch.toLowerCase()))
                      .map(model => {
                        const isSelected = formData.allowedModels.includes(model.publicName);
                        return (
                          <label 
                            key={model.publicName} 
                            className={cn(
                              "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-all hover:shadow-sm active:scale-[0.98]",
                              isSelected 
                                ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-sm" 
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            )}
                          >
                            <input 
                              type="checkbox"
                              className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(f => ({ ...f, allowedModels: [...f.allowedModels, model.publicName] }));
                                } else {
                                  setFormData(f => ({ ...f, allowedModels: f.allowedModels.filter(m => m !== model.publicName) }));
                                }
                              }}
                            />
                            <span className="truncate" title={model.publicName}>
                              {model.publicName}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}

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
