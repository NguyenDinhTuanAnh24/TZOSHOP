"use client";

import { useEffect, useState } from "react";
import { 
  LifeBuoy, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Activity,
  MessageSquare,
  ChevronRight,
  User,
  Mail,
  ArrowRight,
  Hash,
  ShoppingBag,
  Flag,
  Tag,
  Save,
  RotateCcw
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type SupportTicket = {
  id: string;
  name: string;
  email: string;
  category: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  orderCode?: string;
  apiKeyPrefix?: string;
  adminNotes?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const [detailData, setDetailData] = useState({
    status: "",
    adminNotes: ""
  });

  const { toast, showToast, clearToast } = useToast();

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/support");
      const result = await res.json();
      if (result.success) {
        setTickets(result.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  useEffect(() => {
    if (selectedTicket) {
      setDetailData({
        status: selectedTicket.status,
        adminNotes: selectedTicket.adminNotes || ""
      });
    }
  }, [selectedTicketId]);

  const handleUpdateTicket = async () => {
    if (!selectedTicketId) return;
    try {
      setIsUpdating(true);
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ticketId: selectedTicketId, 
          status: detailData.status,
          adminNotes: detailData.adminNotes 
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đã cập nhật ticket.", "success");
        fetchTickets();
      }
    } catch (error) {
      showToast("Không thể cập nhật.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: "Đang mở",
      IN_PROGRESS: "Đang xử lý",
      RESOLVED: "Đã giải quyết",
      CLOSED: "Đã đóng"
    };
    const variants: Record<string, "info" | "warning" | "success" | "neutral"> = {
      OPEN: "info",
      IN_PROGRESS: "warning",
      RESOLVED: "success",
      CLOSED: "neutral"
    };
    return (
      <StatusBadge 
        status={labels[status] || status}
        variant={variants[status] || "neutral"}
      />
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "NORMAL": return <Flag className="h-3.5 w-3.5 text-slate-300" />;
      case "HIGH": return <Flag className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />;
      case "URGENT": return <AlertCircle className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />;
      default: return null;
    }
  };

  const categories = Array.from(new Set(tickets.map(t => t.category)));

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.email.toLowerCase().includes(search.toLowerCase()) || 
                          t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
    const matchesCategory = filterCategory === "ALL" || t.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
      <PageHeader 
        title="Hỗ trợ khách hàng" 
        description="Theo dõi và xử lý yêu cầu hỗ trợ từ người dùng."
        icon={
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-sm ring-1 ring-slate-800/50">
            <LifeBuoy className="h-8 w-8 text-white" />
          </div>
        }
        actions={
          <div className="flex items-center gap-8">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-10 px-6 border-r border-[#edf1ee] hidden lg:grid">
                <div className="text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Đang mở</p>
                   <p className="text-xl font-black text-[#4d73ff]">{tickets.filter(t => t.status === 'OPEN').length}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Đang xử lý</p>
                   <p className="text-xl font-black text-[#ffb800]">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Đã xong</p>
                   <p className="text-xl font-black text-[#00d4a4]">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Khẩn cấp</p>
                   <p className="text-xl font-black text-rose-600">{tickets.filter(t => t.priority === 'URGENT').length}</p>
                </div>
             </div>
             <button
               type="button"
               onClick={fetchTickets}
               title="Làm mới"
               className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-150 ease-out hover:bg-slate-50 hover:text-slate-950 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
             >
                <RotateCcw className={cn("h-5 w-5 shrink-0", isLoading && "animate-spin")} />
             </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)] flex-1 min-h-0">
         <AppCard className="flex flex-col overflow-hidden p-0 border-slate-200 shadow-sm rounded-[32px]">
            <div className="p-5 border-b border-slate-100 space-y-4 shrink-0 bg-[#fbfbf8]">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm email, chủ đề..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
               </div>
               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 focus:border-emerald-400 outline-none cursor-pointer transition-all"
                  >
                    <option value="ALL">Trạng thái</option>
                    <option value="OPEN">Đang mở</option>
                    <option value="IN_PROGRESS">Đang xử lý</option>
                    <option value="RESOLVED">Giải quyết</option>
                    <option value="CLOSED">Đã đóng</option>
                  </select>
                  <select 
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 focus:border-emerald-400 outline-none cursor-pointer transition-all"
                  >
                    <option value="ALL">Độ ưu tiên</option>
                    <option value="NORMAL">Bình thường</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {isLoading ? (
                  <div className="py-24 text-center space-y-4">
                     <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#00d4a4] border-t-transparent" />
                     <p className={cn(ui.label, "animate-pulse text-sm")}>Đang tải yêu cầu...</p>
                  </div>
               ) : (filteredTickets.length === 0 ? (
                  <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
                     <div className="max-w-[240px]">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4 ring-1 ring-slate-100 shadow-sm">
                           <Search className="h-7 w-7" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                           Không tìm thấy yêu cầu nào phù hợp với bộ lọc.
                        </p>
                     </div>
                  </div>
               ) : (
                  <div className="divide-y divide-[#edf1ee]">
                     {filteredTickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className={`w-full text-left p-8 transition-all border-l-[6px] relative active:scale-[0.99] ${
                            selectedTicketId === ticket.id 
                              ? "bg-[#fbfbf8] border-[#00d4a4] shadow-inner z-10" 
                              : "bg-white border-transparent hover:bg-slate-50"
                          }`}
                        >
                           <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 truncate max-w-[140px]">
                                 {ticket.category}
                              </span>
                              <div className="flex items-center gap-2">
                                 {getPriorityIcon(ticket.priority)}
                              </div>
                           </div>
                           <h4 className="text-[15px] font-black text-slate-900 leading-snug mb-2 line-clamp-2 tracking-tight">{ticket.subject}</h4>
                           <div className="flex items-center gap-2 mb-4">
                              <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                 {ticket.name[0]}
                              </div>
                              <p className="text-xs font-bold text-slate-500 truncate">{ticket.email}</p>
                           </div>
                           <div className="flex justify-between items-center">
                              {getStatusBadge(ticket.status)}
                              <span className="text-[10px] font-bold text-slate-400">
                                 {format(new Date(ticket.createdAt), "HH:mm dd/MM", { locale: vi })}
                              </span>
                           </div>
                        </button>
                     ))}
                  </div>
               ))}
            </div>
         </AppCard>

         <AppCard className="flex-1 overflow-hidden flex flex-col p-0 border-slate-200 shadow-sm rounded-[32px]">
            {!selectedTicket ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#fbfbf8]">
                  <div className="h-24 w-24 rounded-[40px] bg-white flex items-center justify-center mb-8 shadow-sm ring-1 ring-[#edf1ee]">
                     <MessageSquare className="h-12 w-12 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Chọn yêu cầu để xử lý</h3>
                  <p className="max-w-[340px] text-sm font-bold text-slate-500 leading-relaxed">
                     Chọn một yêu cầu hỗ trợ từ danh sách bên trái để xem nội dung chi tiết và phản hồi khách hàng.
                  </p>
               </div>
            ) : (
               <>
                  <div className="p-10 border-b border-[#edf1ee] shrink-0 bg-[#fbfbf8]">
                     <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                               {getStatusBadge(selectedTicket.status)}
                               <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest ring-1 ring-slate-100 shadow-sm">
                                  {selectedTicket.category}
                               </span>
                           </div>
                           <h2 className="text-3xl font-black text-slate-950 tracking-tight leading-[1.2]">{selectedTicket.subject}</h2>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className={cn(
                               "flex h-11 px-5 items-center gap-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest shadow-sm",
                               selectedTicket.priority === 'URGENT' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                               selectedTicket.priority === 'HIGH' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                               'bg-white border-slate-200 text-slate-500'
                            )}>
                               {getPriorityIcon(selectedTicket.priority)}
                               {selectedTicket.priority}
                            </div>
                         </div>
                      </div>
                   </div>
 
                   <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                      <div className="grid sm:grid-cols-2 gap-8">
                         <div className="p-8 rounded-[32px] bg-[#fbfbf8] border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Thông tin khách hàng</p>
                            <div className="flex items-center gap-5">
                              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-slate-900 text-lg font-black shadow-sm ring-1 ring-slate-200 transition-transform hover:scale-105">
                                 {selectedTicket.name[0].toUpperCase()}
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[15px] font-black text-slate-900">{selectedTicket.name}</p>
                                 <p className="text-sm font-bold text-slate-500">{selectedTicket.email}</p>
                              </div>
                           </div>
                        </div>
                        <div className="p-8 rounded-[32px] bg-[#fbfbf8] border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Tham chiếu hệ thống</p>
                           <div className="space-y-4">
                              {selectedTicket.orderCode ? (
                                 <div className="flex items-center gap-3.5">
                                    <ShoppingBag className="h-5 w-5 text-slate-400" />
                                    <span className="text-sm font-black text-slate-900">Đơn hàng: <span className="text-emerald-600">#{selectedTicket.orderCode}</span></span>
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-3.5 opacity-50">
                                    <ShoppingBag className="h-5 w-5 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-400 italic">Không có mã đơn hàng</p>
                                 </div>
                              )}
                              {selectedTicket.apiKeyPrefix ? (
                                 <div className="flex items-center gap-3.5">
                                    <Hash className="h-5 w-5 text-slate-400" />
                                    <span className="text-sm font-black text-slate-900">API Key: <span className="text-[#00d4a4]">{selectedTicket.apiKeyPrefix}...</span></span>
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-3.5 opacity-50">
                                    <Hash className="h-5 w-5 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-400 italic">Không có API Key tham chiếu</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
 
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Nội dung yêu cầu</label>
                        <div className="p-10 rounded-[40px] bg-slate-950 text-emerald-400 text-base font-medium leading-relaxed shadow-2xl ring-[12px] ring-slate-50 whitespace-pre-wrap selection:bg-emerald-500/30">
                           {selectedTicket.message}
                        </div>
                        <div className="flex justify-end gap-2 pr-2 pt-2">
                           <Clock className="h-4 w-4 text-slate-300" />
                           <p className="text-[11px] font-bold text-slate-400">
                              Gửi lúc: {format(new Date(selectedTicket.createdAt), "HH:mm:ss - dd/MM/yyyy", { locale: vi })}
                           </p>
                        </div>
                     </div>

                     <div className="space-y-8 pt-6 border-t border-slate-100">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" /> Ghi chú nội bộ / Phản hồi cho khách hàng
                           </label>
                           <textarea 
                              value={detailData.adminNotes}
                              onChange={e => setDetailData({...detailData, adminNotes: e.target.value})}
                              placeholder="Nhập ghi chú xử lý hoặc phản hồi để khách hàng xem..."
                              className="w-full min-h-[180px] rounded-[32px] border border-slate-200 bg-slate-50/50 p-8 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner custom-scrollbar"
                           />
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                           <div className="flex-1 space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cập nhật trạng thái</label>
                              <div className="relative">
                                 <select 
                                    value={detailData.status}
                                    onChange={e => setDetailData({...detailData, status: e.target.value})}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-900 outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-sm"
                                 >
                                    <option value="OPEN">OPEN - Đang chờ xử lý</option>
                                    <option value="IN_PROGRESS">IN_PROGRESS - Đang giải quyết</option>
                                    <option value="RESOLVED">RESOLVED - Đã xử lý xong</option>
                                    <option value="CLOSED">CLOSED - Đã đóng vĩnh viễn</option>
                                 </select>
                                 <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                              </div>
                           </div>
                           <div className="flex items-end">
                              <button 
                                 onClick={handleUpdateTicket}
                                 disabled={isUpdating}
                                 className="w-full md:w-auto h-[56px] flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-12 text-sm font-black text-white shadow-xl shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                              >
                                 {isUpdating ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                 ) : (
                                    <Save className="h-5 w-5" />
                                 )}
                                 Lưu cập nhật
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
                </>
             )}
         </AppCard>
      </div>

      {toast && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}
