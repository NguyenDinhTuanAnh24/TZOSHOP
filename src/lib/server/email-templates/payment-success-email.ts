import { escapeHtml, renderTextEmail, renderTzoShopEmail } from "./base-email";

type PaymentSuccessEmailProps = {
  name?: string | null;
  orderCode: string;
  productName: string;
  amount: string;
  credits: string;
  duration: string;
  dashboardUrl: string;
  apiKeys?: string;
  paidAt?: string;
};

export function createPaymentSuccessEmail(props: PaymentSuccessEmailProps) {
  const {
    name,
    orderCode,
    productName,
    amount,
    credits,
    duration,
    dashboardUrl,
    apiKeys,
    paidAt,
  } = props;

  return renderTzoShopEmail({
    title: "THANH TOÁN THÀNH CÔNG",
    subtitle: "Gói credits của bạn đã được kích hoạt.",
    previewText: `Thanh toán thành công đơn ${orderCode}`,
    content: `
      <p style="margin:0 0 14px 0;">Xin chào <strong>${escapeHtml(name?.trim() || "bạn")}</strong>, cảm ơn bạn đã thanh toán tại TzoShop.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:3px solid #000000;background:#FFFDF5;box-shadow:4px 4px 0 #000000;padding:12px;">
        <tr><td style="padding:6px 0;font-size:14px;">Mã đơn hàng</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(orderCode)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Tên gói</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(productName)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Số credits</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(credits)}</td></tr>
        ${apiKeys ? `<tr><td style="padding:6px 0;font-size:14px;">Số API keys</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(apiKeys)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;font-size:14px;">Thời hạn</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(duration)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Số tiền</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(amount)}</td></tr>
        ${paidAt ? `<tr><td style="padding:6px 0;font-size:14px;">Thời gian thanh toán</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(paidAt)}</td></tr>` : ""}
      </table>
    `,
    actionLabel: "XEM GÓI CỦA TÔI",
    actionUrl: dashboardUrl,
    footerNote: "Nếu credits chưa hiển thị sau vài phút, vui lòng liên hệ hỗ trợ kèm mã đơn hàng.",
  });
}

export function createPaymentSuccessEmailText(props: PaymentSuccessEmailProps) {
  const { name, orderCode, productName, amount, credits, duration, dashboardUrl, apiKeys, paidAt } = props;

  return renderTextEmail([
    "THANH TOÁN THÀNH CÔNG - TzoShop",
    `Xin chào ${name?.trim() || "bạn"}. Gói credits của bạn đã được kích hoạt.`,
    `Mã đơn hàng: ${orderCode}`,
    `Tên gói: ${productName}`,
    `Số credits: ${credits}`,
    apiKeys ? `Số API keys: ${apiKeys}` : "",
    `Thời hạn: ${duration}`,
    `Số tiền: ${amount}`,
    paidAt ? `Thời gian thanh toán: ${paidAt}` : "",
    `Xem gói của tôi: ${dashboardUrl}`,
    "Hỗ trợ: support@tzoshop.io.vn | Zalo: 0866555468 | Telegram: @tzora24",
  ]);
}


