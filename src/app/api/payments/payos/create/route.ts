import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getPayOSClient, getAppUrl } from "@/lib/server/payos";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Thiếu mã đơn hàng." }, { status: 400 });
    }

    // 1. Kiểm tra đơn hàng
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: user.id },
      include: { product: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Đơn hàng không ở trạng thái chờ thanh toán." }, { status: 400 });
    }

    if (order.amountVnd === 0) {
      return NextResponse.json({ error: "Đơn hàng miễn phí không cần thanh toán PayOS." }, { status: 400 });
    }

    // 2. Nếu đã có thanh toán PayOS và chưa hết hạn, trả về thông tin cũ
    if (order.payosOrderCode && order.payosCheckoutUrl) {
      const now = new Date();
      if (!order.paymentExpiredAt || order.paymentExpiredAt > now) {
        return NextResponse.json({
          success: true,
          orderId: order.id,
          orderCode: order.orderCode,
          payosOrderCode: order.payosOrderCode.toString(),
          amount: order.amountVnd,
          description: `TzoShop ${order.orderCode}`,
          qrCode: order.payosQrCode,
          checkoutUrl: order.payosCheckoutUrl,
          status: order.payosStatus || "PENDING"
        });
      }
    }

    // 3. Tạo thanh toán mới trên PayOS
    // PayOS orderCode phải là số nguyên (Int64). Chúng ta dùng timestamp.
    const payosOrderCode = Math.floor(Date.now() / 1000);
    const appUrl = getAppUrl();

    const paymentData = {
      orderCode: payosOrderCode,
      amount: order.amountVnd,
      description: `TzoShop ${order.orderCode}`.slice(0, 25), // PayOS giới hạn 25 ký tự
      items: [
        {
          name: order.product.name,
          quantity: 1,
          price: order.amountVnd,
        }
      ],
      returnUrl: `${appUrl}/billing?payment=success&orderId=${order.id}`,
      cancelUrl: `${appUrl}/billing?payment=cancel&orderId=${order.id}`,
    };

    const payos = getPayOSClient();
    const paymentLinkRes = await payos.paymentRequests.create(paymentData);

    // 4. Lưu thông tin vào Order
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        payosOrderCode: BigInt(payosOrderCode),
        payosPaymentLinkId: paymentLinkRes.paymentLinkId,
        payosCheckoutUrl: paymentLinkRes.checkoutUrl,
        payosQrCode: paymentLinkRes.qrCode,
        payosStatus: "PENDING",
        // Đặt thời gian hết hạn là 10 phút kể từ lúc tạo
        paymentExpiredAt: new Date(Date.now() + 10 * 60 * 1000) 
      }
    });

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      orderCode: updatedOrder.orderCode,
      payosOrderCode: payosOrderCode.toString(),
      amount: updatedOrder.amountVnd,
      description: paymentData.description,
      qrCode: updatedOrder.payosQrCode,
      checkoutUrl: updatedOrder.payosCheckoutUrl,
      status: updatedOrder.payosStatus
    });

  } catch (error: unknown) {
    console.error("PayOS Create Error:", error);
    const message = error instanceof Error ? error.message : "Lỗi tạo thanh toán.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
