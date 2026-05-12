import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser();
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      discountPercent,
      minOrderAmount,
      maxDiscountVnd,
      startsAt,
      endsAt,
      isActive,
      usageLimitTotal,
      usageLimitPerUser,
      userIds
    } = body;

    const coupon = await prisma.$transaction(async (tx) => {
      const updatedCoupon = await tx.coupon.update({
        where: { id },
        data: {
          name,
          description,
          discountPercent,
          minOrderAmount,
          maxDiscountVnd: maxDiscountVnd || null,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
          isActive,
          usageLimitTotal: usageLimitTotal || null,
          usageLimitPerUser: usageLimitPerUser || 1
        }
      });

      // Xử lý thêm Assign nếu có
      if (updatedCoupon.scope === "ASSIGNED") {
        const targetUserIds: string[] = userIds || [];

        if (targetUserIds.length > 0) {
          // Chỉ thêm những user chưa được assign
          await tx.couponAssignment.createMany({
            data: targetUserIds.map(uid => ({
              couponId: id,
              userId: uid,
              assignedById: admin.id
            })),
            skipDuplicates: true
          });

          // Gửi thông báo cho các user mới được cấp
          const { createNotificationOnce } = await import("@/lib/server/notifications");
          for (const uid of targetUserIds) {
            await createNotificationOnce({
              userId: uid,
              type: "COUPON",
              title: "Bạn có mã giảm giá mới",
              message: `Mã ${updatedCoupon.code} giảm ${updatedCoupon.discountPercent}% đã được thêm vào kho mã giảm giá của bạn.`,
              href: "/coupons",
              dedupeKey: `coupon-assigned:${id}:${uid}`
            });
          }
        }
      } else {
        // Nếu là GLOBAL, đảm bảo không có assignment lẻ tẻ nào tồn tại
        await tx.couponAssignment.deleteMany({
          where: { couponId: id }
        });
      }

      return updatedCoupon;
    });

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể cập nhật mã giảm giá";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
