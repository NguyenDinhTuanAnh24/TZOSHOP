import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const email = searchParams.get("email")?.trim() || undefined;
    const apiKeyName = searchParams.get("apiKey")?.trim() || undefined;
    const model = searchParams.get("model")?.trim() || undefined;
    const status = searchParams.get("status") || "ALL";
    const timeRange = searchParams.get("timeRange") || "all";

    const where: Prisma.UsageLogWhereInput = {};
    
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (model) {
      where.model = { contains: model, mode: 'insensitive' };
    }

    if (email) {
      where.user = {
        email: { contains: email, mode: 'insensitive' }
      };
    }

    if (apiKeyName) {
      where.apiKey = {
        name: { contains: apiKeyName, mode: 'insensitive' }
      };
    }

    if (timeRange !== "all") {
      const now = new Date();
      const startDate = new Date();
      if (timeRange === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === "7d") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === "30d") {
        startDate.setDate(now.getDate() - 30);
      }
      where.createdAt = { gte: startDate };
    }

    console.log("[AdminUsageAPI] Fetching logs with where:", JSON.stringify(where));

    const [logs, totalCount, statsData, successCount] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { name: true, email: true } },
          apiKey: { select: { name: true, keyPrefix: true } }
        }
      }),
      prisma.usageLog.count({ where }),
      prisma.usageLog.aggregate({
        where,
        _sum: {
          totalTokens: true,
          creditsCharged: true,
          inputTokens: true,
          outputTokens: true,
        },
      }),
      prisma.usageLog.count({
        where: { ...where, status: "SUCCESS" }
      })
    ]);

    console.log(`[AdminUsageAPI] Found ${logs.length} logs, Total: ${totalCount}`);

    // Top models
    const topModelsData = await prisma.usageLog.groupBy({
      by: ['model'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const stats = {
      totalRequests: totalCount,
      successCount: successCount,
      failedCount: totalCount - successCount,
      totalCredits: (statsData._sum.creditsCharged || BigInt(0)).toString(),
      totalTokens: statsData._sum.totalTokens || 0,
      totalInputTokens: statsData._sum.inputTokens || 0,
      totalOutputTokens: statsData._sum.outputTokens || 0,
      topModels: topModelsData.map(m => ({ model: m.model, count: m._count.id }))
    };

    // Serialize BigInt for JSON
    const serializedLogs = logs.map(log => ({
      ...log,
      creditsCharged: log.creditsCharged.toString()
    }));

    return NextResponse.json({
      success: true,
      data: serializedLogs,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      stats
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
    console.error("GET /api/admin/usage failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải lịch sử sử dụng." },
      { status: 500 }
    );
  }
}
