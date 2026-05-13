import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TicketPriority } from "@prisma/client";
import { requireCurrentUser, getCurrentUser } from "@/lib/server/current-user";
import { sendEmail } from "@/lib/server/email";
import {
  createSupportTicketEmail,
  createSupportTicketEmailText,
} from "@/lib/server/email-templates/support-ticket-email";

export const runtime = "nodejs";

const PRIORITY_MAP: Record<string, TicketPriority> = {
  "Bình thường": "NORMAL",
  "Cao": "HIGH",
  "Khẩn cấp": "URGENT",
};

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: tickets,
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
    console.error("GET /api/support failed:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tải danh sách hỗ trợ." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      name,
      email,
      category,
      priority,
      subject,
      message,
      orderCode,
      apiKeyPrefix,
    } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "Vui lòng điền đầy đủ các thông tin bắt buộc." },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { success: false, message: "Nội dung hỗ trợ quá ngắn (tối thiểu 10 ký tự)." },
        { status: 400 }
      );
    }

    const ticketPriority = PRIORITY_MAP[priority] || "NORMAL";

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user?.id || null,
        name,
        email,
        category: category || "Khác",
        priority: ticketPriority,
        subject,
        message,
        orderCode: orderCode || null,
        apiKeyPrefix: apiKeyPrefix || null,
        status: "OPEN",
      },
    });

    // Tạo thông báo cho admin
    const { notifyAdmins } = await import("@/lib/server/notifications");
    await notifyAdmins({
      type: "SUPPORT_CREATED",
      title: "Yêu cầu hỗ trợ mới",
      message: `${ticket.email} vừa gửi yêu cầu hỗ trợ: ${ticket.subject}`,
      href: "/admin/support",
      dedupeKey: `support-ticket-created:${ticket.id}`,
      metadata: { ticketId: ticket.id }
    });

    // Send confirmation email
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
          category: category || "Khác",
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
          category: category || "Khác",
          priority,
          orderCode: orderCode || null,
          apiKeyPrefix: apiKeyPrefix || null,
          supportUrl: `${appUrl}/support`,
        }),
      });
    } catch (emailError) {
      console.error("[POST /api/support] Failed to send confirmation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: { message: "Vui lòng đăng nhập để tiếp tục." } }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: { message: "Không có quyền truy cập." } }, { status: 403 });
      }
    }
    console.error("POST /api/support failed:", error);
    return NextResponse.json(
      { success: false, message: "Có lỗi xảy ra khi gửi yêu cầu hỗ trợ." },
      { status: 500 }
    );
  }
}

