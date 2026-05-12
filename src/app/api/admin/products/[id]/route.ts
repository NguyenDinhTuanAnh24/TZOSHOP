import { Prisma, ApiFamily } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: { message: "Thiếu ID." } }, { status: 400 });
    }

    const body = await request.json();

    const updateData: Prisma.ProductUpdateInput = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.apiFamily !== undefined) updateData.apiFamily = body.apiFamily as ApiFamily;
    if (body.credits !== undefined) updateData.credits = BigInt(body.credits);
    if (body.durationDays !== undefined) updateData.durationDays = Number(body.durationDays);
    if (body.priceVnd !== undefined) updateData.priceVnd = Number(body.priceVnd);
    if (body.apiKeyLimit !== undefined) updateData.apiKeyLimit = Number(body.apiKeyLimit);
    if (body.allowedModels !== undefined) updateData.allowedModels = body.allowedModels;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPopular !== undefined) updateData.isPopular = body.isPopular;
    if (body.isContactOnly !== undefined) updateData.isContactOnly = body.isContactOnly;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "ADMIN_UPDATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: updatedProduct.id,
      metadata: updateData
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProduct,
        credits: updatedProduct.credits.toString()
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }
    console.error("PATCH /api/admin/products/[id] failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi cập nhật gói." },
      { status: 500 }
    );
  }
}
