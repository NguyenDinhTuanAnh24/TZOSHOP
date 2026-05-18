import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const INVALID_LINK_MESSAGE = "Liên kết không hợp lệ hoặc đã hết hạn";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token) {
      return NextResponse.json({ error: INVALID_LINK_MESSAGE }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Mật khẩu xác nhận không khớp" }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: INVALID_LINK_MESSAGE }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: INVALID_LINK_MESSAGE }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          email: resetToken.email,
          usedAt: null,
        },
        data: { usedAt: now },
      }),
    ]);

    return NextResponse.json({ ok: true, message: "Đã đặt lại mật khẩu" });
  } catch (error) {
    console.error("[RESET_PASSWORD_ERROR]", error);
    return NextResponse.json({ error: "Không thể đặt lại mật khẩu. Vui lòng thử lại sau." }, { status: 500 });
  }
}
