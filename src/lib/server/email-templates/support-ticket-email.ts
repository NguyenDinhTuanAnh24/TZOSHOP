import { escapeHtml, renderTextEmail, renderTzoShopEmail } from "./base-email";

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
  return renderTzoShopEmail({
    title: "ĐÃ NHẬN YÊU CẦU HỖ TRỢ",
    subtitle: "TzoShop sẽ kiểm tra và phản hồi trong thời gian sớm nhất.",
    previewText: "TzoShop đã nhận yêu cầu hỗ trợ của bạn",
    content: `
      <p style="margin:0 0 14px 0;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, chúng tôi đã nhận yêu cầu hỗ trợ của bạn.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:3px solid #000000;background:#FFFDF5;box-shadow:4px 4px 0 #000000;padding:12px;">
        <tr><td style="padding:6px 0;font-size:14px;">Mã yêu cầu</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.ticketCode || "Đang xử lý")}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Họ tên</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.name || "")}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Email</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;word-break:break-all;">${escapeHtml(props.email || "")}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Loại yêu cầu</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.category)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Mức độ ưu tiên</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.priority || "Bình thường")}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Tiêu đề</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.subject)}</td></tr>
        ${props.orderCode ? `<tr><td style="padding:6px 0;font-size:14px;">Mã đơn hàng</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.orderCode)}</td></tr>` : ""}
        ${props.apiKeyPrefix ? `<tr><td style="padding:6px 0;font-size:14px;">API key</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.apiKeyPrefix)}</td></tr>` : ""}
      </table>
    `,
    actionLabel: "XEM TRANG HỖ TRỢ",
    actionUrl: props.supportUrl,
    footerNote: "Thời gian phản hồi thường dưới 15 phút trong khung giờ hỗ trợ.",
  });
}

export function createSupportTicketEmailText(props: SupportTicketEmailProps) {
  return renderTextEmail([
    "ĐÃ NHẬN YÊU CẦU HỖ TRỢ - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, chúng tôi đã nhận yêu cầu hỗ trợ của bạn.`,
    `Mã yêu cầu: ${props.ticketCode || "Đang xử lý"}`,
    `Họ tên: ${props.name || ""}`,
    `Email: ${props.email || ""}`,
    `Loại yêu cầu: ${props.category}`,
    `Mức độ ưu tiên: ${props.priority || "Bình thường"}`,
    `Tiêu đề: ${props.subject}`,
    props.orderCode ? `Mã đơn hàng: ${props.orderCode}` : "",
    props.apiKeyPrefix ? `API key: ${props.apiKeyPrefix}` : "",
    `Xem trang hỗ trợ: ${props.supportUrl}`,
  ]);
}
