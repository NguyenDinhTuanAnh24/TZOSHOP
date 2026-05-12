import { Prisma, ApiFamily } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { encryptText, decryptText } from "@/lib/crypto";

export const runtime = "nodejs";

function maskApiKey(key: string) {
  if (!key) return "";
  if (key.length <= 4) return "••••" + key;
  return "••••••••" + key.slice(-4);
}

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
    const updateData: Prisma.AiProviderUpdateInput = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.apiFamily !== undefined) updateData.apiFamily = body.apiFamily as ApiFamily;
    if (body.baseUrl !== undefined) updateData.baseUrl = body.baseUrl;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    let newPlainKey = "";
    if (body.apiKey && body.apiKey.trim() !== "") {
      newPlainKey = body.apiKey.trim();
      updateData.encryptedApiKey = encryptText(newPlainKey);
    }

    const updatedProvider = await prisma.aiProvider.update({
      where: { id },
      data: updateData,
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: updatedProvider.isActive === false ? "ADMIN_DISABLE_PROVIDER" : "ADMIN_UPDATE_PROVIDER",
      entityType: "PROVIDER",
      entityId: updatedProvider.id,
      metadata: updateData
    });

    let returnedMaskedKey = "••••••••";
    if (newPlainKey) {
      returnedMaskedKey = maskApiKey(newPlainKey);
    } else {
      try {
        returnedMaskedKey = maskApiKey(decryptText(updatedProvider.encryptedApiKey));
      } catch {
        // Ignored
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProvider,
        encryptedApiKey: returnedMaskedKey
      }
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
    console.error("PATCH /api/admin/providers/[id] failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi cập nhật provider." },
      { status: 500 }
    );
  }
}
