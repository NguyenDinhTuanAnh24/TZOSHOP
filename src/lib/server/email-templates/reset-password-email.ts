import { escapeHtml, renderTextEmail, renderTzoShopEmail } from "./base-email";

type ResetPasswordEmailProps = {
  name?: string | null;
  resetUrl: string;
};

export function createResetPasswordEmail({ name, resetUrl }: ResetPasswordEmailProps) {
  const displayName = escapeHtml(name?.trim() || "bạn");
  const safeResetUrl = escapeHtml(resetUrl);

  return renderTzoShopEmail({
    title: "ĐẶT LẠI MẬT KHẨU",
    subtitle: "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản TzoShop.",
    previewText: "Đặt lại mật khẩu TzoShop",
    content: `
      <p style="margin:0 0 14px 0;">Xin chào <strong>${displayName}</strong>, nhấn nút bên dưới để tạo mật khẩu mới cho tài khoản của bạn.</p>
      <p style="margin:0;">Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
      <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;">Nếu nút không hoạt động, hãy sao chép đường dẫn sau:</p>
      <p style="margin:8px 0 0 0;word-break:break-all;font-size:13px;line-height:1.6;color:#000000;">${safeResetUrl}</p>
    `,
    actionLabel: "ĐẶT LẠI MẬT KHẨU",
    actionUrl: resetUrl,
    footerNote:
      "Đường dẫn đặt lại mật khẩu chỉ nên được sử dụng bởi chính bạn. Không chia sẻ email này cho người khác.",
  });
}

export function createResetPasswordEmailText({ name, resetUrl }: ResetPasswordEmailProps) {
  return renderTextEmail([
    "ĐẶT LẠI MẬT KHẨU TzoShop",
    `Xin chào ${name?.trim() || "bạn"}, bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản TzoShop.`,
    "Mở đường dẫn sau để tạo mật khẩu mới:",
    resetUrl,
    "Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này.",
    "Hỗ trợ: support@tzoshop.io.vn | Zalo: 0866555468 | Telegram: @tzora24",
  ]);
}


