import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  apiFamily: string;
  tier: string;
  credits: bigint;
  durationDays: number;
  priceVnd: number;
  apiKeyLimit: number;
  allowedModels: string[];
  allowedReasoning: string[];
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET() {
  try {
    const products: ProductItem[] = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          apiFamily: "asc",
        },
        {
          priceVnd: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        apiFamily: true,
        tier: true,
        credits: true,
        durationDays: true,
        priceVnd: true,
        apiKeyLimit: true,
        allowedModels: true,
        allowedReasoning: true,
        isPopular: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as ProductItem[];

    const activeModels = await prisma.aiModel.findMany({
      where: { isActive: true },
      select: { publicName: true }
    });
    const activeModelNames = new Set(activeModels.map(m => m.publicName));

    const data = products.map((product: ProductItem) => {
      // Nếu không có model nào được kích hoạt trong DB (hoặc DB đã được dọn sạch),
      // sử dụng danh sách allowedModels gốc của Product để hiển thị đầy đủ tính năng.
      const activeAllowedModels = activeModelNames.size > 0
        ? product.allowedModels.filter(m => activeModelNames.has(m))
        : product.allowedModels;
      
      return {
        ...product,
        credits: product.credits.toString(),
        allowedModels: activeAllowedModels,
      };
    });

    return NextResponse.json({
      data,
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
    console.error("GET /api/plans failed:", error);

    return NextResponse.json(
      {
        error: {
          message: "Không thể tải danh sách gói credits.",
        },
      },
      {
        status: 500,
      },
    );
  }
}
