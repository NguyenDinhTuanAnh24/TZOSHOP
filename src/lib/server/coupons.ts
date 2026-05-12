import { prisma } from "@/lib/prisma";
import { Coupon, CouponScope } from "@prisma/client";

export type ValidationResult = {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  finalAmount: number;
  message: string;
};

export async function validateCouponForUser({
  code,
  userId,
  originalAmount,
}: {
  code: string;
  userId: string;
  originalAmount: number;
}): Promise<ValidationResult> {
  // 1. Tìm coupon
  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: {
      assignments: {
        where: { userId },
      },
    },
  });

  if (!coupon) {
    return { isValid: false, discountAmount: 0, finalAmount: originalAmount, message: "Mã giảm giá không tồn tại." };
  }

  // 2. Kiểm tra trạng thái hoạt động
  if (!coupon.isActive) {
    return { isValid: false, discountAmount: 0, finalAmount: originalAmount, message: "Mã giảm giá đã bị tạm dừng." };
  }

  // 3. Kiểm tra thời gian
  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    return { isValid: false, discountAmount: 0, finalAmount: originalAmount, message: "Chương trình giảm giá chưa bắt đầu." };
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return { isValid: false, discountAmount: 0, finalAmount: originalAmount, message: "Mã giảm giá đã hết hạn." };
  }

  // 4. Kiểm tra đơn tối thiểu
  if (originalAmount < coupon.minOrderAmount) {
    return { 
      isValid: false, 
      discountAmount: 0, 
      finalAmount: originalAmount, 
      message: `Mã này chỉ áp dụng cho đơn hàng từ ${coupon.minOrderAmount.toLocaleString()}đ.` 
    };
  }

  // 5. Kiểm tra phạm vi (Scope)
  if (coupon.scope === CouponScope.ASSIGNED) {
    const assignment = coupon.assignments[0];
    if (!assignment) {
      return { isValid: false, discountAmount: 0, finalAmount: originalAmount, message: "Mã giảm giá này không dành cho bạn." };
    }
  }

  // 6. Kiểm tra giới hạn tổng lượt dùng
  if (coupon.usageLimitTotal !== null) {
    const totalRedemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id },
    });
    if (totalRedemptions >= coupon.usageLimitTotal) {
      return { isValid: false, discountAmount: 0, finalAmount: originalAmount, message: "Mã giảm giá đã hết lượt sử dụng." };
    }
  }

  // 7. Kiểm tra giới hạn lượt dùng mỗi user
  const userRedemptions = await prisma.couponRedemption.count({
    where: { couponId: coupon.id, userId },
  });
  if (userRedemptions >= coupon.usageLimitPerUser) {
    return { isValid: false, discountAmount: 0, finalAmount: originalAmount, message: "Bạn đã hết lượt sử dụng mã này." };
  }

  // 8. Tính số tiền giảm
  let discountAmount = Math.floor((originalAmount * coupon.discountPercent) / 100);
  
  if (coupon.maxDiscountVnd !== null) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscountVnd);
  }

  // Đảm bảo discountAmount không vượt quá originalAmount
  discountAmount = Math.min(discountAmount, originalAmount);

  const finalAmount = Math.max(0, originalAmount - discountAmount);

  return {
    isValid: true,
    coupon,
    discountAmount,
    finalAmount,
    message: "Áp dụng mã giảm giá thành công.",
  };
}

export async function redeemCouponForOrder({
  couponId,
  userId,
  orderId,
  originalAmount,
  discountAmount,
  finalAmount,
}: {
  couponId: string;
  userId: string;
  orderId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Tạo bản ghi Redemption
    const redemption = await tx.couponRedemption.create({
      data: {
        couponId,
        userId,
        orderId,
        originalAmount,
        discountAmount,
        finalAmount,
      },
    });

    // 2. Cập nhật usedAt trong Assignment nếu có
    await tx.couponAssignment.updateMany({
      where: {
        couponId,
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // 3. Cập nhật Order (đã có trong transaction nên an toàn)
    await tx.order.update({
      where: { id: orderId },
      data: {
        couponId,
        // couponCode sẽ được lấy từ bên ngoài hoặc fetch thêm
        discountAmount,
        originalAmount,
        amountVnd: finalAmount,
      },
    });

    return redemption;
  });
}
