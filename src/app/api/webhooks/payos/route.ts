import { NextRequest, NextResponse } from "next/server";
import { getPayOSClient } from "@/lib/server/payos";
import { prisma } from "@/lib/prisma";
import { completeOrderPayment } from "@/lib/server/orders/complete-order-payment";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Xác thực webhook từ PayOS
    const payos = getPayOSClient();
    // @ts-expect-error payos client typing is incomplete
    const webhookData = payos.verifyPaymentWebhookData(body);

    if (!webhookData) {
      return NextResponse.json({ success: false, message: "Sai chữ ký." }, { status: 400 });
    }

    // 2. Lấy orderCode (numeric)
    const { orderCode } = webhookData;

    // 3. Tìm đơn hàng
    const order = await prisma.order.findUnique({
      where: { payosOrderCode: BigInt(orderCode) }
    });

    if (!order) {
      console.warn(`[Webhook] Không tìm thấy đơn hàng cho payosOrderCode: ${orderCode}`);
      return NextResponse.json({ success: false, message: "Không tìm thấy đơn hàng." }, { status: 404 });
    }

    // 4. Nếu đơn hàng đã PAID, trả về thành công ngay
    if (order.status === "PAID") {
      return NextResponse.json({ success: true });
    }

    // 5. Nếu thanh toán thành công
    // Theo tài liệu PayOS, desc/code xác định kết quả. Thường code là "00"
    if (webhookData.code === "00") {
      await completeOrderPayment(order.id);
      console.log(`[Webhook] Đã xác nhận thanh toán cho đơn hàng ${order.orderCode}`);
      
      // Tạo thông báo cho admin
      const { createAdminNotification } = await import("@/lib/server/notifications");
      await createAdminNotification({
        type: "ORDER_PAID",
        title: "Thanh toán thành công",
        message: `Đơn ${order.orderCode} đã được thanh toán.`,
        href: "/admin/orders"
      });
    } else {
      console.log(`[Webhook] Thanh toán đơn hàng ${order.orderCode} không thành công (Code: ${webhookData.code})`);
      // Cập nhật trạng thái nếu cần
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("PayOS Webhook Error:", error);
    // Trả về 200 để PayOS dừng retry trừ khi có lỗi hạ tầng thực sự
    return NextResponse.json({ success: false, message: "Lỗi xử lý." }, { status: 200 });
  }
}
