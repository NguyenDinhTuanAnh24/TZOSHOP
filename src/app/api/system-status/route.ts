import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ServiceStatus = "operational" | "degraded" | "maintenance" | "incident";

type ServiceItem = {
  name: string;
  status: ServiceStatus;
  description: string;
};

function toService(name: string, status: ServiceStatus, description: string): ServiceItem {
  return { name, status, description };
}

export async function GET() {
  const updatedAt = new Date().toISOString();

  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const paymentsConfigured = Boolean(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY &&
      (process.env.RESET_PASSWORD_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || process.env.MAIL_FROM || process.env.SMTP_FROM),
  );

  const apiBaseUrl = process.env.NEWAPI_BASE_URL?.trim();
  const apiAdminKey = process.env.NEWAPI_ADMIN_KEY?.trim();
  let apiOk = false;

  if (apiBaseUrl && apiAdminKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`${apiBaseUrl}/api/status`, { signal: controller.signal });
      clearTimeout(timeout);
      apiOk = response.ok;
    } catch {
      apiOk = false;
    }
  }

  const services: ServiceItem[] = [
    toService("Website TzoShop", "operational", "Hoạt động bình thường."),
    toService("Thanh toán", paymentsConfigured ? "operational" : "degraded", paymentsConfigured ? "Sẵn sàng xử lý đơn hàng." : "Chưa cấu hình đầy đủ thanh toán."),
    toService("API", apiOk ? "operational" : "degraded", apiOk ? "Sẵn sàng xử lý request." : "Đang gián đoạn một phần ở hệ thống API."),
    toService("Cấp phát API key", apiOk ? "operational" : "degraded", apiOk ? "Hoạt động bình thường." : "Tạm thời chưa ổn định."),
    toService("Đồng bộ credits", apiOk ? "operational" : "degraded", apiOk ? "Hoạt động bình thường." : "Đang gián đoạn một phần."),
    toService("Cơ sở dữ liệu", dbOk ? "operational" : "degraded", dbOk ? "Kết nối ổn định." : "Không kiểm tra được kết nối."),
    toService("Email", emailConfigured ? "operational" : "degraded", emailConfigured ? "Sẵn sàng gửi thông báo." : "Chưa cấu hình đầy đủ email."),
  ];

  const hasIncident = services.some((service) => service.status === "incident");
  const hasMaintenance = services.some((service) => service.status === "maintenance");
  const hasDegraded = services.some((service) => service.status === "degraded");

  const overall: ServiceStatus = hasIncident ? "incident" : hasMaintenance ? "maintenance" : hasDegraded ? "degraded" : "operational";

  return NextResponse.json({
    success: true,
    data: {
      overall,
      updatedAt,
      services,
    },
  });
}
