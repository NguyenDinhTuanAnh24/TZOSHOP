import { ApiFamily, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { validateAllowedModelsBySlug } from "@/lib/admin-product-catalog";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUser();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: { message: "Thiếu ID." } }, { status: 400 });
    }

    const body = await request.json();
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, message: "Không tìm thấy gói." }, { status: 404 });
    }

    const nextSlug = body.slug !== undefined ? String(body.slug).trim() : current.slug;
    const nextAllowedModels = body.allowedModels !== undefined
      ? (Array.isArray(body.allowedModels) ? body.allowedModels.map((item: unknown) => String(item).trim()).filter(Boolean) : [])
      : current.allowedModels;
    const nextCredits = body.credits !== undefined ? Number(body.credits) : Number(current.credits);
    const nextDurationDays = body.durationDays !== undefined ? Number(body.durationDays) : current.durationDays;
    const nextPriceVnd = body.priceVnd !== undefined ? Number(body.priceVnd) : current.priceVnd;
    const nextApiKeyLimit = body.apiKeyLimit !== undefined ? Number(body.apiKeyLimit) : current.apiKeyLimit;
    const nextIsContactOnly = body.isContactOnly !== undefined ? Boolean(body.isContactOnly) : current.isContactOnly;

    if (nextCredits <= 0) {
      return NextResponse.json({ success: false, message: "Credits phải lớn hơn 0." }, { status: 400 });
    }
    if (nextDurationDays === null || Number.isNaN(nextDurationDays) || Number(nextDurationDays) <= 0) {
      return NextResponse.json({ success: false, message: "Thời hạn ngày phải lớn hơn 0." }, { status: 400 });
    }
    if (!nextIsContactOnly && nextPriceVnd < 0) {
      return NextResponse.json({ success: false, message: "Giá bán không hợp lệ." }, { status: 400 });
    }
    if (nextApiKeyLimit < 1) {
      return NextResponse.json({ success: false, message: "Giới hạn API key phải từ 1 trở lên." }, { status: 400 });
    }

    const modelValidationError = validateAllowedModelsBySlug(nextSlug, nextAllowedModels);
    if (modelValidationError) {
      return NextResponse.json({ success: false, message: modelValidationError }, { status: 400 });
    }

    if (nextSlug !== current.slug) {
      const existingSlug = await prisma.product.findUnique({ where: { slug: nextSlug }, select: { id: true } });
      if (existingSlug && existingSlug.id !== id) {
        return NextResponse.json({ success: false, message: "Slug đã tồn tại." }, { status: 400 });
      }
    }

    const updateData: Prisma.ProductUpdateInput = {};

    if (body.name !== undefined) updateData.name = String(body.name);
    if (body.slug !== undefined) updateData.slug = nextSlug;
    if (body.apiFamily !== undefined) updateData.apiFamily = body.apiFamily as ApiFamily;
    if (body.credits !== undefined) updateData.credits = BigInt(body.credits);
    if (body.durationDays !== undefined) updateData.durationDays = Number(body.durationDays);
    if (body.priceVnd !== undefined) updateData.priceVnd = Number(body.priceVnd);
    if (body.apiKeyLimit !== undefined) updateData.apiKeyLimit = Number(body.apiKeyLimit);
    if (body.allowedModels !== undefined) updateData.allowedModels = nextAllowedModels;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.isPopular !== undefined) updateData.isPopular = Boolean(body.isPopular);
    if (body.isContactOnly !== undefined) updateData.isContactOnly = Boolean(body.isContactOnly);
    if (body.tier !== undefined) updateData.tier = String(body.tier);

    const updatedProduct = await prisma.product.update({ where: { id }, data: updateData });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "ADMIN_UPDATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: updatedProduct.id,
      metadata: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProduct,
        credits: updatedProduct.credits.toString(),
      },
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
    return NextResponse.json({ success: false, message: "Lỗi hệ thống khi cập nhật gói." }, { status: 500 });
  }
}

