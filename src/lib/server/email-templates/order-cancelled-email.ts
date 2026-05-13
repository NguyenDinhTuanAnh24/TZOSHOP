import { escapeHtml, renderTextEmail, renderTzoShopEmail } from "./base-email";

type OrderCancelledEmailProps = {
  name?: string | null;
  orderCode: string;
  productName?: string;
  reason?: string;
  billingUrl: string;
};

export function createOrderCancelledEmail(props: OrderCancelledEmailProps) {
  return renderTzoShopEmail({
    title: "ĐƠN HÀNG ĐÃ BỊ HỦY",
    subtitle: "Đơn hàng của bạn đã bị hủy hoặc hết hạn thanh toán.",
    previewText: `Đơn ${props.orderCode} đã bị hủy`,
    content: `
      <p style="margin:0 0 14px 0;">Xin chào <strong>${escapeHtml(props.name?.trim() || "bạn")}</strong>, đơn hàng của bạn đã chuyển sang trạng thái hủy.</p>
      <p style="margin:0 0 8px 0;"><strong>Mã đơn hàng:</strong> ${escapeHtml(props.orderCode)}</p>
      ${props.productName ? `<p style="margin:0 0 8px 0;"><strong>Tên gói:</strong> ${escapeHtml(props.productName)}</p>` : ""}
      ${props.reason ? `<p style="margin:0;"><strong>Lý do:</strong> ${escapeHtml(props.reason)}</p>` : ""}
    `,
    actionLabel: "XEM LỊCH SỬ THANH TOÁN",
    actionUrl: props.billingUrl,
  });
}

export function createOrderCancelledEmailText(props: OrderCancelledEmailProps) {
  return renderTextEmail([
    "ĐƠN HÀNG ĐÃ BỊ HỦY - TzoShop",
    `Xin chào ${props.name?.trim() || "bạn"}, đơn hàng của bạn đã bị hủy hoặc hết hạn.`,
    `Mã đơn hàng: ${props.orderCode}`,
    props.productName ? `Tên gói: ${props.productName}` : "",
    props.reason ? `Lý do: ${props.reason}` : "",
    `Xem lịch sử thanh toán: ${props.billingUrl}`,
  ]);
}
