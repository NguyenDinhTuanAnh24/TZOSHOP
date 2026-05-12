import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";
import { encryptText, decryptText } from "@/lib/crypto";

export const runtime = "nodejs";

function maskKey(key: string | null | undefined) {
  if (!key) return "";
  if (key.length <= 4) return "••••";
  return "••••••••••" + key.slice(-4);
}

export async function GET() {
  try {
    await requireAdminUser();

    const setting = await prisma.paymentProviderSetting.findUnique({
      where: { provider: "PAYOS" },
    });

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: {
          provider: "PAYOS",
          clientId: "",
          apiKeyMasked: "",
          checksumKeyMasked: "",
          environment: "production",
          isActive: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: "PAYOS",
        clientId: setting.clientId || "",
        apiKeyMasked: setting.encryptedApiKey ? maskKey(decryptText(setting.encryptedApiKey)) : "",
        checksumKeyMasked: setting.encryptedChecksumKey ? maskKey(decryptText(setting.encryptedChecksumKey)) : "",
        environment: setting.environment,
        isActive: setting.isActive,
      },
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
    console.error("GET /api/admin/payment-settings/payos failed:", error);
    return NextResponse.json({ error: { message: "Lỗi hệ thống." } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminUser();

    const body = await request.json();
    const { clientId, apiKey, checksumKey, environment, isActive } = body;

    // Validate
    if (isActive) {
      if (!clientId) {
        return NextResponse.json({ error: { message: "Client ID là bắt buộc khi kích hoạt." } }, { status: 400 });
      }
    }

    const existing = await prisma.paymentProviderSetting.findUnique({
      where: { provider: "PAYOS" },
    });

    if (isActive) {
      if (!existing?.encryptedApiKey && !apiKey) {
        return NextResponse.json({ error: { message: "API Key là bắt buộc khi kích hoạt lần đầu." } }, { status: 400 });
      }
      if (!existing?.encryptedChecksumKey && !checksumKey) {
        return NextResponse.json({ error: { message: "Checksum Key là bắt buộc khi kích hoạt lần đầu." } }, { status: 400 });
      }
    }

    const updateData: { clientId?: string; environment?: string; isActive?: boolean; encryptedApiKey?: string; encryptedChecksumKey?: string } = {
      clientId,
      environment,
      isActive,
    };

    if (apiKey) {
      updateData.encryptedApiKey = encryptText(apiKey);
    }

    if (checksumKey) {
      updateData.encryptedChecksumKey = encryptText(checksumKey);
    }

    const setting = await prisma.paymentProviderSetting.upsert({
      where: { provider: "PAYOS" },
      update: updateData,
      create: {
        provider: "PAYOS",
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        provider: "PAYOS",
        clientId: setting.clientId,
        isActive: setting.isActive,
      },
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
    console.error("PATCH /api/admin/payment-settings/payos failed:", error);
    return NextResponse.json({ error: { message: "Lỗi hệ thống." } }, { status: 500 });
  }
}
