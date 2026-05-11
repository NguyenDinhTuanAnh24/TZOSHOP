import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { CreditLedgerType } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await requireAdminUser();

    const { productId, credits, durationDays, note } = await request.json();

    if (!credits || credits <= 0) {
      return NextResponse.json(
        { success: false, message: "Số credits không hợp lệ." },
        { status: 400 }
      );
    }

    // Fetch product or use default
    let apiFamily: any = "CODEXAI";
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { apiFamily: true }
      });
      if (product) apiFamily = product.apiFamily;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create CreditBucket
      const bucket = await tx.creditBucket.create({
        data: {
          userId: id,
          productId: productId || null,
          apiFamily,
          creditsTotal: BigInt(credits),
          creditsRemaining: BigInt(credits),
          expiresAt,
          isActive: true
        }
      });

      // 2. Calculate balanceAfter (simple sum for this user and family)
      const currentBuckets = await tx.creditBucket.findMany({
        where: { userId: id, apiFamily, isActive: true },
        select: { creditsRemaining: true }
      });
      const balanceAfter = currentBuckets.reduce((sum, b) => sum + b.creditsRemaining, BigInt(0));

      // 3. Log to CreditLedger
      await (tx as any).creditLedger.create({
        data: {
          userId: id,
          amount: BigInt(credits),
          type: "ADMIN_GRANT" as CreditLedgerType,
          apiFamily,
          balanceAfter,
          referenceId: bucket.id,
          note: note || "Admin cấp credits thủ công"
        }
      });

      // 4. Create Notification
      await (tx as any).notification.create({
        data: {
          userId: id,
          title: "Bạn đã được cấp Credits!",
          message: `Hệ thống vừa cấp cho bạn ${new Intl.NumberFormat('vi-VN').format(credits)} credits. ${note ? `Lý do: ${note}` : ''}`,
          type: "SUCCESS"
        }
      });

      return bucket;
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "ADMIN_GRANT_CREDITS",
      entityType: "USER",
      entityId: id,
      metadata: { credits, bucketId: result.id, adminId: admin.id }
    });

    return NextResponse.json({
      success: true,
      message: "Đã cấp credits thành công."
    });

  } catch (error) {
    console.error(`POST /api/admin/users/${id}/grant-credits failed:`, error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống." },
      { status: 500 }
    );
  }
}
