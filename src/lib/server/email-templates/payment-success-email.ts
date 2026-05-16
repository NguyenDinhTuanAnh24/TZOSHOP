import { buildBaseEmail, escapeHtml, renderTextEmail } from "./base-email";

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
  const safeName = escapeHtml(props.name?.trim() || "bạn");
  const safeDashboardUrl = escapeHtml(props.dashboardUrl);

  return buildBaseEmail({
    title: "Thanh toán thành công",
    preview: "Gói credits của bạn đã được kích hoạt.",
    children: `
      <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#0f172a;">Thanh toán thành công</h1>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Xin chào <strong>${safeName}</strong>, gói <strong>${escapeHtml(props.productName)}</strong> đã được kích hoạt.</p>

      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
        <p style="margin:0;font-size:14px;color:#475569;">Mã đơn: <strong>${escapeHtml(props.orderCode)}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Credits: <strong>${escapeHtml(props.credits)}</strong></p>
        ${props.apiKeys ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">API Keys: <strong>${escapeHtml(props.apiKeys)}</strong></p>` : ""}
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Thời hạn: <strong>${escapeHtml(props.duration)}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Số tiền: <strong>${escapeHtml(props.amount)}</strong></p>
        ${props.paidAt ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Thanh toán lúc: <strong>${escapeHtml(props.paidAt)}</strong></p>` : ""}
      </div>

      <div style="margin:28px 0;">
        <a href="${safeDashboardUrl}" style="display:inline-block;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:14px 22px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Xem gói của tôi</a>
      </div>
    `,
  });
}

export function createPaymentSuccessEmailText(props: PaymentSuccessEmailProps) {
  return renderTextEmail([
    "THANH TOÁN THÀNH CÔNG - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, gói ${props.productName} đã được kích hoạt.`,
    `Mã đơn: ${props.orderCode}`,
    `Credits: ${props.credits}`,
    props.apiKeys ? `API Keys: ${props.apiKeys}` : "",
    `Thời hạn: ${props.duration}`,
    `Số tiền: ${props.amount}`,
    props.paidAt ? `Thanh toán lúc: ${props.paidAt}` : "",
    `Xem gói: ${props.dashboardUrl}`,
  ]);
}
