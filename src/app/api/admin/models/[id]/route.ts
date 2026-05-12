import { ApiFamily } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: { message: "Thiếu ID." } }, { status: 400 });
    }

    const body = await request.json();
    const { 
      publicName, 
      upstreamModel, 
      apiFamily, 
      providerId, 
      inputCreditRate, 
      outputCreditRate, 
      upstreamEndpointType, 
      isActive 
    } = body;

    const updateData: Prisma.AiModelUpdateInput = {};

    if (publicName !== undefined) updateData.publicName = publicName;
    if (upstreamModel !== undefined) updateData.upstreamModel = upstreamModel;
    if (apiFamily !== undefined) updateData.apiFamily = apiFamily as ApiFamily;
    if (inputCreditRate !== undefined) updateData.inputCreditRate = Number(inputCreditRate);
    if (outputCreditRate !== undefined) updateData.outputCreditRate = Number(outputCreditRate);
    if (upstreamEndpointType !== undefined) {
      const type = (upstreamEndpointType === "RESPONSES" || upstreamEndpointType === "responses")
          ? "RESPONSES"
          : "CHAT_COMPLETIONS";
      (updateData as Record<string, unknown>).upstreamEndpointType = type;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    if (providerId) {
      updateData.provider = {
        connect: { id: providerId }
      };
    }

    if (publicName) {
      const existing = await prisma.aiModel.findFirst({
        where: {
          publicName: publicName,
          id: { not: id }
        }
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "Tên publicName đã tồn tại." },
          { status: 400 }
        );
      }
    }

    const updatedModel = await prisma.aiModel.update({
      where: { id },
      data: updateData,
      include: {
        provider: true
      }
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "ADMIN_UPDATE_MODEL",
      entityType: "MODEL",
      entityId: updatedModel.id,
      metadata: updateData
    });

    return NextResponse.json({
      success: true,
      data: updatedModel
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }
    console.error("PATCH /api/admin/models/[id] failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi cập nhật model." },
      { status: 500 }
    );
  }
}
