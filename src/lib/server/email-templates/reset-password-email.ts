import { buildBaseEmail, escapeHtml, renderTextEmail } from "./base-email";

type ResetPasswordEmailProps = {
  name?: string | null;
  resetUrl: string;
};

export function createResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  const safeName = escapeHtml(name?.trim() || "bạn");
  const safeResetUrl = escapeHtml(resetUrl);

  return buildBaseEmail({
    title: "Đặt lại mật khẩu TzoShop",
    preview: "Liên kết đặt lại mật khẩu TzoShop của bạn.",
    children: `
      <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#0f172a;">Đặt lại mật khẩu</h1>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Xin chào <strong style="color:#0f172a;">${safeName}</strong>,</p>
      <p style="margin:12px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TzoShop của bạn. Bấm nút bên dưới để tạo mật khẩu mới.</p>

      <div style="margin:28px 0;">
        <a href="${safeResetUrl}" style="display:inline-block;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:14px 22px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Đặt lại mật khẩu</a>
      </div>

      <p style="margin:0;font-size:14px;line-height:24px;color:#64748b;">Liên kết này có hiệu lực trong <strong>30 phút</strong>.</p>

      <div style="margin-top:20px;padding:14px 16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
        <p style="margin:0;font-size:13px;line-height:22px;color:#64748b;">Nếu nút không hoạt động, hãy sao chép liên kết này và mở trong trình duyệt:</p>
        <p style="margin:8px 0 0 0;font-size:12px;line-height:20px;color:#4f46e5;word-break:break-all;">${safeResetUrl}</p>
      </div>
    `,
  });
}

export function createResetPasswordEmailText({ name, resetUrl }: ResetPasswordEmailProps) {
  return renderTextEmail([
    "ĐẶT LẠI MẬT KHẨU - TzoShop",
    `Xin chào ${name?.trim() || "bạn"}, chúng tôi đã nhận yêu cầu đặt lại mật khẩu cho tài khoản của bạn.`,
    "Mở liên kết sau để đặt lại mật khẩu (hiệu lực 30 phút):",
    resetUrl,
    "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.",
  ]);
}
