import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    // A. Database status
    let dbStatus = {
      status: "ERROR",
      label: "Cơ sở dữ liệu",
      message: "Không thể kết nối cơ sở dữ liệu."
    };
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = {
        status: "CONFIGURED",
        label: "Cơ sở dữ liệu",
        message: "Kết nối cơ sở dữ liệu ổn định."
      };
    } catch (e) {
      console.error("Database status check failed:", e);
    }

    // B. PayOS status
    const hasPayOS = !!(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);
    const payosStatus = {
      status: hasPayOS ? "CONFIGURED" : "MISSING",
      label: "Cổng thanh toán PayOS",
      message: hasPayOS ? "Cấu hình PayOS đầy đủ." : "Thiếu thông tin cấu hình PayOS (Client ID, API Key hoặc Checksum Key)."
    };

    // C. Resend status
    const hasResendApiKey = !!process.env.RESEND_API_KEY;
    const hasFromEmail = !!(
      process.env.RESET_PASSWORD_FROM_EMAIL || 
      process.env.RESEND_FROM_EMAIL || 
      process.env.EMAIL_FROM || 
      process.env.MAIL_FROM || 
      process.env.SMTP_FROM
    );

    let resendStatus: any = {
      label: "Dịch vụ Email",
    };

    if (hasResendApiKey && hasFromEmail) {
      resendStatus = {
        ...resendStatus,
        status: "CONFIGURED",
        message: "Cấu hình Resend đầy đủ."
      };
    } else if (hasResendApiKey && !hasFromEmail) {
      resendStatus = {
        ...resendStatus,
        status: "WARNING",
        message: "Resend API key đã có, nhưng email gửi mặc định (From Email) chưa được cấu hình."
      };
    } else {
      resendStatus = {
        ...resendStatus,
        status: "MISSING",
        message: "Thiếu RESEND_API_KEY."
      };
    }

    // D. Google Auth
    const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const googleStatus = {
      status: hasGoogle ? "CONFIGURED" : "MISSING",
      label: "Đăng nhập Google",
      message: hasGoogle ? "Cấu hình Google OAuth đầy đủ." : "Thiếu Client ID hoặc Client Secret cho Google Login."
    };

    // E. Key Encryption
    const hasEncryption = !!process.env.API_KEY_ENCRYPTION_SECRET && process.env.API_KEY_ENCRYPTION_SECRET.length >= 16;
    const encryptionStatus = {
      status: hasEncryption ? "CONFIGURED" : "MISSING",
      label: "Mã hóa API Key",
      message: hasEncryption ? "Hệ thống mã hóa API Key sẵn sàng." : "Thiếu mã bí mật mã hóa hoặc mã quá ngắn (tối thiểu 16 ký tự)."
    };

    return NextResponse.json({
      success: true,
      data: {
        database: dbStatus,
        payos: payosStatus,
        resend: resendStatus,
        googleAuth: googleStatus,
        keyEncryption: encryptionStatus
      }
    });

  } catch (error) {
    console.error("GET /api/admin/system-status failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi kiểm tra trạng thái." },
      { status: 500 }
    );
  }
}
