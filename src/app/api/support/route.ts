import { NextRequest, NextResponse } from "next/server";
import { TicketPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireCurrentUser } from "@/lib/server/current-user";
import { sendEmail } from "@/lib/server/email";
import { createSupportTicketEmail, createSupportTicketEmailText } from "@/lib/server/email-templates/support-ticket-email";

export const runtime = "nodejs";

const PRIORITY_MAP: Record<string, TicketPriority> = {
  "Thấp": "NORMAL",
  "Bình thường": "NORMAL",
  "Cao": "HIGH",
  "Khẩn cấp": "URGENT",
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") || 3));
    const skip = (page - 1) * pageSize;

    const where = { userId: user.id };

    const [totalItems, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
    }

    console.error("GET /api/support failed:", error);
    return NextResponse.json({ success: false, message: "Không thể tải danh sách hỗ trợ." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim();
    const category = String(body?.category || "Khác").trim();
    const priority = String(body?.priority || "Bình thường").trim();
    const subject = String(body?.subject || "").trim();
    const message = String(body?.message || "").trim();
    const orderCode = String(body?.orderCode || "").trim();
    const apiKeyPrefix = String(body?.apiKeyPrefix || "").trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ success: false, message: "Vui lòng điền đầy đủ các thông tin bắt buộc." }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ success: false, message: "Nội dung hỗ trợ tối thiểu 10 ký tự." }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user?.id || null,
        name,
        email,
        category,
        priority: PRIORITY_MAP[priority] || "NORMAL",
        subject,
        message,
        orderCode: orderCode || null,
        apiKeyPrefix: apiKeyPrefix || null,
        status: "OPEN",
      },
    });

    if (user?.id) {
      try {
        await prisma.auditLog.create({
          data: {
            adminUserId: user.id,
            action: "CREATE_TICKET",
            entityType: "Support",
            entityId: ticket.id,
            metadata: {
              actorName: user.name || name,
              actorEmail: user.email || email,
              description: `Người dùng tạo ticket: ${subject}`,
              module: "Support",
              status: "success",
            },
          },
        });
      } catch (error) {
        console.error("Create audit log for support ticket failed:", error);
      }
    }

    try {
      const { notifyAdmins } = await import("@/lib/server/notifications");
      await notifyAdmins({
        type: "SUPPORT_CREATED",
        title: "Yêu cầu hỗ trợ mới",
        message: `${ticket.email} vừa gửi yêu cầu: ${ticket.subject}`,
        href: "/admin/support",
        dedupeKey: `support-ticket-created:${ticket.id}`,
        metadata: { ticketId: ticket.id },
      });
    } catch (error) {
      console.error("notifyAdmins failed:", error);
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";
      await sendEmail({
        to: email,
        subject: "TzoShop đã nhận yêu cầu hỗ trợ",
        html: createSupportTicketEmail({
          name,
          email,
          ticketCode: ticket.id.slice(-6).toUpperCase(),
          subject,
          category,
          priority,
          orderCode: orderCode || null,
          apiKeyPrefix: apiKeyPrefix || null,
          supportUrl: `${appUrl}/support`,
        }),
        text: createSupportTicketEmailText({
          name,
          email,
          ticketCode: ticket.id.slice(-6).toUpperCase(),
          subject,
          category,
          priority,
          orderCode: orderCode || null,
          apiKeyPrefix: apiKeyPrefix || null,
          supportUrl: `${appUrl}/support`,
        }),
      });
    } catch (emailError) {
      console.error("Support confirmation email failed:", emailError);
    }

    return NextResponse.json({ success: true, ticketId: ticket.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
    }

    console.error("POST /api/support failed:", error);
    return NextResponse.json({ success: false, message: "Có lỗi xảy ra khi gửi yêu cầu hỗ trợ." }, { status: 500 });
  }
}
