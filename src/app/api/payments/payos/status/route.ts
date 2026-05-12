import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayOSClient } from "@/lib/server/payos";
import { completeOrderPayment } from "@/lib/server/orders/complete-order-payment";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Thiếu mã đơn hàng." }, { status: 400 });
    }

    // 1. Lấy thông tin đơn hàng từ DB
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    }

    // 2. Nếu đơn hàng đã PAID trong DB, trả về ngay
    if (order.status === "PAID") {
      return NextResponse.json({
        success: true,
        status: "PAID",
        orderStatus: "PAID",
        amountPaid: order.amountVnd,
        amountRemaining: 0
      });
    }

    // 3. Nếu chưa có mã PayOS, coi như PENDING
    if (!order.payosOrderCode) {
      return NextResponse.json({
        success: true,
        status: "PENDING",
        orderStatus: order.status,
        amountPaid: 0,
        amountRemaining: order.amountVnd
      });
    }

    // 4. Gọi API PayOS để lấy trạng thái thực tế
    const payos = getPayOSClient();
    const payosData = await payos.paymentRequests.get(Number(order.payosOrderCode));

    // 5. Cập nhật DB dựa trên trạng thái từ PayOS
    const currentStatus = payosData.status; // PAID, PENDING, CANCELLED, EXPIRED
    let orderStatus: string = order.status;

    if (currentStatus === "PAID") {
      await completeOrderPayment(order.id);
      orderStatus = "PAID";
    } else if (currentStatus === "CANCELLED" || currentStatus === "EXPIRED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          payosStatus: currentStatus,
          // Có thể chuyển status order sang CANCELLED hoặc giữ PENDING để user thử lại
        }
      });
    }

    return NextResponse.json({
      success: true,
      status: currentStatus,
      orderStatus: orderStatus,
      amountPaid: payosData.amountPaid,
      amountRemaining: payosData.amountRemaining
    });

  } catch (error: unknown) {
    console.error("PayOS Status Check Error:", error);
    const message = error instanceof Error ? error.message : "Lỗi kiểm tra trạng thái.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
