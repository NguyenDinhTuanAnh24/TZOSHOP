import { buildBaseEmail, escapeHtml, renderTextEmail } from "./base-email";

type SupportTicketEmailProps = {
  name?: string | null;
  email?: string | null;
  ticketCode?: string;
  subject: string;
  category: string;
  priority?: string;
  orderCode?: string | null;
  apiKeyPrefix?: string | null;
  supportUrl: string;
};

export function createSupportTicketEmail(props: SupportTicketEmailProps) {
  return buildBaseEmail({
    title: "Đã nhận yêu cầu hỗ trợ",
    preview: "TzoShop sẽ kiểm tra và phản hồi trong thời gian sớm nhất.",
    children: `
      <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#0f172a;">Đã nhận yêu cầu hỗ trợ</h1>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, chúng tôi đã nhận yêu cầu hỗ trợ của bạn.</p>

      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
        <p style="margin:0;font-size:14px;color:#475569;">Mã yêu cầu: <strong>${escapeHtml(props.ticketCode || "Đang xử lý")}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Email: <strong>${escapeHtml(props.email || "")}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Loại: <strong>${escapeHtml(props.category)}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Ưu tiên: <strong>${escapeHtml(props.priority || "Bình thường")}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Tiêu đề: <strong>${escapeHtml(props.subject)}</strong></p>
        ${props.orderCode ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Mã đơn hàng: <strong>${escapeHtml(props.orderCode)}</strong></p>` : ""}
        ${props.apiKeyPrefix ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">API key: <strong>${escapeHtml(props.apiKeyPrefix)}</strong></p>` : ""}
      </div>

      <div style="margin:28px 0;">
        <a href="${escapeHtml(props.supportUrl)}" style="display:inline-block;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:14px 22px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Xem trang hỗ trợ</a>
      </div>
    `,
  });
}

export function createSupportTicketEmailText(props: SupportTicketEmailProps) {
  return renderTextEmail([
    "ĐÃ NHẬN YÊU CẦU HỖ TRỢ - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, chúng tôi đã nhận yêu cầu hỗ trợ của bạn.`,
    `Mã yêu cầu: ${props.ticketCode || "Đang xử lý"}`,
    `Email: ${props.email || ""}`,
    `Loại: ${props.category}`,
    `Ưu tiên: ${props.priority || "Bình thường"}`,
    `Tiêu đề: ${props.subject}`,
    props.orderCode ? `Mã đơn hàng: ${props.orderCode}` : "",
    props.apiKeyPrefix ? `API key: ${props.apiKeyPrefix}` : "",
    `Trang hỗ trợ: ${props.supportUrl}`,
  ]);
}
