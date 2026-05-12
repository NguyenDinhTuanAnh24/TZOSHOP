import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    // 1. Kiểm tra cấu hình Env
    const configStatus = {
      database: !!process.env.DATABASE_URL,
      payos: !!(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY),
      resend: !!(process.env.RESEND_API_KEY && (
        process.env.RESET_PASSWORD_FROM_EMAIL || 
        process.env.RESEND_FROM_EMAIL || 
        process.env.EMAIL_FROM || 
        process.env.MAIL_FROM || 
        process.env.SMTP_FROM
      )),
      googleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      encryptionSecret: !!process.env.API_KEY_ENCRYPTION_SECRET && process.env.API_KEY_ENCRYPTION_SECRET.length >= 16,
    };

    // 2. Lấy các con số thống kê
    const [activeProviders, activeModels, recentOrders, recentUsage] = await Promise.all([
      prisma.aiProvider.count({ where: { isActive: true } }),
      prisma.aiModel.count({ where: { isActive: true } }),
      prisma.order.findMany({
        where: { status: "PAID" },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true } }
        }
      }),
      prisma.usageLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true, email: true } }
        }
      })
    ]);

    // Thử một truy vấn DB nhỏ để xác nhận kết nối
    let dbConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (e) {
      dbConnected = false;
    }

    return NextResponse.json({
      success: true,
      data: {
        config: configStatus,
        dbConnected,
        stats: {
          activeProviders,
          activeModels,
        },
        recentOrders: recentOrders.map(o => ({
          ...o,
          payosOrderCode: o.payosOrderCode?.toString()
        })),
        recentUsage: recentUsage.map(u => ({
            ...u,
            creditsCharged: u.creditsCharged.toString()
        }))
      }
    });

  } catch (error) {
    console.error("GET /api/admin/system failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi kiểm tra trạng thái." },
      { status: 500 }
    );
  }
}
