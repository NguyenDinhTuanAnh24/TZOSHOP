import { ApiFamily, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { buildPagination, getPagination } from "@/lib/pagination";
import { detectFamilyKeyFromSlug, validateAllowedModelsBySlug } from "@/lib/admin-product-catalog";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const search = searchParams.get("search")?.trim() || "";
    const family = searchParams.get("family")?.trim() || "ALL";
    const status = searchParams.get("status")?.trim() || "ALL";
    const tier = searchParams.get("tier")?.trim() || "ALL";
    const sort = searchParams.get("sort")?.trim() || "NEWEST";

    const where: Prisma.ProductWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
                { allowedModels: { hasSome: [search] } },
              ],
            }
          : {},
        family === "ALL_MODELS"
          ? { slug: { startsWith: "all_models_" } }
          : family === "CODEXAI"
            ? { slug: { startsWith: "codex_" } }
            : family === "CLAUDE"
              ? { slug: { startsWith: "claude_" } }
              : family === "GEMINI"
                ? { slug: { startsWith: "gemini_" } }
                : family === "DEEPSEEK"
                  ? { slug: { startsWith: "deepseek_" } }
                  : {},
        status === "ACTIVE" ? { isActive: true } : status === "INACTIVE" ? { isActive: false } : {},
        tier === "TRIAL"
          ? { slug: { endsWith: "_trial" } }
          : tier === "MONTHLY"
            ? { slug: { endsWith: "_monthly" } }
            : tier === "QUARTERLY"
              ? { slug: { endsWith: "_quarterly" } }
              : tier === "YEARLY"
                ? { slug: { endsWith: "_yearly" } }
                : {},
      ],
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === "PRICE_LOW"
        ? [{ priceVnd: "asc" }]
        : sort === "PRICE_HIGH"
          ? [{ priceVnd: "desc" }]
          : sort === "CREDITS_LOW"
            ? [{ credits: "asc" }]
            : sort === "CREDITS_HIGH"
              ? [{ credits: "desc" }]
              : sort === "DURATION_LOW"
                ? [{ durationDays: "asc" }]
                : sort === "DURATION_HIGH"
                  ? [{ durationDays: "desc" }]
                  : [{ createdAt: "desc" }];

    const [totalProducts, activeProducts, hiddenProducts, familyGroups, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.count({ where: { ...where, isActive: true } }),
      prisma.product.count({ where: { ...where, isActive: false } }),
      prisma.product.groupBy({
        by: ["apiFamily"],
        where,
        _count: { apiFamily: true },
      }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          apiFamily: true,
          tier: true,
          credits: true,
          durationDays: true,
          priceVnd: true,
          apiKeyLimit: true,
          allowedModels: true,
          isActive: true,
          isPopular: true,
          isContactOnly: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const data = products.map((p) => ({
      ...p,
      credits: p.credits.toString(),
      familyBySlug: detectFamilyKeyFromSlug(p.slug),
    }));

    return NextResponse.json({
      success: true,
      data,
      items: data,
      products: data,
      pagination: buildPagination({ page, pageSize, total: totalProducts }),
      summary: {
        totalProducts,
        activeProducts,
        hiddenProducts,
        familyCount: familyGroups.length,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }
    console.error("GET /api/admin/products failed:", error);
    return NextResponse.json({ success: false, message: "Lỗi hệ thống khi tải danh sách gói." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();
    const body = await request.json();

    const {
      name,
      slug: providedSlug,
      apiFamily,
      credits,
      durationDays,
      priceVnd,
      apiKeyLimit,
      allowedModels,
      isActive,
      isPopular,
      isContactOnly,
      tier,
    } = body;

    const normalizedAllowedModels = Array.isArray(allowedModels)
      ? allowedModels.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];

    const normalizedDurationDays = durationDays === null || durationDays === undefined || durationDays === "" ? null : Number(durationDays);

    if (!name || !apiFamily) {
      return NextResponse.json({ success: false, message: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }

    let slug = (providedSlug ? String(providedSlug) : "").trim();
    if (!slug) {
      const baseSlug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const timestamp = Date.now().toString().slice(-4);
      slug = `${baseSlug}-${timestamp}`;
    }

    const existingSlug = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (existingSlug) {
      return NextResponse.json({ success: false, message: "Slug đã tồn tại." }, { status: 400 });
    }

    if (Number(credits) <= 0) {
      return NextResponse.json({ success: false, message: "Credits phải lớn hơn 0." }, { status: 400 });
    }
    if (normalizedDurationDays === null || Number.isNaN(normalizedDurationDays) || Number(normalizedDurationDays) <= 0) {
      return NextResponse.json({ success: false, message: "Thời hạn ngày phải lớn hơn 0." }, { status: 400 });
    }
    if (!isContactOnly && Number(priceVnd) < 0) {
      return NextResponse.json({ success: false, message: "Giá bán không hợp lệ." }, { status: 400 });
    }
    if (Number(apiKeyLimit) < 1) {
      return NextResponse.json({ success: false, message: "Giới hạn API key phải từ 1 trở lên." }, { status: 400 });
    }

    const modelValidationError = validateAllowedModelsBySlug(slug, normalizedAllowedModels);
    if (modelValidationError) {
      return NextResponse.json({ success: false, message: modelValidationError }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        apiFamily: apiFamily as ApiFamily,
        tier: String(tier || "Standard"),
        credits: BigInt(credits || 0),
        durationDays: normalizedDurationDays,
        priceVnd: Number(priceVnd || 0),
        apiKeyLimit: Number(apiKeyLimit || 1),
        allowedModels: normalizedAllowedModels,
        allowedReasoning: [],
        isActive: isActive !== undefined ? isActive : true,
        isPopular: isPopular !== undefined ? isPopular : false,
        isContactOnly: isContactOnly !== undefined ? isContactOnly : false,
      },
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "CREATE",
      entityType: "PRODUCT",
      entityId: newProduct.id,
      metadata: { name: newProduct.name, apiFamily: newProduct.apiFamily },
    });

    return NextResponse.json({ success: true, data: { ...newProduct, credits: newProduct.credits.toString() } });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }
    console.error("POST /api/admin/products failed:", error);
    return NextResponse.json({ success: false, message: "Lỗi hệ thống khi tạo gói." }, { status: 500 });
  }
}

