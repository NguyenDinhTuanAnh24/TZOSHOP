import { buildBaseEmail, escapeHtml, renderTextEmail } from "./base-email";

type OrderCancelledEmailProps = {
  name?: string | null;
  orderCode: string;
  productName?: string;
  reason?: string;
  billingUrl: string;
};

export function createOrderCancelledEmail(props: OrderCancelledEmailProps) {
  return buildBaseEmail({
    title: "Đơn hàng đã bị hủy",
    preview: "Đơn hàng của bạn đã bị hủy hoặc hết hạn thanh toán.",
    children: `
      <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#0f172a;">Đơn hàng đã bị hủy</h1>
      <p style="margin:16px 0 0 0;font-size:15px;line-height:26px;color:#475569;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, đơn hàng của bạn đã chuyển sang trạng thái hủy.</p>

      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
        <p style="margin:0;font-size:14px;color:#475569;">Mã đơn: <strong>${escapeHtml(props.orderCode)}</strong></p>
        ${props.productName ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Tên gói: <strong>${escapeHtml(props.productName)}</strong></p>` : ""}
        ${props.reason ? `<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">Lý do: <strong>${escapeHtml(props.reason)}</strong></p>` : ""}
      </div>

      <div style="margin:28px 0;">
        <a href="${escapeHtml(props.billingUrl)}" style="display:inline-block;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:14px 22px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;">Xem lịch sử thanh toán</a>
      </div>
    `,
  });
}

export function createOrderCancelledEmailText(props: OrderCancelledEmailProps) {
  return renderTextEmail([
    "ĐƠN HÀNG ĐÃ BỊ HỦY - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, đơn hàng của bạn đã bị hủy hoặc hết hạn.`,
    `Mã đơn: ${props.orderCode}`,
    props.productName ? `Tên gói: ${props.productName}` : "",
    props.reason ? `Lý do: ${props.reason}` : "",
    `Xem lịch sử thanh toán: ${props.billingUrl}`,
  ]);
}
