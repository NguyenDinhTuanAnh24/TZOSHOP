import { escapeHtml, renderTextEmail, renderTzoShopEmail } from "./base-email";

type LowCreditsEmailProps = {
  name?: string | null;
  productName: string;
  creditsRemaining: string;
  threshold?: string;
  apiKeyRef?: string | null;
  rechargeUrl: string;
};

export function createLowCreditsEmail(props: LowCreditsEmailProps) {
  return renderTzoShopEmail({
    title: "CREDITS SẮP HẾT",
    subtitle: "Gói credits của bạn đang gần hết, hãy nạp thêm để tránh gián đoạn.",
    previewText: "Credits TzoShop sắp hết",
    content: `
      <p style="margin:0 0 14px 0;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, số dư credits của gói đang ở mức thấp.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:3px solid #000000;background:#FFFDF5;box-shadow:4px 4px 0 #000000;padding:12px;">
        <tr><td style="padding:6px 0;font-size:14px;">Tên gói</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.productName)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Credits còn lại</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.creditsRemaining)}</td></tr>
        ${props.threshold ? `<tr><td style="padding:6px 0;font-size:14px;">Ngưỡng cảnh báo</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.threshold)}</td></tr>` : ""}
        ${props.apiKeyRef ? `<tr><td style="padding:6px 0;font-size:14px;">API key</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.apiKeyRef)}</td></tr>` : ""}
      </table>
    `,
    actionLabel: "MUA THÊM CREDITS",
    actionUrl: props.rechargeUrl,
    footerNote: "Bạn có thể bỏ qua email này nếu không còn nhu cầu sử dụng gói hiện tại.",
  });
}

export function createLowCreditsEmailText(props: LowCreditsEmailProps) {
  return renderTextEmail([
    "CREDITS SẮP HẾT - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, gói credits của bạn đang gần hết.`,
    `Tên gói: ${props.productName}`,
    `Credits còn lại: ${props.creditsRemaining}`,
    props.threshold ? `Ngưỡng cảnh báo: ${props.threshold}` : "",
    props.apiKeyRef ? `API key: ${props.apiKeyRef}` : "",
    `Mua thêm credits: ${props.rechargeUrl}`,
  ]);
}
