import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { CouponScope } from "@prisma/client";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    // 1. Lấy tất cả coupon Global đang active
    const globalCoupons = await prisma.coupon.findMany({
      where: {
        scope: CouponScope.GLOBAL,
        isActive: true,
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: "desc" }
    });

    // 2. Lấy coupon được Assigned riêng cho user
    const assignments = await prisma.couponAssignment.findMany({
      where: { userId: user.id },
      include: { coupon: true }
    });

    // 3. Lấy các mã đã dùng (Redemptions)
    const redemptions = await prisma.couponRedemption.findMany({
      where: { userId: user.id },
      select: { couponId: true }
    });
    // const usedCouponIds = new Set(redemptions.map(r => r.couponId));

    const available: typeof globalCoupons = [];
    const used: typeof globalCoupons = [];

    // Phân loại Global coupons
    for (const coupon of globalCoupons) {
      // Kiểm tra xem user đã dùng hết lượt chưa
      const userRedeemCount = redemptions.filter((r: { couponId: string }) => r.couponId === coupon.id).length;
      
      if (userRedeemCount >= coupon.usageLimitPerUser) {
        used.push(coupon);
      } else {
        available.push(coupon);
      }
    }

    // Phân loại Assigned coupons
    for (const assignment of assignments) {
      const coupon = assignment.coupon;
      if (!coupon.isActive) continue; // Bỏ qua nếu coupon bị tắt

      // Nếu đã dùng (có usedAt hoặc vượt giới hạn)
      const userRedeemCount = redemptions.filter((r: { couponId: string }) => r.couponId === coupon.id).length;

      if (assignment.usedAt || userRedeemCount >= coupon.usageLimitPerUser) {
        // Tránh trùng lặp nếu nó cũng là global (hiếm nhưng có thể)
        if (!used.some((c: { id: string }) => c.id === coupon.id)) {
          used.push(coupon);
        }
      } else {
        if (!available.some((c: { id: string }) => c.id === coupon.id)) {
          available.push(coupon);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        available,
        used
      }
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
    }
    return NextResponse.json({ error: { message: "Lỗi hệ thống." } }, { status: 500 });
  }
}
