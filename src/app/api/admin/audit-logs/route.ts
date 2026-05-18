import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim();
    const module = params.get("module")?.trim();
    const action = params.get("action")?.trim();
    const actor = params.get("actor")?.trim();
    const from = params.get("from")?.trim();
    const to = params.get("to")?.trim();

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entityType: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (module && module !== "ALL") where.entityType = module;
    if (action && action !== "ALL") where.action = action;
    if (actor && actor !== "ALL") where.adminUserId = actor;

    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        adminUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      take: 500,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
    }
    console.error("GET /api/admin/audit-logs failed:", error);
    return NextResponse.json({ success: false, message: "Lỗi hệ thống khi tải audit logs." }, { status: 500 });
  }
}
