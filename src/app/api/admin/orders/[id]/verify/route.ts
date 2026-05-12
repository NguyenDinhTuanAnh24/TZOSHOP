import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { getPayOSInstance } from "@/lib/payos";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true }
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Không tìm thấy đơn hàng." }, { status: 404 });
    }

    if (!order.payosOrderCode) {
      return NextResponse.json({ success: false, message: "Đơn hàng không có mã PayOS." }, { status: 400 });
    }

    const payos = await getPayOSInstance();
    // @ts-expect-error getPaymentLinkInformation may not be typed correctly
    const payosOrder = await payos.getPaymentLinkInformation(Number(order.payosOrderCode));

    if (!payosOrder) {
       return NextResponse.json({ success: false, message: "Không lấy được thông tin từ PayOS." }, { status: 500 });
    }

    // Nếu PayOS báo đã trả tiền, cập nhật DB
    if (payosOrder.status === "PAID" && order.status !== "PAID") {
      // Logic kích hoạt credits... (giả định có service xử lý)
      // Ở đây ta chỉ cập nhật status đơn hàng
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: "PAID",
          paidAt: new Date()
        }
      });

      const { createAuditLog } = await import("@/lib/server/audit-log");
      await createAuditLog({
        action: "VERIFY_PAYMENT",
        entityType: "ORDER",
        entityId: order.id,
        metadata: { payosStatus: payosOrder.status, result: "SUCCESS_PAID" }
      });

      return NextResponse.json({ 
        success: true, 
        message: "Thanh toán đã được khớp thành công!",
        status: "PAID" 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Trạng thái PayOS: ${payosOrder.status}`,
      status: payosOrder.status 
    });

  } catch (error) {
    console.error("Order verification failed:", error);
    return NextResponse.json({ success: false, message: "Lỗi khi kiểm tra thanh toán." }, { status: 500 });
  }
}
