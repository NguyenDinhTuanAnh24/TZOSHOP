export type TzoShopEmailLayoutParams = {
  title: string;
  subtitle?: string;
  previewText?: string;
  content: string;
  actionLabel?: string;
  actionUrl?: string;
  footerNote?: string;
};

export function escapeHtml(input: unknown) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";
}

export function renderTzoShopEmail({
  title,
  subtitle,
  previewText,
  content,
  actionLabel,
  actionUrl,
  footerNote,
}: TzoShopEmailLayoutParams) {
  const safeTitle = escapeHtml(title);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";
  const safePreview = escapeHtml(previewText || subtitle || title);

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#FFFDF5;color:#000000;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFFDF5;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFDF5;border:4px solid #000000;box-shadow:8px 8px 0 #000000;">
            <tr>
              <td style="padding:24px;border-bottom:4px solid #000000;">
                <div style="display:inline-block;background:#FFD93D;border:3px solid #000000;box-shadow:4px 4px 0 #000000;padding:10px 14px;font-weight:900;color:#000000;">TZOSHOP</div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 24px;">
                <h1 style="margin:0 0 10px 0;font-size:30px;line-height:1.1;font-weight:900;color:#000000;text-transform:uppercase;">${safeTitle}</h1>
                ${safeSubtitle ? `<p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;font-weight:700;color:#333333;">${safeSubtitle}</p>` : ""}

                <div style="font-size:15px;line-height:1.7;font-weight:700;color:#000000;">${content}</div>

                ${actionLabel && actionUrl ? `<div style="margin-top:28px;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#FFD93D;border:4px solid #000000;box-shadow:5px 5px 0 #000000;color:#000000;text-decoration:none;font-size:14px;font-weight:900;text-transform:uppercase;padding:14px 22px;">${escapeHtml(actionLabel)}</a></div>` : ""}

                ${footerNote ? `<div style="margin-top:28px;background:#C7F0D8;border:3px solid #000000;padding:14px;font-size:13px;line-height:1.6;font-weight:700;color:#000000;">${escapeHtml(footerNote)}</div>` : ""}
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px;border-top:4px solid #000000;background:#000000;color:#FFFDF5;">
                <p style="margin:0;font-size:13px;line-height:1.6;font-weight:700;color:#FFFDF5;">Cần hỗ trợ? Email: support@tzoshop.io.vn · Zalo: 0866555468 · Telegram: @tzora24</p>
                <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;color:#D6D6D6;">Email này được gửi tự động từ TzoShop. Vui lòng không chia sẻ mã, đường dẫn hoặc API key cho người khác.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderTextEmail(parts: string[]) {
  return parts.filter(Boolean).join("\n\n").trim();
}

