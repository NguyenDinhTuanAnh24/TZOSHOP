import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const models = await prisma.aiModel.findMany({
      where: { isActive: true },
      select: {
        publicName: true,
        apiFamily: true,
      },
      orderBy: {
        publicName: "asc",
      },
    });

    return NextResponse.json({
      data: models,
    });
  } catch (error) {
    console.error("GET /api/models failed:", error);
    return NextResponse.json({ error: { message: "Không thể tải danh sách model." } }, { status: 500 });
  }
}
