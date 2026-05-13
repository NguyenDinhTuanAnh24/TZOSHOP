import { escapeHtml, renderTextEmail, renderTzoShopEmail } from "./base-email";

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

  return renderTzoShopEmail({
    title: "CẬP NHẬT YÊU CẦU HỖ TRỢ",
    subtitle: "Yêu cầu hỗ trợ của bạn vừa có cập nhật mới.",
    previewText: `Ticket ${props.ticketId} đã được cập nhật`,
    content: `
      <p style="margin:0 0 14px 0;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, đội ngũ TzoShop đã cập nhật yêu cầu của bạn.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:3px solid #000000;background:#FFFDF5;box-shadow:4px 4px 0 #000000;padding:12px;">
        <tr><td style="padding:6px 0;font-size:14px;">Mã ticket</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.ticketId)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Tiêu đề</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.subject)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Trạng thái</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(statusLabel)}</td></tr>
      </table>
      ${props.adminNote ? `<p style="margin:14px 0 0 0;"><strong>Ghi chú:</strong> ${escapeHtml(props.adminNote)}</p>` : ""}
    `,
    actionLabel: "XEM TRANG HỖ TRỢ",
    actionUrl: props.supportUrl,
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
