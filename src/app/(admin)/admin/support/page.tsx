"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertCircle, LifeBuoy, Search, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { useToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-message";

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

type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type PriorityFilter = "ALL" | "NORMAL" | "HIGH" | "URGENT";
type TimeFilter = "ALL" | "TODAY" | "7D" | "30D";
type SortFilter = "NEWEST" | "OLDEST" | "PRIORITY" | "WAITING";

function statusLabel(status: SupportTicket["status"] | string) {
  if (status === "OPEN") return "Mới";
  if (status === "IN_PROGRESS") return "Đang xử lý";
  if (status === "RESOLVED") return "Chờ phản hồi";
  if (status === "CLOSED") return "Đã đóng";
  return status;
}

function statusClass(status: SupportTicket["status"] | string) {
  if (status === "OPEN") return "border-indigo-100 bg-indigo-50 text-indigo-700";
  if (status === "IN_PROGRESS") return "border-violet-100 bg-violet-50 text-violet-700";
  if (status === "RESOLVED") return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-emerald-100 bg-emerald-50 text-emerald-700";
}

function priorityLabel(priority: SupportTicket["priority"] | string) {
  if (priority === "NORMAL") return "Trung bình";
  if (priority === "HIGH") return "Cao";
  if (priority === "URGENT") return "Khẩn cấp";
  return priority;
}

function priorityClass(priority: SupportTicket["priority"] | string) {
  if (priority === "NORMAL") return "border-sky-100 bg-sky-50 text-sky-700";
  if (priority === "HIGH") return "border-amber-100 bg-amber-50 text-amber-700";
  if (priority === "URGENT") return "border-rose-100 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function SupportSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-28px_rgba(79,70,229,0.25)] sm:p-8">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="mt-4 h-10 w-56 rounded-xl" />
        <Skeleton className="mt-3 h-5 w-[620px] max-w-full rounded-full" />
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
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-xl" />
          ))}
        </div>
      </section>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterTime, setFilterTime] = useState<TimeFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortFilter>("NEWEST");

  const [detailData, setDetailData] = useState({ status: "", adminNotes: "" });
  const { toast, showToast, clearToast } = useToast(3000);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const res = await fetch("/api/admin/support", { cache: "no-store" });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setIsError(true);
        return;
      }
      setTickets(result.data || []);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchTickets(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchTickets]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleOpenDetail = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      setDetailData({
        status: ticket.status,
        adminNotes: ticket.adminNotes || "",
      });
    }
    setSelectedTicketId(ticketId);
    setIsDetailOpen(true);
  };

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
      if (res.ok && result.success) {
        showToast("Đã cập nhật trạng thái ticket", "success");
        void fetchTickets();
      } else {
        showToast("Không thể cập nhật ticket", "error");
      }
    } catch {
      showToast("Không thể cập nhật ticket", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    return tickets
      .filter((t) => {
        const keyword = search.toLowerCase().trim();
        const matchesSearch =
          !keyword ||
          t.email.toLowerCase().includes(keyword) ||
          t.subject.toLowerCase().includes(keyword) ||
          t.message.toLowerCase().includes(keyword) ||
          t.id.toLowerCase().includes(keyword);
        const matchesStatus = filterStatus === "ALL" || t.status === filterStatus;
        const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
        const matchesCategory = filterCategory === "ALL" || t.category === filterCategory;
        let matchesTime = true;
        if (filterTime !== "ALL") {
          const createdAt = new Date(t.createdAt);
          if (filterTime === "TODAY") matchesTime = createdAt >= todayStart;
          if (filterTime === "7D") matchesTime = createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (filterTime === "30D") matchesTime = createdAt >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTime;
      })
      .sort((a, b) => {
        if (sortBy === "OLDEST") return +new Date(a.createdAt) - +new Date(b.createdAt);
        if (sortBy === "PRIORITY") {
          const rank = { URGENT: 3, HIGH: 2, NORMAL: 1 };
          return rank[b.priority] - rank[a.priority];
        }
        if (sortBy === "WAITING") return +new Date(a.createdAt) - +new Date(b.createdAt);
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  }, [tickets, search, filterStatus, filterPriority, filterCategory, filterTime, sortBy]);

  const categories = useMemo(() => Array.from(new Set(tickets.map((t) => t.category).filter(Boolean))), [tickets]);

  if (isLoading && tickets.length === 0) return <SupportSkeleton />;

  if (isError && tickets.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-950">Không thể tải ticket hỗ trợ</h2>
        <p className="mt-2 text-sm text-slate-600">Vui lòng thử lại sau ít phút.</p>
        <button
          type="button"
          onClick={() => void fetchTickets()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Thử lại
        </button>
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
            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Chăm sóc khách hàng</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Ticket hỗ trợ</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Theo dõi, phân loại và xử lý các yêu cầu hỗ trợ từ người dùng TzoShop.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <CosmicButton href="/support" className="min-w-[180px]">Hỗ trợ người dùng</CosmicButton>
          </div>
        </div>
      </TextFadeInUp>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng ticket", value: tickets.length, cls: "bg-indigo-50 text-indigo-700" },
          { label: "Đang mở", value: tickets.filter((t) => t.status === "OPEN").length, cls: "bg-amber-50 text-amber-700" },
          { label: "Đang xử lý", value: tickets.filter((t) => t.status === "IN_PROGRESS").length, cls: "bg-violet-50 text-violet-700" },
          { label: "Đã đóng", value: tickets.filter((t) => t.status === "CLOSED").length, cls: "bg-emerald-50 text-emerald-700" },
        ].map((s, i) => (
          <TextFadeInUp key={s.label} delay={Math.min(i * 0.05, 0.25)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", s.cls)}>
              <Ticket className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-950">{s.value.toLocaleString("vi-VN")}</p>
          </TextFadeInUp>
        ))}
      </section>

      <TextFadeInUp as="section" delay={0.05} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã ticket, email, chủ đề hoặc nội dung..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Mới</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="RESOLVED">Chờ phản hồi</option>
            <option value="CLOSED">Đã đóng</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as PriorityFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="NORMAL">Trung bình</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
            <option value="ALL">Tất cả loại vấn đề</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={filterTime} onChange={(e) => setFilterTime(e.target.value as TimeFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
              <option value="ALL">Tất cả</option>
              <option value="TODAY">Hôm nay</option>
              <option value="7D">7 ngày</option>
              <option value="30D">30 ngày</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortFilter)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
              <option value="PRIORITY">Ưu tiên cao</option>
              <option value="WAITING">Chờ lâu nhất</option>
            </select>
          </div>
        </div>
      </TextFadeInUp>

      <TextFadeInUp as="section" delay={0.08} className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                {["Ticket", "Người gửi", "Loại vấn đề", "Ưu tiên", "Trạng thái", "Cập nhật cuối", "Người phụ trách", "Hành động"].map((header) => (
                  <th key={header} className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="mx-auto flex w-fit flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <LifeBuoy className="h-7 w-7" />
                      </div>
                      <p className="text-xl font-extrabold text-slate-950">{tickets.length === 0 ? "Chưa có ticket hỗ trợ" : "Không tìm thấy ticket phù hợp"}</p>
                      <p className="mt-1 text-sm text-slate-600">Các yêu cầu hỗ trợ từ người dùng sẽ hiển thị tại đây.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-slate-100 transition hover:bg-indigo-50/30">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">#{ticket.id.slice(0, 8).toUpperCase()}</p>
                      <p className="max-w-[280px] truncate text-sm text-slate-600" title={ticket.subject}>
                        {ticket.subject}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="max-w-[220px] truncate font-semibold text-slate-900">{ticket.name || "Người dùng"}</p>
                      <p className="max-w-[220px] truncate text-sm text-slate-600">{ticket.email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{ticket.category}</td>
                    <td className="px-4 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", priorityClass(ticket.priority))}>{priorityLabel(ticket.priority)}</span></td>
                    <td className="px-4 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass(ticket.status))}>{statusLabel(ticket.status)}</span></td>
                    <td className="px-4 py-4 text-sm text-slate-600">{format(new Date(ticket.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">Admin</td>
                    <td className="px-4 py-4">
                      <button onClick={() => handleOpenDetail(ticket.id)} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]">
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TextFadeInUp>

      <section className="space-y-4 lg:hidden">
        {filteredTickets.length === 0 ? (
          <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <LifeBuoy className="h-7 w-7" />
            </div>
            <p className="text-xl font-extrabold text-slate-950">Chưa có ticket hỗ trợ</p>
            <p className="mt-2 text-sm text-slate-600">Các yêu cầu hỗ trợ từ người dùng sẽ hiển thị tại đây.</p>
          </article>
        ) : (
          filteredTickets.map((ticket) => (
            <article key={ticket.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900">#{ticket.id.slice(0, 8).toUpperCase()}</p>
                <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass(ticket.status))}>{statusLabel(ticket.status)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-700">{ticket.subject}</p>
              <p className="mt-1 truncate text-sm text-slate-600">{ticket.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", priorityClass(ticket.priority))}>{priorityLabel(ticket.priority)}</span>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{ticket.category}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{format(new Date(ticket.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}</p>
              <button onClick={() => handleOpenDetail(ticket.id)} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                Chi tiết
              </button>
            </article>
          ))
        )}
      </section>

      <Modal
        open={isDetailOpen && Boolean(selectedTicket)}
        onClose={() => setIsDetailOpen(false)}
        title={selectedTicket ? `Ticket #${selectedTicket.id.slice(0, 8).toUpperCase()}` : "Ticket"}
        description="Theo dõi và xử lý chi tiết yêu cầu hỗ trợ."
        maxWidthClassName="max-w-5xl"
        footer={
          <>
            <button type="button" onClick={() => setIsDetailOpen(false)} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Đóng
            </button>
            <button type="button" onClick={() => void handleUpdateTicket()} disabled={isUpdating || !selectedTicket} className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60">
              {isUpdating ? "Đang lưu..." : "Cập nhật ticket"}
            </button>
          </>
        }
      >
        {!selectedTicket ? null : (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nội dung yêu cầu</p>
                <h3 className="mt-2 text-lg font-extrabold text-slate-950">{selectedTicket.subject}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedTicket.message}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phản hồi người dùng</p>
                <textarea value={detailData.adminNotes} onChange={(e) => setDetailData((prev) => ({ ...prev, adminNotes: e.target.value }))} placeholder="Nhập nội dung phản hồi..." className="mt-3 min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </section>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thông tin ticket</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p><span className="font-semibold text-slate-900">Người gửi:</span> {selectedTicket.name || "Người dùng"}</p>
                  <p className="break-words"><span className="font-semibold text-slate-900">Email:</span> {selectedTicket.email}</p>
                  <p><span className="font-semibold text-slate-900">Loại vấn đề:</span> {selectedTicket.category}</p>
                  <p><span className="font-semibold text-slate-900">Ưu tiên:</span> {priorityLabel(selectedTicket.priority)}</p>
                  <p><span className="font-semibold text-slate-900">Trạng thái:</span> {statusLabel(selectedTicket.status)}</p>
                  <p><span className="font-semibold text-slate-900">Ngày tạo:</span> {format(new Date(selectedTicket.createdAt), "HH:mm:ss dd/MM/yyyy", { locale: vi })}</p>
                  <p><span className="font-semibold text-slate-900">Đơn hàng:</span> {selectedTicket.orderCode ? `#${selectedTicket.orderCode}` : "—"}</p>
                  <p><span className="font-semibold text-slate-900">API key:</span> {selectedTicket.apiKeyPrefix ? `${selectedTicket.apiKeyPrefix}...` : "—"}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cập nhật trạng thái</p>
                <select value={detailData.status} onChange={(e) => setDetailData((prev) => ({ ...prev, status: e.target.value }))} className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950">
                  <option value="OPEN">Mới</option>
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="RESOLVED">Chờ phản hồi</option>
                  <option value="CLOSED">Đã đóng</option>
                </select>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDetailData((prev) => ({ ...prev, status: "IN_PROGRESS" }))} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]">Đánh dấu đang xử lý</button>
                  <button type="button" onClick={() => setDetailData((prev) => ({ ...prev, status: "CLOSED" }))} className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-[0.98]">Đóng ticket</button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </Modal>

      {isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          Không thể tải ticket hỗ trợ
        </div>
      ) : null}

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </div>
  );
}
