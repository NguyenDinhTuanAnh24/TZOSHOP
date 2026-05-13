import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/server/email";
import {
  createPaymentSuccessEmail,
  createPaymentSuccessEmailText,
} from "@/lib/server/email-templates/payment-success-email";

/**
 * Hàm cấp gói credits khi thanh toán đơn hàng thành công.
 * Xử lý trong transaction để đảm bảo tính nhất quán dữ liệu.
 */
export async function completeOrderPayment(orderId: string) {
  const now = new Date();

  // 1. Lấy thông tin đơn hàng và sản phẩm
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      product: true,
      user: {
        select: {
          email: true,
          name: true,
        }
      }
    }
  });

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng.");
  }

  // 2. Kiểm tra nếu đơn hàng đã được xử lý (idempotency)
  if (order.status === "PAID") {
    // Find existing bucket via ledger
    const ledger = await prisma.creditLedger.findFirst({
      where: { referenceId: order.id, type: "PURCHASE" }
    });
    
    return { 
      order, 
      creditBucketId: ledger?.creditBucketId || null 
    };
  }

  // 3. Tính toán ngày hết hạn
  const expiresAt = (order.product.durationDays && order.product.durationDays > 0)
    ? new Date(now.getTime() + order.product.durationDays * 24 * 60 * 60 * 1000)
    : null;

  // 4. Thực hiện transaction
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Cập nhật trạng thái đơn hàng
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: now,
      },
    });

    // Tạo gói credits (CreditBucket) cho người dùng
    const creditBucket = await tx.creditBucket.create({
      data: {
        userId: order.userId,
        productId: order.productId,
        apiFamily: order.product.apiFamily,
        creditsTotal: order.product.credits,
        creditsRemaining: order.product.credits,
        apiKeyLimit: order.product.apiKeyLimit,
        allowedModels: order.product.allowedModels,
        allowedReasoning: order.product.allowedReasoning,
        startsAt: now,
        expiresAt: expiresAt,
        isActive: true,
      },
    });

    // Ghi nhận biến động số dư (CreditLedger)
    await tx.creditLedger.create({
      data: {
        userId: order.userId,
        creditBucketId: creditBucket.id,
        apiFamily: order.product.apiFamily,
        type: "PURCHASE",
        amount: order.product.credits,
        balanceAfter: order.product.credits, // Giả định đây là gói mới hoàn toàn
        reason: `Mua gói ${order.product.name} (Đơn: ${order.orderCode})`,
        referenceId: order.id,
      },
    });

    // Xử lý Coupon Redemption nếu có
    if (order.couponId) {
      await tx.couponRedemption.create({
        data: {
          couponId: order.couponId,
          userId: order.userId,
          orderId: order.id,
          originalAmount: order.originalAmount || order.product.priceVnd,
          discountAmount: order.discountAmount,
          finalAmount: order.amountVnd,
        },
      });

      // Cập nhật usedAt trong Assignment nếu là mã được cấp riêng
      await tx.couponAssignment.updateMany({
        where: {
          couponId: order.couponId,
          userId: order.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });
    }

    return {
      order: updatedOrder,
      creditBucketId: creditBucket.id
    };
  });

  // 5. Gửi email thông báo (ngoài transaction để không block DB)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";
    const amountStr = `${new Intl.NumberFormat("vi-VN").format(order.amountVnd)}đ`;
    const creditsStr = new Intl.NumberFormat("vi-VN").format(Number(order.product.credits));

    await sendEmail({
      to: order.user.email,
      subject: "Thanh toán thành công - TzoShop",
      html: createPaymentSuccessEmail({
        name: order.user.name,
        orderCode: order.orderCode,
        productName: order.product.name,
        amount: amountStr,
        credits: creditsStr,
        duration: expiresAt ? `${order.product.durationDays} ngày` : "Dùng đến khi hết credits",
        dashboardUrl: `${appUrl}/my-plans`,
        apiKeys: String(order.product.apiKeyLimit),
        paidAt: now.toLocaleString("vi-VN"),
      }),
      text: createPaymentSuccessEmailText({
        name: order.user.name,
        orderCode: order.orderCode,
        productName: order.product.name,
        amount: amountStr,
        credits: creditsStr,
        duration: expiresAt ? `${order.product.durationDays} ngày` : "Dùng đến khi hết credits",
        dashboardUrl: `${appUrl}/my-plans`,
        apiKeys: String(order.product.apiKeyLimit),
        paidAt: now.toLocaleString("vi-VN"),
      }),
    });
  } catch (emailError) {
    console.error("[completeOrderPayment] Failed to send success email:", emailError);
    // Không throw error ở đây vì thanh toán đã xong trong DB
  }

  // 6. Gửi thông báo tới User & Admin
  try {
    const { createNotificationOnce, notifyAdmins } = await import("@/lib/server/notifications");
    
    // Cho User
    await createNotificationOnce({
      userId: order.userId,
      type: "PAYMENT_SUCCESS",
      title: "Thanh toán thành công",
      message: `Gói ${order.product.name} đã được kích hoạt với ${new Intl.NumberFormat("vi-VN").format(Number(order.product.credits))} credits.`,
      href: "/my-plans",
      dedupeKey: `order-paid-user:${order.id}`,
      metadata: { orderId: order.id, productId: order.productId }
    });

    // Cho Admin
    await notifyAdmins({
      type: "SUCCESS",
      title: "Đơn hàng đã thanh toán",
      message: `${order.user.email} vừa thanh toán đơn ${order.orderCode} - ${new Intl.NumberFormat("vi-VN").format(order.amountVnd)}đ.`,
      href: `/admin/orders?status=PAID`,
      dedupeKey: `order-paid-admin:${order.id}`,
      metadata: { orderId: order.id }
    });
  } catch (notifError) {
    console.error("[completeOrderPayment] Failed to create notifications:", notifError);
  }

  return result;
}

