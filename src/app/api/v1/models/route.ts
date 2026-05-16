import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findActiveApiKeyByPlainTextKey } from "@/lib/api-key-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.replace("Bearer ", "").trim() : null;

    let allowedModels: string[] | null = null;
    if (token) {
      const apiKey = await findActiveApiKeyByPlainTextKey(token);
      if (apiKey && !apiKey.revokedAt && apiKey.creditBucket?.isActive) {
        allowedModels = apiKey.creditBucket.allowedModels;
      }
    }

    const activeModels = await prisma.aiModel.findMany({
      where: {
        isActive: true,
        ...(allowedModels ? { publicName: { in: allowedModels } } : {}),
      },
      include: { provider: true },
      orderBy: { publicName: "asc" }
    });

    return NextResponse.json({
      object: "list",
      data: activeModels.map((model) => ({
        id: model.publicName,
        object: "model",
        created: 0,
        owned_by: "tzoshop",
      })),
    });
  } catch (error) {
    console.error("GET /api/v1/models error:", error);
    return NextResponse.json({ error: { message: "Internal Server Error" } }, { status: 500 });
  }
}
