import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id }
    });

    if (!coupon) {
      return NextResponse.json({ error: { message: "Không tìm thấy mã." } }, { status: 404 });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể cập nhật trạng thái mã giảm giá";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
