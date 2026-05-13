import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/server/email";
import {
  createResetPasswordEmail,
  createResetPasswordEmailText,
} from "@/lib/server/email-templates/reset-password-email";

export const runtime = "nodejs";

// Phản hồi cố định để tránh dò email (security: no user enumeration)
const SUCCESS_RESPONSE = {
  message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.",
};

function createResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").toLowerCase().trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Vui lòng nhập email hợp lệ." }, { status: 400 });
    }

    // Tìm user
    const user = await prisma.user.findUnique({ where: { email } });

    // Luôn trả success để tránh dò email
    if (!user) {
      return NextResponse.json(SUCCESS_RESPONSE);
    }

    // Nếu user chỉ dùng Google (không có passwordHash) thì không cần tạo token
    if (!user.passwordHash) {
      return NextResponse.json(SUCCESS_RESPONSE);
    }

    // Vô hiệu hóa tất cả token reset cũ chưa dùng của email này
    await prisma.passwordResetToken.updateMany({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    // Tạo token mới
    const { rawToken, tokenHash } = createResetToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    await prisma.passwordResetToken.create({
      data: { email, tokenHash, expiresAt },
    });

    // Tạo reset URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    // Gửi email (dev: console.log nếu không có RESEND_API_KEY)
    try {
      await sendEmail({
        to: email,
        subject: "Đặt lại mật khẩu TzoShop",
        html: createResetPasswordEmail({
          name: user.name,
          resetUrl,
        }),
        text: createResetPasswordEmailText({
          name: user.name,
          resetUrl,
        }),
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
      console.error("[forgot-password] Send email failed:", error);
      
      // In terminal để test trong dev nếu gửi thật lỗi
      if (process.env.NODE_ENV !== "production") {
        console.log("\n----------------------------------------------------");
        console.log("[DEV EMAIL - Gửi lỗi, đây là link reset]");
        console.log(`Link: ${resetUrl}`);
        console.log("----------------------------------------------------\n");
      }
    }

    return NextResponse.json({
      success: true,
      message: SUCCESS_RESPONSE.message,
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
    console.error("[forgot-password]", error);
    return NextResponse.json(
      { message: "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

