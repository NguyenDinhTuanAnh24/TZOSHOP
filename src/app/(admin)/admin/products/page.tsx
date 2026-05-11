"use client";

import { useEffect, useState } from "react";
import { 
  Package,
  Search,
  Plus,
  Edit,
  Power,
  PowerOff,
  Star,
  PhoneCall,
  Clock,
  ShieldCheck,
  ChevronRight,
  MoreHorizontal,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  Zap,
  MoreVertical,
  Layers,
  Key
} from "lucide-react";
import { AppIcon } from "@/components/ui/icon";
import { formatVnd } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { useConfirm } from "@/hooks/use-confirm";
import { ConfirmDialog } from "@/components/ui/confirm-toast";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  slug: string;
  apiFamily: string;
  credits: string;
  durationDays: number;
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
  const ITEMS_PER_PAGE = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    apiFamily: "CODEXAI",
    credits: "100000",
    durationDays: 30,
    priceVnd: 50000,
    apiKeyLimit: 1,
    allowedModels: [] as string[],
    isActive: true,
    isPopular: false,
    isContactOnly: false,
  });

  const { toast, showToast, clearToast } = useToast();
  const { confirmState, isConfirming, askConfirm, closeConfirm, handleConfirm } = useConfirm();

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        durationDays: 30,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setIsModalOpen(false);
        fetchData();
      } else {
        showToast(result.error?.message || result.message || "Lỗi khi lưu.", "error");
      }
    } catch (error) {
      showToast("Lỗi hệ thống.", "error");
    }
  };

  const handleToggleActive = (product: Product) => {
    const isActivating = !product.isActive;
    const action = isActivating ? "Bật" : "Tắt";
    
    askConfirm({
      title: `${action} gói ${product.name}?`,
      description: isActivating 
        ? "Gói này sẽ xuất hiện lại trên bảng giá cho người dùng mua."
        : "Người dùng sẽ không thể mua gói này nữa. Các gói đã mua vẫn tiếp tục sử dụng đến khi hết hạn.",
      confirmLabel: `Xác nhận ${action}`,
      cancelLabel: "Hủy",
      type: isActivating ? "warning" : "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/products/${product.id}`, {
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFamily = filterFamily === "ALL" || p.apiFamily === filterFamily;
    const matchesActive = filterActive === "ALL" || (filterActive === "ACTIVE" ? p.isActive : !p.isActive);
    const matchesContact = filterContact === "ALL" || (filterContact === "CONTACT" ? p.isContactOnly : !p.isContactOnly);
    
    return matchesSearch && matchesFamily && matchesActive && matchesContact;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const families = Array.from(new Set(products.map(p => p.apiFamily)));
  const availableModels = models.filter(m => m.apiFamily === formData.apiFamily);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-900 text-white shadow-xl shadow-slate-200 ring-4 ring-slate-50">
              <Package className="h-8 w-8" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gói credits</h1>
              <p className="text-slate-500 font-bold mt-1">Quản lý các gói credits hiển thị trên bảng giá và dashboard mua gói.</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right mr-4 hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang hoạt động</p>
              <p className="text-xl font-black text-emerald-600">
                {products.filter(p => p.isActive).length} / {products.length}
              </p>
           </div>
           <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-black text-white hover:bg-black transition-all shadow-lg shadow-slate-200"
           >
              <Plus className="h-4 w-4" />
              Tạo gói mới
           </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tên gói..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterFamily}
              onChange={(e) => { setFilterFamily(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả Family</option>
              {families.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <select 
              value={filterActive}
              onChange={(e) => { setFilterActive(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngưng bán</option>
            </select>

            <select 
              value={filterContact}
              onChange={(e) => { setFilterContact(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả loại gói</option>
              <option value="STANDARD">Gói chuẩn</option>
              <option value="CONTACT">Gói liên hệ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[40px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Gói</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Family</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Credits</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Thời hạn</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">API Keys</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Giá</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Models</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Loại gói</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={10} className="py-24 text-center">
                   <div className="flex flex-col items-center gap-4">
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                    <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải dữ liệu...</p>
                  </div>
                </td></tr>
              ) : paginatedProducts.length === 0 ? (
                <tr><td colSpan={10} className="py-24 text-center text-slate-400 font-bold italic">Chưa có gói credits phù hợp.</td></tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className={`group transition-colors ${!product.isActive ? "bg-slate-50/50 grayscale opacity-75" : "hover:bg-slate-50/30"}`}>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-emerald-600 transition-all shadow-sm ring-1 ring-slate-200">
                             <Package className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{product.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{product.slug}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 tracking-widest uppercase ring-1 ring-inset ring-slate-200">
                          {product.apiFamily}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-indigo-600 whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(Number(product.credits))} <span className="text-[10px] text-slate-400">CR</span></p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-slate-900">{product.durationDays} ngày</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-sm font-black text-slate-700">{product.apiKeyLimit}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       {product.isContactOnly || !product.priceVnd ? (
                          <span className="flex items-center gap-1.5 text-sm font-black text-amber-600">
                             <PhoneCall className="h-3.5 w-3.5" />
                             Liên hệ
                          </span>
                       ) : (
                          <p className="text-sm font-black text-emerald-600 whitespace-nowrap">{formatVnd(product.priceVnd)}</p>
                       )}
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex -space-x-2">
                          {product.allowedModels.slice(0, 3).map((m, i) => (
                             <div key={i} className="h-7 w-7 rounded-full bg-white ring-2 ring-slate-50 flex items-center justify-center text-[8px] font-black text-slate-500 border border-slate-200" title={m}>
                                {m[0]}
                             </div>
                          ))}
                          {product.allowedModels.length > 3 && (
                             <div className="h-7 w-7 rounded-full bg-slate-100 ring-2 ring-slate-50 flex items-center justify-center text-[8px] font-black text-slate-500 border border-slate-200">
                                +{product.allowedModels.length - 3}
                             </div>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          <Switch 
                            checked={product.isActive}
                            onCheckedChange={() => handleToggleActive(product)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="flex flex-col items-center gap-1">
                          {product.isPopular && (
                             <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[8px] font-black uppercase text-amber-600 ring-1 ring-amber-500/10">
                                <Star className="h-2.5 w-2.5 fill-amber-500" /> Phổ biến
                             </span>
                          )}
                          {product.isContactOnly && (
                             <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[8px] font-black uppercase text-indigo-600 ring-1 ring-indigo-500/10">
                                <PhoneCall className="h-2.5 w-2.5" /> Enterprise
                             </span>
                          )}
                          {!product.isPopular && !product.isContactOnly && (
                             <span className="text-[10px] font-bold text-slate-400">Tiêu chuẩn</span>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <Link 
                             href="/plans" 
                             className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all"
                             title="Xem trên bảng giá"
                          >
                             <Eye className="h-4 w-4" />
                          </Link>
                          <button 
                             onClick={() => handleOpenModal(product)}
                             className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200 transition-all"
                             title="Chỉnh sửa"
                          >
                             <Edit className="h-4 w-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-4">
            <div className="text-sm font-bold text-slate-500">
              Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} đến {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} trong {filteredProducts.length} gói
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all"
              >
                Trước
              </button>
              <div className="px-4 text-sm font-black text-slate-900">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Redesign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[40px] bg-white p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
            <div className="flex items-center gap-4 mb-8">
               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Package className="h-6 w-6" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingId ? "Cập nhật gói Credits" : "Tạo gói Credits mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tên gói hiển thị</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ví dụ: Starter Pack"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Slug (Đường dẫn)</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value})}
                    placeholder="ví dụ: starter-pack"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dòng AI (API Family)</label>
                  <select
                    value={formData.apiFamily}
                    onChange={e => setFormData({...formData, apiFamily: e.target.value, allowedModels: []})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="CODEXAI">CodeX AI</option>
                    <option value="CLAUDE">Claude</option>
                    <option value="GEMINI">Gemini</option>
                    <option value="DEEPSEEK">DeepSeek</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tổng Credits cấp</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.credits}
                    onChange={e => setFormData({...formData, credits: e.target.value})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Hạn dùng (ngày)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.durationDays}
                    onChange={e => setFormData({...formData, durationDays: Number(e.target.value)})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Giới hạn API Keys</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.apiKeyLimit}
                    onChange={e => setFormData({...formData, apiKeyLimit: Number(e.target.value)})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    required={!formData.isContactOnly}
                    disabled={formData.isContactOnly}
                    min="0"
                    value={formData.priceVnd}
                    onChange={e => setFormData({...formData, priceVnd: Number(e.target.value)})}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Models hỗ trợ ({formData.apiFamily})</label>
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 max-h-60 overflow-y-auto custom-scrollbar">
                  {availableModels.length === 0 ? (
                    <div className="py-8 text-center">
                       <LayoutGrid className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                       <p className="text-[11px] text-slate-400 font-bold italic">Chưa có model nào cho dòng này.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {availableModels.map(model => (
                        <label key={model.publicName} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                          formData.allowedModels.includes(model.publicName) 
                            ? "bg-emerald-50 border-emerald-500/30 ring-1 ring-emerald-500/10" 
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}>
                          <input 
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                            checked={formData.allowedModels.includes(model.publicName)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(f => ({ ...f, allowedModels: [...f.allowedModels, model.publicName] }));
                              } else {
                                setFormData(f => ({ ...f, allowedModels: f.allowedModels.filter(m => m !== model.publicName) }));
                              }
                            }}
                          />
                          <span className={`text-xs font-black ${formData.allowedModels.includes(model.publicName) ? "text-emerald-700" : "text-slate-700"}`}>
                             {model.publicName}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition-colors">Đang bán</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={e => setFormData({...formData, isPopular: e.target.checked})}
                    className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition-colors flex items-center gap-1">
                    Gói phổ biến <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500"/>
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.isContactOnly}
                    onChange={e => setFormData({...formData, isContactOnly: e.target.checked})}
                    className="h-5 w-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition-colors flex items-center gap-1">
                    Gói liên hệ (Enterprise)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl px-8 py-3.5 text-sm font-black text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-10 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95"
                >
                  {editingId ? "Cập nhật thay đổi" : "Xác nhận tạo gói"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
