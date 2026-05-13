import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { sendEmail } from "@/lib/server/email";
import {
  createOrderPendingEmail,
  createOrderPendingEmailText,
} from "@/lib/server/email-templates/order-pending-email";

export const runtime = "nodejs";

function createOrderCode() {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            apiFamily: true,
            tier: true,
            credits: true,
            durationDays: true,
            priceVnd: true,
            apiKeyLimit: true,
            allowedModels: true,
          },
        },
      },
    });

    type OrderItem = (typeof orders)[number];

    const data = orders.map((order: OrderItem) => ({
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      amountVnd: order.amountVnd,
      paidAt: order.paidAt,
      cancelledAt: order.cancelledAt,
      expiredAt: order.expiredAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      product: {
        ...order.product,
        credits: order.product.credits.toString(),
      },
    }));

    return NextResponse.json({
      data,
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
    console.error("GET /api/orders failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể tải danh sách đơn hàng.",
        },
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();

    const body = await request.json();

    const productId = body?.productId;
    const couponCode = body?.couponCode;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        {
          error: {
            message: "Thiếu productId.",
          },
        },
        {
          status: 400,
        },
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: {
            message: "Gói credits không tồn tại hoặc đã bị tắt.",
          },
        },
        {
          status: 404,
        },
      );
    }

    if (product.priceVnd === 0) {
      return NextResponse.json(
        {
          error: {
            message: "Gói này cần liên hệ tư vấn, chưa thể tạo đơn tự động.",
          },
        },
        {
          status: 400,
        },
      );
    }

    const originalAmount = product.priceVnd;
    let discountAmount = 0;
    let finalAmount = product.priceVnd;
    let couponId: string | undefined = undefined;
    let validCouponCode: string | undefined = undefined;

    if (couponCode) {
      const { validateCouponForUser } = await import("@/lib/server/coupons");
      const validation = await validateCouponForUser({
        code: couponCode,
        userId: user.id,
        originalAmount: product.priceVnd,
      });

      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: {
              message: validation.message,
            },
          },
          {
            status: 400,
          },
        );
      }

      discountAmount = validation.discountAmount;
      finalAmount = validation.finalAmount;
      couponId = validation.coupon?.id;
      validCouponCode = validation.coupon?.code;
    }

    const isFreeOrder = finalAmount === 0;

    const order = await prisma.order.create({
      data: {
        orderCode: createOrderCode(),
        userId: user.id,
        productId: product.id,
        originalAmount,
        discountAmount,
        amountVnd: finalAmount,
        couponId,
        couponCode: validCouponCode,
        status: "PENDING",
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            apiFamily: true,
            tier: true,
            credits: true,
            durationDays: true,
            priceVnd: true,
            apiKeyLimit: true,
            allowedModels: true,
          },
        },
      },
    });

    let creditBucketId: string | null = null;

    // Nếu là đơn hàng miễn phí, hoàn tất kích hoạt ngay
    if (isFreeOrder) {
      const { completeOrderPayment } = await import("@/lib/server/orders/complete-order-payment");
      const activation = await completeOrderPayment(order.id);
      creditBucketId = activation.creditBucketId;
    }

    // Tạo thông báo cho admin & user
    const { notifyAdmins, createNotificationOnce } = await import("@/lib/server/notifications");
    
    await notifyAdmins({
      type: "ORDER_CREATED",
      title: "Có đơn hàng mới",
      message: `${user.email} vừa tạo đơn ${order.orderCode}.`,
      href: "/admin/orders",
      dedupeKey: `order-created-admin:${order.id}`,
      metadata: { orderId: order.id }
    });

    await createNotificationOnce({
      userId: user.id,
      type: "ORDER_CREATED",
      title: "Đơn hàng đã được tạo",
      message: `Đơn hàng ${order.orderCode} của bạn đang chờ thanh toán.`,
      href: "/billing",
      dedupeKey: `order-created-user:${order.id}`,
      metadata: { orderId: order.id }
    });

    if (!isFreeOrder && user.email) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";
        const amountStr = `${new Intl.NumberFormat("vi-VN").format(order.amountVnd)}đ`;
        await sendEmail({
          to: user.email,
          subject: "Đơn hàng đang chờ thanh toán - TzoShop",
          html: createOrderPendingEmail({
            name: user.name,
            orderCode: order.orderCode,
            productName: order.product.name,
            amount: amountStr,
            paymentUrl: `${appUrl}/billing`,
          }),
          text: createOrderPendingEmailText({
            name: user.name,
            orderCode: order.orderCode,
            productName: order.product.name,
            amount: amountStr,
            paymentUrl: `${appUrl}/billing`,
          }),
        });
      } catch (emailError) {
        console.error("[POST /api/orders] Failed to send pending email:", emailError);
      }
    }

    return NextResponse.json(
      {
        data: {
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          amountVnd: order.amountVnd,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
          freeOrder: isFreeOrder,
          creditBucketId: creditBucketId,
          product: {
            ...order.product,
            credits: order.product.credits.toString(),
          },
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }
    console.error("POST /api/orders failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể tạo đơn hàng.",
        },
      },
      {
        status: 500,
      },
    );
  }
}
