import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/server/email";
import {
  createExpiringSoonEmail,
  createExpiringSoonEmailText,
} from "@/lib/server/email-templates/expiring-soon-email";

export const runtime = "nodejs";

/**
 * API Cron Job: Kiểm tra các gói credits sắp hết hạn để gửi email thông báo.
 * Chạy định kỳ (ví dụ: 1 lần/ngày).
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Bảo mật: Kiểm tra CRON_SECRET (nếu có)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 2. Tìm các gói sắp hết hạn (trong vòng 3 ngày tới) và chưa gửi cảnh báo
    const expiringBuckets = await prisma.creditBucket.findMany({
      where: {
        isActive: true,
        expiringSoonAlertSent: false,
        expiresAt: {
          gt: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        user: true,
        product: true,
      },
      take: 50, // Giới hạn mỗi lần chạy để tránh overload
    });

    console.log(`[Cron] Found ${expiringBuckets.length} expiring buckets.`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";
    let successCount = 0;

    // 3. Gửi email và cập nhật trạng thái
    for (const bucket of expiringBuckets) {
      if (!bucket.user?.email) continue;

      try {
        if (!bucket.expiresAt) continue;
        
        const daysRemaining = Math.ceil(
          (bucket.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        await sendEmail({
          to: bucket.user.email,
          subject: "Gói dịch vụ sắp hết hạn - TzoShop",
          html: createExpiringSoonEmail({
            name: bucket.user.name,
            productName: bucket.product?.name || "Gói dịch vụ AI",
            expiresAt: bucket.expiresAt.toLocaleDateString("vi-VN"),
            daysRemaining,
            rechargeUrl: `${appUrl}/billing`,
          }),
          text: createExpiringSoonEmailText({
            name: bucket.user.name,
            productName: bucket.product?.name || "Gói dịch vụ AI",
            expiresAt: bucket.expiresAt.toLocaleDateString("vi-VN"),
            daysRemaining,
            rechargeUrl: `${appUrl}/billing`,
          }),
        });

        // Đánh dấu đã gửi
        await prisma.creditBucket.update({
          where: { id: bucket.id },
          data: { expiringSoonAlertSent: true },
        });

        successCount++;
      } catch (err) {
        console.error(`[Cron] Failed to process bucket ${bucket.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      processed: expiringBuckets.length,
      sent: successCount,
    });

  } catch (error) {
    console.error("[Cron] check-expiring-buckets failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

