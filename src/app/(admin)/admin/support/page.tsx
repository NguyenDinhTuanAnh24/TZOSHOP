"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LifeBuoy,
  Search,
  AlertCircle,
  MessageSquare,
  Hash,
  ShoppingBag,
  Flag,
  Save,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
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

function statusLabel(status: SupportTicket["status"] | string) {
  if (status === "OPEN") return "Đang mở";
  if (status === "IN_PROGRESS") return "Đang xử lý";
  if (status === "RESOLVED") return "Đã xong";
  if (status === "CLOSED") return "Đã đóng";
  return status;
}

function statusClass(status: SupportTicket["status"] | string) {
  if (status === "OPEN") return "bg-[#FFD93D]";
  if (status === "IN_PROGRESS") return "bg-[#DBEAFE]";
  if (status === "RESOLVED") return "bg-[#C7F0D8]";
  return "bg-[#E9E1D0]";
}

function priorityLabel(priority: SupportTicket["priority"] | string) {
  if (priority === "NORMAL") return "Bình thường";
  if (priority === "HIGH") return "Cao";
  if (priority === "URGENT") return "Khẩn cấp";
  return priority;
}

function priorityClass(priority: SupportTicket["priority"] | string) {
  if (priority === "HIGH") return "bg-[#FFD93D]";
  if (priority === "URGENT") return "bg-[#FF6B6B]";
  return "bg-white";
}

function SupportSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="h-8 w-64 animate-pulse bg-[#E9E1D0]" />
        <div className="mt-3 h-4 w-full max-w-[520px] animate-pulse bg-[#E9E1D0]" />
      </section>
      <section className="grid min-h-[620px] min-w-0 grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="border-4 border-black bg-[#FFFDF5] p-4 shadow-[7px_7px_0px_0px_#000]">
          <div className="h-14 animate-pulse bg-[#E9E1D0]" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 border-2 border-black bg-[#E9E1D0] animate-pulse" />
            ))}
          </div>
        </div>
        <div className="border-4 border-black bg-[#FFFDF5] p-6 shadow-[7px_7px_0px_0px_#000]">
          <div className="h-full w-full animate-pulse bg-[#E9E1D0]" />
        </div>
      </section>
    </div>
  );
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterCategory] = useState("ALL");

  const [detailData, setDetailData] = useState({
    status: "",
    adminNotes: "",
  });

  const { toast, showToast, clearToast } = useToast();

  const fetchTickets = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTickets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTickets]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  useEffect(() => {
    let timer: number;
    if (selectedTicket) {
      timer = window.setTimeout(() => {
        setDetailData({
          status: selectedTicket.status,
          adminNotes: selectedTicket.adminNotes || "",
        });
      }, 0);
    }
    return () => window.clearTimeout(timer);
  }, [selectedTicketId, selectedTicket]);

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
          adminNotes: detailData.adminNotes,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Đã cập nhật ticket.", "success");
        void fetchTickets();
      }
    } catch {
      showToast("Không thể cập nhật.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return <Flag className="h-3.5 w-3.5 text-black" />;
      case "URGENT":
        return <AlertCircle className="h-3.5 w-3.5 text-black" />;
      default:
        return <Flag className="h-3.5 w-3.5 text-black" />;
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.email.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
    const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
    const matchesCategory = filterCategory === "ALL" || t.category === filterCategory;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  if (isLoading && tickets.length === 0) return <SupportSkeleton />;

  return (
    <div className="space-y-6 overflow-x-hidden pb-12">
      <section className="relative overflow-visible border-4 border-black bg-[#FFFDF5] p-6 shadow-[8px_8px_0px_0px_#000] md:p-7">
        <div className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 border-4 border-black bg-[#A78BFA]" />
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <LifeBuoy className="h-7 w-7 text-black" />
              </div>
              <span className="inline-flex border-2 border-black bg-[#C7F0D8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">SUPPORT</span>
            </div>
            <h1 className="pt-1 text-3xl font-black uppercase tracking-tight text-black md:text-4xl">HỖ TRỢ KHÁCH HÀNG</h1>
            <p className="text-sm font-bold text-black/70 md:text-base">Theo dõi và xử lý yêu cầu hỗ trợ từ người dùng.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {[
              { label: "ĐANG MỞ", value: tickets.filter((t) => t.status === "OPEN").length, bg: "bg-[#FFD93D]" },
              { label: "ĐANG XỬ LÝ", value: tickets.filter((t) => t.status === "IN_PROGRESS").length, bg: "bg-[#DBEAFE]" },
              { label: "ĐÃ XONG", value: tickets.filter((t) => t.status === "RESOLVED").length, bg: "bg-[#C7F0D8]" },
              { label: "KHẨN CẤP", value: tickets.filter((t) => t.priority === "URGENT").length, bg: "bg-[#FF6B6B]" },
            ].map((s) => (
              <div key={s.label} className={`border-4 border-black px-3 py-2 shadow-[3px_3px_0px_0px_#000] ${s.bg}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-black/70">{s.label}</p>
                <p className="text-xl font-black text-black">{s.value}</p>
              </div>
            ))}
            <button
              type="button"
              onClick={fetchTickets}
              title="Làm mới"
              className="inline-flex h-11 w-11 items-center justify-center border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:bg-[#FFD93D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <RotateCcw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid min-h-[620px] grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <article className="min-w-0 overflow-hidden border-4 border-black bg-[#FFFDF5] shadow-[7px_7px_0px_0px_#000]">
          <div className="space-y-3 border-b-4 border-black p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
              <input
                type="text"
                placeholder="Tìm email, chủ đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full border-4 border-black bg-white pl-10 pr-3 text-sm font-bold text-black placeholder:text-black/45 shadow-[3px_3px_0px_0px_#000] outline-none"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-11 w-full border-4 border-black bg-white px-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_#000]">
                <option value="ALL">Tất cả trạng thái</option>
                <option value="OPEN">Đang mở</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="RESOLVED">Đã xong</option>
                <option value="CLOSED">Đã đóng</option>
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="h-11 w-full border-4 border-black bg-white px-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_#000]">
                <option value="ALL">Tất cả độ ưu tiên</option>
                <option value="NORMAL">Bình thường</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div className="max-h-[620px] space-y-3 overflow-y-auto p-3">
            {filteredTickets.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[3px_3px_0px_0px_#000]">
                  <Search className="h-5 w-5 text-black" />
                </div>
                <p className="text-base font-black text-black">{tickets.length === 0 ? "Không có yêu cầu hỗ trợ nào" : "Không tìm thấy yêu cầu phù hợp"}</p>
                <p className="mt-1 max-w-[260px] text-sm font-bold text-black/60">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    "w-full cursor-pointer border-4 border-black bg-[#FFFDF5] p-4 text-left shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:-translate-y-0.5 hover:bg-[#FFF8D6]",
                    selectedTicketId === ticket.id && "bg-[#FFD93D] shadow-[6px_6px_0px_0px_#000]",
                  )}
                >
                  <p className="line-clamp-2 text-sm font-black text-black">{ticket.subject}</p>
                  <p className="mt-1 break-all text-xs font-bold text-black/65">{ticket.email}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 border-2 border-black px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${statusClass(ticket.status)}`}>
                      {statusLabel(ticket.status)}
                    </span>
                    <span className={`inline-flex items-center gap-1 border-2 border-black px-2 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${priorityClass(ticket.priority)}`}>
                      {getPriorityIcon(ticket.priority)}
                      {priorityLabel(ticket.priority)}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-bold text-black/60">{format(new Date(ticket.createdAt), "HH:mm dd/MM", { locale: vi })}</p>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="min-w-0 overflow-hidden border-4 border-black bg-[#FFFDF5] shadow-[7px_7px_0px_0px_#000]">
          {!selectedTicket ? (
            <div className="flex min-h-[620px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center border-4 border-black bg-[#FFD93D] shadow-[5px_5px_0px_0px_#000]">
                <MessageSquare className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-2xl font-black text-black">CHỌN YÊU CẦU ĐỂ XỬ LÝ</h3>
              <p className="mt-2 max-w-[480px] text-sm font-bold text-black/65">
                Chọn một yêu cầu hỗ trợ từ danh sách bên trái để xem nội dung chi tiết và phản hồi khách hàng.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <header className="border-b-4 border-black p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <h2 className="break-words text-2xl font-black text-black">{selectedTicket.subject}</h2>
                    <p className="break-all text-sm font-bold text-black/65">
                      {selectedTicket.name} · {selectedTicket.email}
                    </p>
                    <p className="text-xs font-bold text-black/60">{format(new Date(selectedTicket.createdAt), "HH:mm:ss - dd/MM/yyyy", { locale: vi })}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 border-2 border-black px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${statusClass(selectedTicket.status)}`}>
                      {statusLabel(selectedTicket.status)}
                    </span>
                    <span className={`inline-flex items-center gap-1 border-2 border-black px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] ${priorityClass(selectedTicket.priority)}`}>
                      {getPriorityIcon(selectedTicket.priority)}
                      {priorityLabel(selectedTicket.priority)}
                    </span>
                    <span className="inline-flex items-center gap-1 border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
                      <Headphones className="h-3.5 w-3.5" />
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>
              </header>

              <div className="space-y-4 overflow-y-auto p-5">
                <section className="space-y-2 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Thông tin khách hàng</p>
                  <p className="text-sm font-bold text-black">{selectedTicket.name}</p>
                  <p className="break-all text-sm font-bold text-black/65">{selectedTicket.email}</p>
                </section>

                <section className="space-y-2 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Thông tin liên quan</p>
                  {selectedTicket.orderCode ? (
                    <p className="flex items-center gap-2 text-sm font-bold text-black">
                      <ShoppingBag className="h-4 w-4" /> Đơn hàng: #{selectedTicket.orderCode}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-black/60">Không có mã đơn hàng</p>
                  )}
                  {selectedTicket.apiKeyPrefix ? (
                    <p className="flex items-center gap-2 text-sm font-bold text-black">
                      <Hash className="h-4 w-4" /> API key: {selectedTicket.apiKeyPrefix}...
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-black/60">Không có API key tham chiếu</p>
                  )}
                </section>

                <section className="space-y-2 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Nội dung yêu cầu</p>
                  <p className="whitespace-pre-wrap text-sm font-bold leading-relaxed text-black">{selectedTicket.message}</p>
                </section>

                <section className="space-y-3 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Phản hồi admin</p>
                  <textarea
                    value={detailData.adminNotes}
                    onChange={(e) => setDetailData({ ...detailData, adminNotes: e.target.value })}
                    placeholder="Nhập nội dung phản hồi cho khách hàng..."
                    className="min-h-[160px] w-full border-4 border-black bg-white p-4 text-sm font-bold text-black placeholder:text-black/45 shadow-[4px_4px_0px_0px_#000] outline-none"
                  />
                  <p className="text-xs font-bold text-black/60">
                    Phản hồi sẽ được gửi tới email của khách hàng nếu cấu hình email đang hoạt động.
                  </p>
                </section>

                <section className="space-y-3 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-black/60">Cập nhật trạng thái</p>
                  <select
                    value={detailData.status}
                    onChange={(e) => setDetailData({ ...detailData, status: e.target.value })}
                    className="h-12 w-full border-4 border-black bg-white px-3 text-sm font-black text-black shadow-[3px_3px_0px_0px_#000] outline-none"
                  >
                    <option value="OPEN">Đang mở</option>
                    <option value="IN_PROGRESS">Đang xử lý</option>
                    <option value="RESOLVED">Đã xong</option>
                    <option value="CLOSED">Đã đóng</option>
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <AppButton
                      onClick={handleUpdateTicket}
                      disabled={isUpdating}
                      className="h-12 border-4 border-black bg-[#FFD93D] px-5 font-black uppercase text-black shadow-[5px_5px_0px_0px_#000] hover:bg-[#C7F0D8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                      {isUpdating ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      GỬI PHẢN HỒI
                    </AppButton>
                  </div>
                </section>
              </div>
            </div>
          )}
        </article>
      </section>

      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
