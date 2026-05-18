import { prisma } from "@/lib/prisma";

export async function completePaidOrder(orderId: string, paidAt: Date = new Date()) {
  // 1. Fetch order with product
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true }
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // 2. Check if already paid (idempotency)
  if (order.status === "PAID") {
    const existingBucket = await prisma.creditBucket.findFirst({
      where: { userId: order.userId, productId: order.productId }
    });
    if (existingBucket) {
      return { success: true, alreadyPaid: true, order };
    }
  }

  // 3. Process completion in transaction
  const expiresAt = (order.product.durationDays && order.product.durationDays > 0)
    ? new Date(paidAt.getTime() + order.product.durationDays * 24 * 60 * 60 * 1000)
    : null;

  const result = await prisma.$transaction(async (tx) => {
    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt,
      },
    });

    // Create credit bucket
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
        startsAt: paidAt,
        expiresAt: expiresAt,
        isActive: true,
      },
    });

    // Create credit ledger entry
    await tx.creditLedger.create({
      data: {
        userId: order.userId,
        creditBucketId: creditBucket.id,
        apiFamily: order.product.apiFamily,
        type: "PURCHASE",
        amount: order.product.credits,
        balanceAfter: order.product.credits, // This assumes new bucket start, simplified for now
        reason: `Thanh toán đơn ${order.orderCode}`,
        referenceId: order.id,
      },
    });

    return updatedOrder;
  });

  return { success: true, alreadyPaid: false, order: result };
}
