import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayOSClient } from "@/lib/server/payos";
import { sendEmail } from "@/lib/server/email";
import {
  createOrderCancelledEmail,
  createOrderCancelledEmailText,
} from "@/lib/server/email-templates/order-cancelled-email";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Thiếu mã đơn hàng." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: {
          select: { name: true },
        },
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng." },
        { status: 404 }
      );
    }

    if (order.status === "PAID") {
      return NextResponse.json(
        { error: "Đơn hàng đã thanh toán, không thể hủy." },
        { status: 400 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({
        success: true,
        status: "CANCELLED",
      });
    }

    // Nếu chưa có mã thanh toán PayOS thì chỉ cần hủy đơn trong DB
    if (!order.payosOrderCode) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          payosStatus: "CANCELLED",
        },
      });

      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";
        await sendEmail({
          to: order.user.email,
          subject: "Đơn hàng đã bị hủy - TzoShop",
          html: createOrderCancelledEmail({
            name: order.user.name,
            orderCode: order.orderCode,
            productName: order.product?.name,
            reason: "Bạn đã hủy thanh toán.",
            billingUrl: `${appUrl}/billing`,
          }),
          text: createOrderCancelledEmailText({
            name: order.user.name,
            orderCode: order.orderCode,
            productName: order.product?.name,
            reason: "Bạn đã hủy thanh toán.",
            billingUrl: `${appUrl}/billing`,
          }),
        });
      } catch (emailError) {
        console.error("[payos/cancel] Failed to send cancelled email:", emailError);
      }

      return NextResponse.json({
        success: true,
        status: "CANCELLED",
      });
    }

    const payos = getPayOSClient();

    // Hủy link thanh toán trên PayOS
    const cancelledPayment = await payos.paymentRequests.cancel(
      Number(order.payosOrderCode),
      "User cancelled payment"
    );

    // Cập nhật trạng thái đơn hàng thành CANCELLED
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        payosStatus: "CANCELLED",
      },
    });

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";
      await sendEmail({
        to: order.user.email,
        subject: "Đơn hàng đã bị hủy - TzoShop",
        html: createOrderCancelledEmail({
          name: order.user.name,
          orderCode: order.orderCode,
          productName: order.product?.name,
          reason: "Bạn đã hủy thanh toán.",
          billingUrl: `${appUrl}/billing`,
        }),
        text: createOrderCancelledEmailText({
          name: order.user.name,
          orderCode: order.orderCode,
          productName: order.product?.name,
          reason: "Bạn đã hủy thanh toán.",
          billingUrl: `${appUrl}/billing`,
        }),
      });
    } catch (emailError) {
      console.error("[payos/cancel] Failed to send cancelled email:", emailError);
    }

    // Thông báo cho user & admin
    try {
      const { createNotificationOnce, notifyAdmins } = await import("@/lib/server/notifications");
      
      await createNotificationOnce({
        userId: order.userId,
        type: "ORDER_CANCELLED",
        title: "Đơn hàng đã hủy",
        message: `Đơn hàng ${order.orderCode} đã được hủy theo yêu cầu.`,
        href: "/billing",
        dedupeKey: `order-cancelled-user:${order.id}`,
        metadata: { orderId: order.id }
      });

      await notifyAdmins({
        type: "WARNING",
        title: "Đơn hàng bị hủy",
        message: `Đơn hàng ${order.orderCode} đã bị hủy bởi người dùng.`,
        href: "/admin/orders?status=CANCELLED",
        dedupeKey: `order-cancelled-admin:${order.id}`,
        metadata: { orderId: order.id }
      });
    } catch (e) {
      console.error("Order cancel notification failed:", e);
    }

    return NextResponse.json({
      success: true,
      status: cancelledPayment.status ?? "CANCELLED",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }
    console.error("PayOS Cancel Error:", error);

    return NextResponse.json(
      { error: "Không thể hủy thanh toán." },
      { status: 500 }
    );
  }
}
