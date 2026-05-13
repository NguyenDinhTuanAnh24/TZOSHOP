import { escapeHtml, renderTextEmail, renderTzoShopEmail } from "./base-email";

type OrderPendingEmailProps = {
  name?: string | null;
  orderCode: string;
  productName: string;
  amount: string;
  paymentDeadline?: string | null;
  paymentUrl: string;
};

export function createOrderPendingEmail(props: OrderPendingEmailProps) {
  return renderTzoShopEmail({
    title: "ĐƠN HÀNG ĐANG CHỜ THANH TOÁN",
    subtitle: "Vui lòng hoàn tất thanh toán để kích hoạt gói credits.",
    previewText: `Đơn ${props.orderCode} đang chờ thanh toán`,
    content: `
      <p style="margin:0 0 14px 0;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, đơn hàng của bạn đã được tạo.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:3px solid #000000;background:#FFFDF5;box-shadow:4px 4px 0 #000000;padding:12px;">
        <tr><td style="padding:6px 0;font-size:14px;">Mã đơn hàng</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.orderCode)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Tên gói</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.productName)}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;">Số tiền</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.amount)}</td></tr>
        ${props.paymentDeadline ? `<tr><td style="padding:6px 0;font-size:14px;">Hạn thanh toán</td><td align="right" style="padding:6px 0;font-size:14px;font-weight:900;">${escapeHtml(props.paymentDeadline)}</td></tr>` : ""}
      </table>
    `,
    actionLabel: "TIẾP TỤC THANH TOÁN",
    actionUrl: props.paymentUrl,
    footerNote: "Nếu bạn đã thanh toán nhưng chưa thấy credits, hãy chờ vài phút hoặc liên hệ hỗ trợ.",
  });
}

export function createOrderPendingEmailText(props: OrderPendingEmailProps) {
  return renderTextEmail([
    "ĐƠN HÀNG ĐANG CHỜ THANH TOÁN - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, vui lòng hoàn tất thanh toán cho đơn hàng.`,
    `Mã đơn hàng: ${props.orderCode}`,
    `Tên gói: ${props.productName}`,
    `Số tiền: ${props.amount}`,
    props.paymentDeadline ? `Hạn thanh toán: ${props.paymentDeadline}` : "",
    `Tiếp tục thanh toán: ${props.paymentUrl}`,
  ]);
}
