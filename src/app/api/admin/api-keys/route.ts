import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || undefined;

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: apiKeys
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
    console.error("GET /api/admin/api-keys failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải danh sách API Keys." },
      { status: 500 }
    );
  }
}
