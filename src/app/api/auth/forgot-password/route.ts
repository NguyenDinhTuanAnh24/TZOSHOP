import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/server/email";
import {
  createResetPasswordEmail,
  createResetPasswordEmailText,
} from "@/lib/server/email-templates/reset-password-email";

export const runtime = "nodejs";

const SUCCESS_MESSAGE = "Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
    }

    await prisma.passwordResetToken.updateMany({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    const { rawToken, tokenHash } = createResetToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3005";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Đặt lại mật khẩu TzoShop",
      html: createResetPasswordEmail({ name: user.name, resetUrl }),
      text: createResetPasswordEmailText({ name: user.name, resetUrl }),
    });

    return NextResponse.json({ ok: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error);

    return NextResponse.json(
      {
        error: "Không thể gửi email đặt lại mật khẩu",
      },
      { status: 500 },
    );
  }
}
