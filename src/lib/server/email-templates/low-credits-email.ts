import { buildBaseEmail, escapeHtml, renderTextEmail } from "./base-email";

type LowCreditsEmailProps = {
  name?: string | null;
  productName: string;
  creditsRemaining: string;
  threshold?: string;
  apiKeyRef?: string | null;
  rechargeUrl: string;
};

export function createLowCreditsEmail(props: LowCreditsEmailProps) {
  return buildBaseEmail({
    title: "Credits sắp hết",
    preview: "Gói credits của bạn đang gần hết, hãy nạp thêm để tránh gián đoạn.",
    children: `
      <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#0f172a;">Credits sắp hết</h1>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, số dư credits của bạn đang ở mức thấp.</p>

      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
        <p style="margin:0;font-size:14px;color:#475569;">Tên gói: <strong>${escapeHtml(props.productName)}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Credits còn lại: <strong>${escapeHtml(props.creditsRemaining)}</strong></p>
        ${props.threshold ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Ngưỡng cảnh báo: <strong>${escapeHtml(props.threshold)}</strong></p>` : ""}
        ${props.apiKeyRef ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">API key: <strong>${escapeHtml(props.apiKeyRef)}</strong></p>` : ""}
      </div>

      <div style="margin:28px 0;">
        <a href="${escapeHtml(props.rechargeUrl)}" style="display:inline-block;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:14px 22px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Mua thêm credits</a>
      </div>
    `,
  });
}

export function createLowCreditsEmailText(props: LowCreditsEmailProps) {
  return renderTextEmail([
    "CREDITS SẮP HẾT - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, số dư credits của bạn đang thấp.`,
    `Tên gói: ${props.productName}`,
    `Credits còn lại: ${props.creditsRemaining}`,
    props.threshold ? `Ngưỡng cảnh báo: ${props.threshold}` : "",
    props.apiKeyRef ? `API key: ${props.apiKeyRef}` : "",
    `Mua thêm credits: ${props.rechargeUrl}`,
  ]);
}
