"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, MessageCircle, RefreshCw, Send } from "lucide-react";

import { TextFadeInUp } from "@/components/animations/text-fade-in-up";
import { CosmicButton } from "@/components/ui/cosmic-button";
import { ToastMessage } from "@/components/ui/toast-message";
import { SupportPageSkeleton } from "@/components/dashboard/support/support-page-skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const REQUEST_TYPES = ["Thanh toán", "API key", "Credits", "Model/API", "Tài khoản", "Khác"];
const PRIORITIES = ["Bình thường", "Cao", "Khẩn cấp"];

export interface TicketItem {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "NORMAL" | "HIGH" | "URGENT";
  category: string;
  createdAt: string;
  subject: string;
  message: string;
  adminNotes?: string | null;
}

type TicketPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

const PAGE_SIZE = 3;

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = useMemo(() => {
    const pageFromQuery = Number(searchParams.get("page") || "1");
    return Number.isFinite(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1;
  }, [searchParams]);
  const { data: session } = useSession();
  const { toast, showToast, clearToast } = useToast(4000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: REQUEST_TYPES[0],
    priority: PRIORITIES[1],
    title: "",
    content: "",
    reference: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "email" | "title" | "content", string>>>({});

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [pagination, setPagination] = useState<TicketPagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchMyTickets = async (page = currentPage) => {
    try {
      setIsLoadingTickets(true);
      setLoadError(null);
      const response = await fetch(`/api/support?page=${page}&pageSize=${PAGE_SIZE}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Không thể tải ticket hỗ trợ.");
      setTickets(result.data || []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Không thể tải ticket hỗ trợ.");
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchMyTickets(currentPage), 0);
    return () => window.clearTimeout(timer);
  }, [currentPage]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || session?.user?.name || "",
      email: prev.email || session?.user?.email || "",
    }));
  }, [session?.user?.name, session?.user?.email]);

  const clearForm = () => {
    setFormData({
      name: session?.user?.name || "",
      email: session?.user?.email || "",
      type: REQUEST_TYPES[0],
      priority: PRIORITIES[0],
      title: "",
      content: "",
      reference: "",
    });
    setFieldErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<"name" | "email" | "title" | "content", string>> = {};
    if (!formData.name.trim()) nextErrors.name = "Vui lòng nhập họ tên.";
    if (!formData.email.trim()) nextErrors.email = "Vui lòng nhập email liên hệ.";
    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) nextErrors.email = "Email không hợp lệ.";
    if (!formData.title.trim()) nextErrors.title = "Vui lòng nhập tiêu đề.";
    if (!formData.content.trim()) nextErrors.content = "Vui lòng nhập nội dung hỗ trợ.";
    if (formData.content.trim() && formData.content.trim().length < 10) nextErrors.content = "Nội dung hỗ trợ tối thiểu 10 ký tự.";

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          category: formData.type,
          priority: formData.priority,
          subject: formData.title,
          message: formData.content,
          orderCode: formData.reference,
          apiKeyPrefix: formData.reference,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Không thể gửi yêu cầu hỗ trợ.");

      showToast("Đã gửi yêu cầu hỗ trợ", "success");
      clearForm();
      router.replace("/support?page=1");
      void fetchMyTickets(1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể gửi yêu cầu hỗ trợ.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPage = (page: number) => {
    const safePage = Math.max(1, Math.min(page, pagination.totalPages || 1));
    router.replace(`/support?page=${safePage}`);
  };

  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1);
  const pageStart = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const pageEnd = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  const getStatusMeta = (status: TicketItem["status"]) => {
    if (status === "OPEN") return { text: "Mới", className: "bg-amber-50 text-amber-700 border border-amber-100" };
    if (status === "IN_PROGRESS") return { text: "Đang xử lý", className: "bg-indigo-50 text-indigo-700 border border-indigo-100" };
    if (status === "RESOLVED") return { text: "Chờ phản hồi", className: "bg-emerald-50 text-emerald-700 border border-emerald-100" };
    return { text: "Đã đóng", className: "bg-slate-100 text-slate-600 border border-slate-200" };
  };

  return (
    <main className="space-y-8 pb-20" aria-busy={isLoadingTickets}>
      <TextFadeInUp as="section" className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Hỗ trợ</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600 md:text-base">Gửi yêu cầu hỗ trợ về thanh toán, API key, credits, model/API hoặc tài khoản.</p>
      </TextFadeInUp>

      <TextFadeInUp as="section" delay={0.08} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-extrabold text-slate-950">Tạo ticket mới</h2>
        <p className="mt-2 text-sm text-slate-600">Gửi yêu cầu hỗ trợ về thanh toán, API key, credits hoặc tài khoản của bạn.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Thông tin liên hệ</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <input type="text" placeholder="Nhập họ tên của bạn" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                {fieldErrors.name ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p> : null}
              </div>
              <div>
                <input type="email" placeholder="email@example.com" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                {fieldErrors.email ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p> : null}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Thông tin yêu cầu</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                {REQUEST_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
              <input type="text" placeholder="VD: ORD-... hoặc sk-abc..." className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Nội dung hỗ trợ</h3>
            <div>
              <input type="text" placeholder="Tóm tắt vấn đề bạn cần hỗ trợ" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              {fieldErrors.title ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p> : null}
            </div>
            <div>
              <textarea rows={6} placeholder="Mô tả chi tiết vấn đề, thời điểm xảy ra và thao tác bạn đã thử..." className="min-h-[160px] w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
              {fieldErrors.content ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.content}</p> : null}
            </div>
          </section>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500">Chúng tôi sẽ phản hồi sớm nhất có thể qua email hoặc trong trang hỗ trợ.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={clearForm}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Xóa nội dung
              </button>
              <CosmicButton type="submit" className="h-12" disabled={isSubmitting}>
                <Send className="h-4 w-4" />
                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </CosmicButton>
            </div>
          </div>
        </form>
      </TextFadeInUp>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-slate-950">Ticket của tôi</h2>
          <button type="button" onClick={() => void fetchMyTickets(currentPage)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            <RefreshCw className="h-4 w-4" />Làm mới
          </button>
        </div>

        {loadError ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><AlertTriangle className="h-7 w-7" /></div>
            <h3 className="text-xl font-bold text-slate-950">Không thể tải ticket hỗ trợ</h3>
            <p className="mt-2 text-sm text-slate-600">{loadError}</p>
          </section>
        ) : isLoadingTickets ? (
          <SupportPageSkeleton minimal />
        ) : tickets.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><MessageCircle className="h-8 w-8" /></div>
            <h3 className="text-2xl font-bold text-slate-950">Bạn chưa có ticket hỗ trợ nào.</h3>
          </section>
        ) : (
          <>
            <div className="grid gap-4">
              {tickets.map((ticket) => {
                const status = getStatusMeta(ticket.status);
                return (
                  <article key={ticket.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>{status.text}</span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{ticket.category}</span>
                    </div>
                    <h4 className="mt-3 text-lg font-bold text-slate-950">{ticket.subject}</h4>
                    <p className="mt-1 text-sm text-slate-600">{ticket.message}</p>
                    <p className="mt-3 text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleString("vi-VN")}</p>
                    {ticket.adminNotes ? <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">Phản hồi từ Admin: {ticket.adminNotes}</div> : null}
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <p className="text-xs text-slate-500">
                Hiển thị {pageStart} - {pageEnd} trong {pagination.totalItems} ticket
              </p>
              {pagination.totalPages > 1 ? (
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Trước
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      key={`support-page-${page}`}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={cn(
                        "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold",
                        page === pagination.page
                          ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>

      {toast ? <ToastMessage message={toast.message} type={toast.type} onClose={clearToast} /> : null}
    </main>
  );
}
