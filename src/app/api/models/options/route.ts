import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
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
        supportsStreaming: true,
        supportsTools: true,
        supportsAgent: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      items: models,
      models,
      total: models.length,
    });
  } catch (error) {
    console.error("[PUBLIC_MODEL_OPTIONS_ERROR]", error);
    return NextResponse.json({ error: "Không thể tải danh sách model" }, { status: 500 });
  }
}
