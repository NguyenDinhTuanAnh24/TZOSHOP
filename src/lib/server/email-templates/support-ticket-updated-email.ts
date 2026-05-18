import { buildBaseEmail, escapeHtml, renderTextEmail } from "./base-email";

type SupportTicketUpdatedEmailProps = {
  name?: string | null;
  ticketId: string;
  subject: string;
  status: string;
  adminNote?: string | null;
  supportUrl: string;
};

const statusMap: Record<string, string> = {
  OPEN: "Mở",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
};

export function createSupportTicketUpdatedEmail(props: SupportTicketUpdatedEmailProps) {
  const statusLabel = statusMap[props.status] || props.status;

  return buildBaseEmail({
    title: "Cập nhật yêu cầu hỗ trợ",
    preview: "Yêu cầu hỗ trợ của bạn vừa có cập nhật mới.",
    children: `
      <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#0f172a;">Cập nhật yêu cầu hỗ trợ</h1>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, đội ngũ TzoShop đã cập nhật ticket của bạn.</p>

      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
        <p style="margin:0;font-size:14px;color:#475569;">Mã ticket: <strong>${escapeHtml(props.ticketId)}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Tiêu đề: <strong>${escapeHtml(props.subject)}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Trạng thái: <strong>${escapeHtml(statusLabel)}</strong></p>
        ${props.adminNote ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Ghi chú: <strong>${escapeHtml(props.adminNote)}</strong></p>` : ""}
      </div>

      <div style="margin:28px 0;">
        <a href="${escapeHtml(props.supportUrl)}" style="display:inline-block;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:14px 22px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Xem chi tiết</a>
      </div>
    `,
  });
}

export function createSupportTicketUpdatedEmailText(props: SupportTicketUpdatedEmailProps) {
  const statusLabel = statusMap[props.status] || props.status;
  return renderTextEmail([
    "CẬP NHẬT YÊU CẦU HỖ TRỢ - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, ticket của bạn vừa được cập nhật.`,
    `Mã ticket: ${props.ticketId}`,
    `Tiêu đề: ${props.subject}`,
    `Trạng thái: ${statusLabel}`,
    props.adminNote ? `Ghi chú: ${props.adminNote}` : "",
    `Xem chi tiết: ${props.supportUrl}`,
  ]);
}
