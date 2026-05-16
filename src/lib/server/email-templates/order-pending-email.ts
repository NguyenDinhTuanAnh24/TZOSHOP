import { buildBaseEmail, escapeHtml, renderTextEmail } from "./base-email";

type OrderPendingEmailProps = {
  name?: string | null;
  orderCode: string;
  productName: string;
  amount: string;
  paymentDeadline?: string | null;
  paymentUrl: string;
};

export function createOrderPendingEmail(props: OrderPendingEmailProps) {
  return buildBaseEmail({
    title: "Đơn hàng chờ thanh toán",
    preview: "Vui lòng hoàn tất thanh toán để kích hoạt gói credits.",
    children: `
      <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#0f172a;">Đơn hàng chờ thanh toán</h1>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, đơn hàng của bạn đã được tạo.</p>

      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
        <p style="margin:0;font-size:14px;color:#475569;">Mã đơn: <strong>${escapeHtml(props.orderCode)}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Tên gói: <strong>${escapeHtml(props.productName)}</strong></p>
        <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Số tiền: <strong>${escapeHtml(props.amount)}</strong></p>
        ${props.paymentDeadline ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Hạn thanh toán: <strong>${escapeHtml(props.paymentDeadline)}</strong></p>` : ""}
      </div>

      <div style="margin:28px 0;">
        <a href="${escapeHtml(props.paymentUrl)}" style="display:inline-block;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:14px 22px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Tiếp tục thanh toán</a>
      </div>
    `,
  });
}

export function createOrderPendingEmailText(props: OrderPendingEmailProps) {
  return renderTextEmail([
    "ĐƠN HÀNG CHỜ THANH TOÁN - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, vui lòng hoàn tất thanh toán cho đơn hàng của bạn.`,
    `Mã đơn: ${props.orderCode}`,
    `Tên gói: ${props.productName}`,
    `Số tiền: ${props.amount}`,
    props.paymentDeadline ? `Hạn thanh toán: ${props.paymentDeadline}` : "",
    `Thanh toán: ${props.paymentUrl}`,
  ]);
}
