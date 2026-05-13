import { escapeHtml, renderTextEmail, renderTzoShopEmail } from "./base-email";

type ExpiringSoonEmailProps = {
  name?: string | null;
  productName: string;
  expiresAt: string;
  daysRemaining: number;
  rechargeUrl: string;
};

export function createExpiringSoonEmail(props: ExpiringSoonEmailProps) {
  return renderTzoShopEmail({
    title: "GÓI SẮP HẾT HẠN",
    subtitle: "Gói credits của bạn sắp hết hạn, hãy gia hạn để tránh gián đoạn.",
    previewText: "Gói dịch vụ sắp hết hạn",
    content: `
      <p style="margin:0 0 14px 0;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, gói <strong>${escapeHtml(props.productName)}</strong> sẽ hết hạn sau <strong>${escapeHtml(props.daysRemaining)} ngày</strong>.</p>
      <p style="margin:0;">Ngày hết hạn: <strong>${escapeHtml(props.expiresAt)}</strong>.</p>
    `,
    actionLabel: "GIA HẠN GÓI",
    actionUrl: props.rechargeUrl,
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
