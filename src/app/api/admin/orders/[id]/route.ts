import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requireAdminUser();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        product: true,
      },
    });

    // Only treat as not found when the record is truly missing.
    // Never use amount/price to determine existence.
    if (order == null) {
      return NextResponse.json(
        { success: false, error: { message: "Không tìm thấy đơn hàng." } },
        { status: 404 }
      );
    }

    const ledger = await prisma.creditLedger.findFirst({
      where: {
        referenceId: order.id,
        type: "PURCHASE",
      },
      include: {
        creditBucket: true,
      },
    });

    const data = {
      ...order,
      payosOrderCode: order.payosOrderCode?.toString(),
      creditBucket: ledger?.creditBucket
        ? {
            ...ledger.creditBucket,
            creditsTotal: ledger.creditBucket.creditsTotal.toString(),
            creditsRemaining: ledger.creditBucket.creditsRemaining.toString(),
          }
        : null,
    };

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "ADMIN_VIEW_ORDER_DETAIL",
      entityType: "ORDER",
      entityId: order.id,
      metadata: { orderCode: order.orderCode },
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(`GET /api/admin/orders/${id} failed:`, error);
    return NextResponse.json(
      { success: false, error: { message: "Lỗi hệ thống." } },
      { status: 500 }
    );
  }
}
