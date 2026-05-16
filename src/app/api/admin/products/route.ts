import { ApiFamily, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { buildPagination, getPagination } from "@/lib/pagination";

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
        family !== "ALL" ? { apiFamily: family as ApiFamily } : {},
        status === "ACTIVE" ? { isActive: true } : status === "INACTIVE" ? { isActive: false } : {},
        tier !== "ALL" ? { name: { contains: tier, mode: "insensitive" } } : {},
      ],
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === "PRICE_LOW"
        ? [{ priceVnd: "asc" }]
        : sort === "PRICE_HIGH"
          ? [{ priceVnd: "desc" }]
          : sort === "CREDITS_HIGH"
            ? [{ credits: "desc" }]
            : sort === "DURATION_HIGH"
              ? [{ durationDays: "desc" }]
              : [{ createdAt: "desc" }];

    const [total, activeProducts, hiddenProducts, familyGroups, products] = await Promise.all([
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
      }),
    ]);

    const data = products.map((p) => ({
      ...p,
      credits: p.credits.toString(),
    }));

    return NextResponse.json({
      success: true,
      data,
      items: data,
      pagination: buildPagination({ page, pageSize, total }),
      summary: {
        totalProducts: total,
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
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải danh sách gói." },
      { status: 500 }
    );
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
    } = body;

    const normalizedAllowedModels = Array.isArray(allowedModels)
      ? allowedModels.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];

    if (!name || !apiFamily || !durationDays || (!isContactOnly && priceVnd === undefined)) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin bắt buộc." },
        { status: 400 }
      );
    }

    let slug = providedSlug;
    if (!slug) {
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const timestamp = Date.now().toString().slice(-4);
      slug = `${baseSlug}-${timestamp}`;
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        apiFamily: apiFamily as ApiFamily,
        tier: "Standard",
        credits: BigInt(credits || 0),
        durationDays: Number(durationDays),
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

    return NextResponse.json({
      success: true,
      data: {
        ...newProduct,
        credits: newProduct.credits.toString(),
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
    console.error("POST /api/admin/products failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tạo gói." },
      { status: 500 }
    );
  }
}

