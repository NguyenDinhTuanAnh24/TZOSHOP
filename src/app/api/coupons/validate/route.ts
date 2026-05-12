import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { validateCouponForUser } from "@/lib/server/coupons";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const { code, productId } = body;

    if (!code || !productId) {
      return NextResponse.json({ error: { message: "Thiếu thông tin mã giảm giá hoặc sản phẩm." } }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: { message: "Sản phẩm không tồn tại." } }, { status: 404 });
    }

    const result = await validateCouponForUser({
      code,
      userId: user.id,
      originalAmount: product.priceVnd
    });

    if (!result.isValid) {
      return NextResponse.json({ 
        valid: false, 
        message: result.message 
      });
    }

    return NextResponse.json({
      valid: true,
      code: result.coupon?.code,
      name: result.coupon?.name,
      discountPercent: result.coupon?.discountPercent,
      originalAmount: product.priceVnd,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      message: result.message
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
    }
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: { message: "Lỗi hệ thống khi kiểm tra mã giảm giá." } }, { status: 500 });
  }
}
