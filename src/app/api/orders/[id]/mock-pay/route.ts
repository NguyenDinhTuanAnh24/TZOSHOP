import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/server/current-user";
import { completePaidOrder } from "@/lib/payment-helper";

export const runtime = "nodejs";



type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await requireCurrentUser();

    const order = await prisma.order.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        product: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: {
            message: "Không tìm thấy đơn hàng.",
          },
        },
        {
          status: 404,
        },
      );
    }

    if (order.status === "PAID") {
      const existingBucket = await prisma.creditBucket.findFirst({
        where: { userId: order.userId, productId: order.productId }
      });
      if (existingBucket) {
        return NextResponse.json({
          data: {
            message: "Đơn hàng đã được thanh toán trước đó.",
            order: {
              id: order.id,
              orderCode: order.orderCode,
              status: order.status,
              paidAt: order.paidAt,
            },
          },
        });
      }
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          error: {
            message: "Đơn hàng không ở trạng thái chờ thanh toán.",
          },
        },
        {
          status: 400,
        },
      );
    }

    const result = await completePaidOrder(order.id);

    try {
      await prisma.auditLog.create({
        data: {
          adminUserId: user.id,
          action: "MARK_ORDER_PAID",
          entityType: "Orders",
          entityId: result.order.id,
          metadata: {
            actorName: user.name || user.email,
            actorEmail: user.email,
            description: `Mock-pay đơn hàng ${result.order.orderCode}`,
            module: "Orders",
            status: "success",
          },
        },
      });
    } catch (error) {
      console.error("Create audit log for mock-pay failed:", error);
    }

    return NextResponse.json({
      data: {
        order: {
          id: result.order.id,
          orderCode: result.order.orderCode,
          status: result.order.status,
          paidAt: result.order.paidAt,
        },
      },
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
    console.error("POST /api/orders/[id]/mock-pay failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể xử lý thanh toán giả lập.",
        },
      },
      {
        status: 500,
      },
    );
  }
}
