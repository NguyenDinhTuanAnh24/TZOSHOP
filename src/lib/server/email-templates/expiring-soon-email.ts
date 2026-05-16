import { buildBaseEmail, escapeHtml, renderTextEmail } from "./base-email";

type ExpiringSoonEmailProps = {
  name?: string | null;
  productName: string;
  expiresAt: string;
  daysRemaining: number;
  rechargeUrl: string;
};

export function createExpiringSoonEmail(props: ExpiringSoonEmailProps) {
  return buildBaseEmail({
    title: "Gói sắp hết hạn",
    preview: "Gói credits của bạn sắp hết hạn, hãy gia hạn để tránh gián đoạn.",
    children: `
      <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#0f172a;">Gói sắp hết hạn</h1>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, gói <strong>${escapeHtml(props.productName)}</strong> sẽ hết hạn sau <strong>${props.daysRemaining} ngày</strong>.</p>
      <p style="margin:12px 0 0 0;font-size:14px;line-height:24px;color:#64748b;">Ngày hết hạn: <strong>${escapeHtml(props.expiresAt)}</strong>.</p>

      <div style="margin:28px 0;">
        <a href="${escapeHtml(props.rechargeUrl)}" style="display:inline-block;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:14px 22px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Gia hạn gói</a>
      </div>
    `,
  });
}

export function createExpiringSoonEmailText(props: ExpiringSoonEmailProps) {
  return renderTextEmail([
    "GÓI SẮP HẾT HẠN - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, gói ${props.productName} sẽ hết hạn sau ${props.daysRemaining} ngày.`,
    `Ngày hết hạn: ${props.expiresAt}`,
    `Gia hạn gói: ${props.rechargeUrl}`,
  ]);
}
