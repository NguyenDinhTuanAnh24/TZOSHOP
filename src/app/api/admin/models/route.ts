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
    const provider = searchParams.get("provider")?.trim() || "ALL";
    const status = searchParams.get("status")?.trim() || "ALL";
    const sort = searchParams.get("sort")?.trim() || "NEWEST";

    const where: Prisma.AiModelWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { publicName: { contains: search, mode: "insensitive" as const } },
                { upstreamModel: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
        family !== "ALL" ? { apiFamily: family as ApiFamily } : {},
        provider !== "ALL" ? { providerId: provider } : {},
        status === "ACTIVE" ? { isActive: true } : status === "INACTIVE" ? { isActive: false } : {},
      ],
    };

    const orderBy: Prisma.AiModelOrderByWithRelationInput[] =
      sort === "NAME_ASC"
        ? [{ publicName: "asc" }]
        : sort === "FAMILY"
          ? [{ apiFamily: "asc" }, { publicName: "asc" }]
          : sort === "USAGE"
            ? [{ outputCreditRate: "desc" }, { publicName: "asc" }]
            : [{ createdAt: "desc" }];

    const [totalModels, activeModels, inactiveModels, familyGroups, models] = await Promise.all([
      prisma.aiModel.count({ where }),
      prisma.aiModel.count({ where: { ...where, isActive: true } }),
      prisma.aiModel.count({ where: { ...where, isActive: false } }),
      prisma.aiModel.groupBy({
        by: ["apiFamily"],
        where,
        _count: { apiFamily: true },
      }),
      prisma.aiModel.findMany({
        where,
        select: {
          id: true,
          publicName: true,
          upstreamModel: true,
          apiFamily: true,
          providerId: true,
          inputCreditRate: true,
          outputCreditRate: true,
          upstreamEndpointType: true,
          supportsStreaming: true,
          supportsTools: true,
          supportsAgent: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          provider: {
            select: {
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: models,
      items: models,
      models,
      pagination: buildPagination({ page, pageSize, total: totalModels }),
      summary: {
        totalModels,
        activeModels,
        inactiveModels,
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
    console.error("GET /api/admin/models failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải danh sách models." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser();

    const body = await request.json();
    const { publicName, upstreamModel, apiFamily, providerId, inputCreditRate, outputCreditRate, isActive } = body;

    const existingModel = await prisma.aiModel.findUnique({
      where: { publicName }
    });

    if (existingModel) {
      return NextResponse.json(
        { success: false, message: "Tên publicName đã tồn tại." },
        { status: 400 }
      );
    }

    const createData: Prisma.AiModelCreateInput = {
      publicName,
      upstreamModel,
      apiFamily: apiFamily as ApiFamily,
      provider: {
        connect: { id: providerId }
      },
      inputCreditRate: Number(inputCreditRate) || 1,
      outputCreditRate: Number(outputCreditRate) || 1,
      supportsStreaming: body.supportsStreaming ?? true,
      supportsTools: body.supportsTools ?? false,
      supportsAgent: body.supportsAgent ?? false,
      isActive: isActive ?? true,
    };

    const type = (body.upstreamEndpointType === "RESPONSES" || body.upstreamEndpointType === "responses")
      ? "RESPONSES"
      : "CHAT_COMPLETIONS";
    
    (createData as Record<string, unknown>).upstreamEndpointType = type;

    const newModel = await prisma.aiModel.create({
      data: createData,
      include: {
        provider: { select: { name: true } }
      }
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "ADMIN_CREATE_MODEL",
      entityType: "MODEL",
      entityId: newModel.id,
      metadata: { publicName: newModel.publicName, apiFamily: newModel.apiFamily }
    });

    return NextResponse.json({
      success: true,
      data: newModel
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
    console.error("POST /api/admin/models failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tạo model." },
      { status: 500 }
    );
  }
}
