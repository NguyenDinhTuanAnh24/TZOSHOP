import { Prisma, TicketStatus, TicketPriority } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/server/current-user";

export const runtime = "nodejs";

// Lấy danh sách support ticket
export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as TicketStatus | null;
    const priority = searchParams.get("priority") as TicketPriority | null;

    const where: Prisma.SupportTicketWhereInput = {};
    if (status && (status as string) !== "ALL") where.status = status;
    if (priority && (priority as string) !== "ALL") where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: tickets
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
    console.error("GET /api/admin/support failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi tải ticket." },
      { status: 500 }
    );
  }
}

// Cập nhật trạng thái ticket
export async function PATCH(request: NextRequest) {
  try {
    await requireAdminUser();

    const body = await request.json();
    const { ticketId, status, adminNotes } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: { message: "Thiếu mã ticket." } },
        { status: 400 }
      );
    }

    const updateData: Prisma.SupportTicketUpdateInput = {};
    if (status) updateData.status = status as TicketStatus;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    const { createAuditLog } = await import("@/lib/server/audit-log");
    await createAuditLog({
      action: "ADMIN_UPDATE_TICKET",
      entityType: "SUPPORT_TICKET",
      entityId: updatedTicket.id,
      metadata: updateData
    });

    // 1. Gửi email thông báo
    try {
      const { sendEmail } = await import("@/lib/server/email");
      const {
        createSupportTicketUpdatedEmail,
        createSupportTicketUpdatedEmailText,
      } = await import("@/lib/server/email-templates/support-ticket-updated-email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tzoshop.io.vn";

      await sendEmail({
        to: updatedTicket.email, // Gửi tới email trong ticket (có thể khác email account)
        subject: "Yêu cầu hỗ trợ đã được cập nhật - TzoShop",
        html: createSupportTicketUpdatedEmail({
          name: updatedTicket.user?.name || updatedTicket.name,
          ticketId: updatedTicket.id,
          subject: updatedTicket.subject,
          status: updatedTicket.status,
          adminNote: updatedTicket.adminNotes,
          supportUrl: `${appUrl}/support`
        }),
        text: createSupportTicketUpdatedEmailText({
          name: updatedTicket.user?.name || updatedTicket.name,
          ticketId: updatedTicket.id,
          subject: updatedTicket.subject,
          status: updatedTicket.status,
          adminNote: updatedTicket.adminNotes,
          supportUrl: `${appUrl}/support`
        }),
      });
    } catch (emailError) {
      console.error("Support update email failed:", emailError);
    }

    // 2. Thông báo in-app cho user nếu ticket có userId
    if (updatedTicket.userId) {
      try {
        const { createNotificationOnce } = await import("@/lib/server/notifications");
        await createNotificationOnce({
          userId: updatedTicket.userId,
          type: "SUPPORT_UPDATED",
          title: "Yêu cầu hỗ trợ đã được phản hồi",
          message: `Admin đã phản hồi yêu cầu hỗ trợ: ${updatedTicket.subject}`,
          href: "/support",
          dedupeKey: `support-ticket-updated:${updatedTicket.id}:${status || 'updated'}`,
          metadata: { ticketId: updatedTicket.id, status }
        });
      } catch (e) {
        console.error("Support update notification failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedTicket
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
    console.error("PATCH /api/admin/support failed:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi cập nhật ticket." },
      { status: 500 }
    );
  }
}

