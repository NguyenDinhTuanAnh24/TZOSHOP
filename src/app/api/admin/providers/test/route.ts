import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function POST() {
  try {
    await requireAdminUser();

    const providers = await prisma.aiProvider.findMany({
      select: {
        id: true,
        name: true,
        apiFamily: true,
        baseUrl: true,
        isActive: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const results = providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      apiFamily: provider.apiFamily,
      baseUrl: provider.baseUrl,
      isActive: provider.isActive,
      status: "NOT_TESTED",
      updatedAt: provider.updatedAt,
    }));

    return NextResponse.json({
      ok: true,
      message: "Chức năng kiểm tra kết nối đang được cấu hình",
      results,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Bạn không có quyền truy cập" }, { status: 403 });
      }
    }

    console.error("[ADMIN_PROVIDERS_TEST_ERROR]", error);

    return NextResponse.json(
      {
        error: "Không thể kiểm tra kết nối provider",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
