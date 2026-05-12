import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { CouponScope, UserRole } from "@prisma/client";

export async function GET() {
  try {
    await requireAdminUser();

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            assignments: true,
            redemptions: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: coupons });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();

    const {
      code,
      name,
      description,
      discountPercent,
      minOrderAmount,
      maxDiscountVnd,
      startsAt,
      endsAt,
      isActive,
      scope,
      userIds
    } = body;

    if (!code || !name || discountPercent === undefined) {
      return NextResponse.json({ error: { message: "Thiếu thông tin bắt buộc." } }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: { message: "Mã giảm giá này đã tồn tại." } }, { status: 400 });
    }

    const coupon = await prisma.$transaction(async (tx) => {
      const newCoupon = await tx.coupon.create({
        data: {
          code,
          name,
          description,
          discountPercent,
          minOrderAmount,
          maxDiscountVnd: maxDiscountVnd || null,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
          isActive,
          scope,
          createdById: admin.id
        }
      });

      // Xử lý Assign & Notification
      const { createNotificationOnce } = await import("@/lib/server/notifications");
      
      if (scope === CouponScope.ASSIGNED) {
        const targetUserIds: string[] = userIds || [];

        if (targetUserIds.length === 0) {
          throw new Error("Vui lòng chọn ít nhất một người dùng cho mã chỉ định.");
        }

        await tx.couponAssignment.createMany({
          data: targetUserIds.map((uid: string) => ({
            couponId: newCoupon.id,
            userId: uid,
            assignedById: admin.id
          })),
          skipDuplicates: true
        });

        // Gửi thông báo cho các user được assign
        for (const uid of targetUserIds) {
          await createNotificationOnce({
            userId: uid,
            type: "COUPON",
            title: "Bạn có mã giảm giá mới",
            message: `Mã ${code} giảm ${discountPercent}% đã được thêm vào kho mã giảm giá của bạn.`,
            href: "/coupons",
            dedupeKey: `coupon-assigned:${newCoupon.id}:${uid}`
          });
        }
      } else if (scope === CouponScope.GLOBAL) {
        // Mặc định thông báo cho toàn bộ user thường khi tạo mã Global
        const users = await tx.user.findMany({
          where: { role: UserRole.USER },
          select: { id: true }
        });
        
        for (const u of users) {
          await createNotificationOnce({
            userId: u.id,
            type: "COUPON",
            title: "Bạn có mã giảm giá mới",
            message: `Mã ${code} giảm ${discountPercent}% đã được thêm vào kho mã giảm giá của bạn.`,
            href: "/coupons",
            dedupeKey: `coupon-global-notif:${newCoupon.id}:${u.id}`
          });
        }
      }

      return newCoupon;
    });

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: unknown) {
    console.error("Coupon creation error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
