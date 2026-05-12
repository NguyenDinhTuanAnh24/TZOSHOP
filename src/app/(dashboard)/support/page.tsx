"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  LifeBuoy, 
  Mail, 
  MessageCircle, 
  Send, 
  HelpCircle, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock
} from "lucide-react";
import { ToastMessage } from "@/components/ui/toast-message";
import DashboardSubNav from "@/components/dashboard/dashboard-sub-nav";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

const REQUEST_TYPES = [
  "Thanh toán",
  "API key",
  "Credits",
  "Gói dịch vụ",
  "Lỗi hệ thống",
  "Yêu cầu gói riêng",
  "Khác"
];

const PRIORITIES = [
  "Bình thường",
  "Cao",
  "Khẩn cấp"
];

const CONTACT_CHANNELS = [
  {
    name: "Email hỗ trợ",
    value: "support@tzoshop.vn",
    icon: Mail,
    href: "mailto:support@tzoshop.vn"
  },
  {
    name: "Zalo",
    value: "0969.xxx.xxx",
    icon: MessageCircle,
    href: "https://zalo.me/your-id"
  },
  {
    name: "Telegram",
    value: "@tzoshop_support",
    icon: Send,
    href: "https://t.me/tzoshop_support"
  }
];

const FAQS = [
  {
    question: "Không thấy credits sau thanh toán?",
    answer: "Thông thường credits sẽ được cộng ngay lập tức sau khi hệ thống nhận được thanh toán. Nếu sau 5 phút vẫn chưa thấy, vui lòng gửi hỗ trợ kèm mã đơn hàng."
  },
  {
    question: "API key không dùng được?",
    answer: "Hãy kiểm tra xem bạn đã nạp credits chưa và API key có bị vô hiệu hóa không. Đảm bảo bạn đang sử dụng đúng endpoint và header authentication."
  },
  {
    question: "Muốn mua gói riêng?",
    answer: "Nếu bạn có nhu cầu sử dụng lượng lớn credits hàng tháng, hãy liên hệ qua Telegram hoặc chọn loại yêu cầu 'Yêu cầu gói riêng' để nhận báo giá tốt nhất."
  },
  {
    question: "Credits bị trừ như thế nào?",
    answer: "Credits được trừ dựa trên số lượng tokens tiêu thụ (input + output) theo bảng giá của từng model AI cụ thể mà bạn sử dụng."
  }
];

export interface TicketItem {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  category: string;
  createdAt: string;
  subject: string;
  message: string;
  adminNotes?: string | null;
}

export default function SupportPage() {
  const { toast, showToast, clearToast } = useToast(4000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: REQUEST_TYPES[0],
    priority: PRIORITIES[0],
    title: "",
    content: "",
    reference: ""
  });

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  const fetchMyTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const res = await fetch("/api/support");
      const result = await res.json();
      if (result.success) setTickets(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchMyTickets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.title.trim()) {
      showToast("Vui lòng kiểm tra lại thông tin.", "error");
      return;
    }

    if (formData.content.trim().length < 10) {
      showToast("Nội dung hỗ trợ tối thiểu phải 10 ký tự.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra.");
      }

      showToast("Yêu cầu hỗ trợ đã được gửi.", "success");
      setFormData({
        name: "",
        email: "",
        type: REQUEST_TYPES[0],
        priority: PRIORITIES[0],
        title: "",
        content: "",
        reference: ""
      });
      fetchMyTickets(); // Refresh list
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể gửi yêu cầu lúc này.";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN": return { text: "Đang mở", color: "bg-blue-50 text-blue-600 ring-blue-100" };
      case "IN_PROGRESS": return { text: "Đang xử lý", color: "bg-amber-50 text-amber-600 ring-amber-100" };
      case "RESOLVED": return { text: "Đã giải quyết", color: "bg-emerald-50 text-emerald-600 ring-emerald-100" };
      case "CLOSED": return { text: "Đã đóng", color: "bg-slate-50 text-slate-500 ring-slate-100" };
      default: return { text: status, color: "bg-slate-50 text-slate-500 ring-slate-100" };
    }
  };



  return (
    <div className="space-y-8 pb-20">
      <DashboardSubNav 
        items={[
          { label: "Cài đặt", href: "/settings" },
          { label: "Hỗ trợ", href: "/support" },
        ]} 
      />
      <PageHeader 
        title="Hỗ trợ" 
        description="Gửi yêu cầu hỗ trợ khi bạn gặp vấn đề về thanh toán, credits hoặc API key."
        icon={<LifeBuoy className="h-8 w-8" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px] items-start">
        <AppCard className="p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-[#00d4a4]" />
            <h2 className={ui.h3}>Gửi yêu cầu mới</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className={ui.label}>Họ tên <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={ui.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className={ui.label}>Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className={ui.input}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className={ui.label}>Loại yêu cầu</label>
                <select
                  className={ui.input}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {REQUEST_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className={ui.label}>Mức độ ưu tiên</label>
                <select
                  className={ui.input}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className={ui.label}>Tiêu đề <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Ví dụ: Lỗi không nhận được credits sau thanh toán"
                className={ui.input}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className={ui.label}>Nội dung chi tiết <span className="text-red-500">*</span></label>
              <textarea
                rows={5}
                placeholder="Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải..."
                className={cn(ui.input, "resize-none")}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className={ui.label}>Mã đơn hàng hoặc API key prefix (nếu có)</label>
              <input
                type="text"
                placeholder="Ví dụ: TZO-123456 hoặc tzo_live_..."
                className={ui.input}
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <AppButton
                type="submit"
                isLoading={isSubmitting}
                variant="accent"
                className="w-full py-6 text-base"
              >
                <Send className="h-5 w-5 mr-2" />
                Gửi yêu cầu hỗ trợ
              </AppButton>
            </div>
          </form>

          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between border-t border-[#edf1ee] pt-10">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#8a9690]" />
                <h2 className={ui.h3}>Lịch sử yêu cầu</h2>
              </div>
            </div>

            {isLoadingTickets ? (
              <div className="py-10 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /></div>
            ) : tickets.length === 0 ? (
              <p className={cn(ui.pMuted, "py-10 text-center italic")}>Bạn chưa gửi yêu cầu hỗ trợ nào.</p>
            ) : (
              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-[#edf1ee] bg-[#fbfbf8] p-5 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <StatusBadge 
                            status={getStatusLabel(ticket.status).text} 
                            variant={ticket.status === "RESOLVED" ? "success" : ticket.status === "CLOSED" ? "neutral" : ticket.status === "IN_PROGRESS" ? "warning" : "info"} 
                          />
                          <span className={ui.label}>
                            {ticket.category} · {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <h3 className={cn(ui.h3, "text-base")}>{ticket.subject}</h3>
                        <p className={cn(ui.pMuted, "mt-2 line-clamp-2 leading-relaxed")}>
                          {ticket.message}
                        </p>
                        {ticket.adminNotes && (
                          <div className="mt-4 rounded-xl bg-[#e7fff7] p-3 border border-[#00d4a4]/20">
                            <p className={cn(ui.label, "text-[#00d4a4] mb-1")}>Phản hồi từ Admin:</p>
                            <p className="text-xs font-bold text-[#020c0a]">{ticket.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AppCard>

        <aside className="space-y-6">
          <AppCard className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#00d4a4]" />
              <h3 className={ui.h3}>Liên hệ nhanh</h3>
            </div>

            <div className="space-y-4">
              {CONTACT_CHANNELS.map((channel) => (
                <a
                  key={channel.name}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-[#edf1ee] bg-[#fbfbf8] p-4 transition-all hover:border-[#00d4a4]/40 hover:bg-white hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#edf1ee] transition-all group-hover:ring-[#00d4a4]/20">
                    <channel.icon className="h-5 w-5 text-[#8a9690] group-hover:text-[#00d4a4]" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={cn(ui.label, "group-hover:text-[#00d4a4]")}>
                      {channel.name}
                    </p>
                    <p className="truncate text-sm font-black text-[#0b0f0d]">
                      {channel.value}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-[#dfe5e1] group-hover:text-[#00d4a4]" />
                </a>
              ))}

              <div className="flex items-center gap-3 rounded-2xl bg-[#020c0a] p-4 text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Clock className="h-5 w-5 text-[#00d4a4]" />
                </div>
                <div>
                  <p className={cn(ui.label, "text-white/50")}>
                    Thời gian phản hồi
                  </p>
                  <p className="text-sm font-black text-[#00d4a4]">
                    Thường dưới 15 phút
                  </p>
                </div>
              </div>
            </div>
          </AppCard>

          <AppCard className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-[#00d4a4]" />
              <h3 className={ui.h3}>Câu hỏi thường gặp</h3>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-[#00d4a4]" />
                    <p className="text-sm font-black text-[#0b0f0d]">
                      {faq.question}
                    </p>
                  </div>
                  <p className={cn(ui.pMuted, "ml-5 leading-relaxed")}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
            
            <AppButton variant="secondary" className="mt-6 w-full text-xs" size="sm">
              Xem thêm câu hỏi
            </AppButton>
          </AppCard>
        </aside>
      </div>

      {/* Toast */}
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
