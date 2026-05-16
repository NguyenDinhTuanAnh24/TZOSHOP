export type BaseEmailProps = {
  title: string;
  preview?: string;
  children: string;
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

export function buildBaseEmail({ title, preview, children }: BaseEmailProps) {
  const safeTitle = escapeHtml(title);
  const safePreview = escapeHtml(preview || title);

  return `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(79,70,229,0.12);">
            <tr>
              <td style="padding:28px 28px 16px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:44px;height:44px;border-radius:14px;background:#ecfdf5;text-align:center;vertical-align:middle;">
                      <span style="font-size:24px;font-weight:800;color:#059669;">Z</span>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="font-size:18px;font-weight:800;color:#0f172a;line-height:1.2;">TzoShop</div>
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.6px;color:#4f46e5;margin-top:2px;">AI Credits</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 28px 28px 28px;">
                ${children}
              </td>
            </tr>

            <tr>
              <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;line-height:20px;color:#64748b;">
                  Email này được gửi tự động từ TzoShop. Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email.
                </p>
                <p style="margin:10px 0 0 0;font-size:12px;line-height:20px;color:#94a3b8;">
                  © ${new Date().getFullYear()} TzoShop. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

export function renderTextEmail(parts: string[]) {
  return parts.filter(Boolean).join("\n\n").trim();
}

export const renderTzoShopEmail = ({
  title,
  previewText,
  content,
}: {
  title: string;
  subtitle?: string;
  previewText?: string;
  content: string;
  actionLabel?: string;
  actionUrl?: string;
  footerNote?: string;
}) => buildBaseEmail({ title, preview: previewText, children: content });
