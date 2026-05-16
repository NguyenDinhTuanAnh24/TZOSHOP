import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdminUser();

    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      orderBy: [{ apiFamily: "asc" }, { publicName: "asc" }],
      select: {
        id: true,
        publicName: true,
        apiFamily: true,
        providerId: true,
        inputCreditRate: true,
        outputCreditRate: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      items: models,
      models,
      total: models.length,
    });
  } catch (error) {
    console.error("[MODEL_OPTIONS_ERROR]", error);
    return NextResponse.json(
      {
        error: "Không thể tải danh sách model",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
