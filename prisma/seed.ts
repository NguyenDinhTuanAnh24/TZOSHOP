import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ApiFamily } from "@prisma/client";

async function main() {
  console.log("Bắt đầu seeding dữ liệu mới...");

  await seedProducts();
  await seedDevOpsData();

  console.log("Hoàn thành seeding!");
}

async function seedDevOpsData() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      apiKeys: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      creditBuckets: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user) {
    console.log("Bỏ qua seed dev ops: chưa có user.");
    return;
  }

  const existingUsage = await prisma.usageLog.count({
    where: {
      userId: user.id,
      endpoint: "/v1/chat/completions",
      model: { in: ["deepseek/deepseek-v4-flash", "gemini/gemini-3-flash-preview"] },
    },
  });

  if (existingUsage < 5) {
    const now = Date.now();
    const sampleUsage = [
      { model: "deepseek/deepseek-v4-flash", input: 420, output: 310, credits: 1 },
      { model: "deepseek/deepseek-v4-flash", input: 390, output: 280, credits: 1 },
      { model: "gemini/gemini-3-flash-preview", input: 510, output: 460, credits: 2 },
      { model: "gemini/gemini-3-flash-preview", input: 370, output: 250, credits: 1 },
      { model: "deepseek/deepseek-v4-flash", input: 640, output: 520, credits: 2 },
      { model: "gemini/gemini-3-flash-preview", input: 280, output: 190, credits: 1 },
    ];

    await prisma.usageLog.createMany({
      data: sampleUsage.map((item, index) => ({
        userId: user.id,
        apiKeyId: user.apiKeys[0]?.id ?? null,
        creditBucketId: user.creditBuckets[0]?.id ?? null,
        apiFamily: item.model.startsWith("gemini/") ? ApiFamily.GEMINI : ApiFamily.DEEPSEEK,
        model: item.model,
        endpoint: "/v1/chat/completions",
        inputTokens: item.input,
        outputTokens: item.output,
        totalTokens: item.input + item.output,
        creditsCharged: BigInt(item.credits),
        creditsUsed: item.credits,
        status: "SUCCESS",
        createdAt: new Date(now - index * 60 * 60 * 1000),
      })),
    });
  }

  const existingTickets = await prisma.supportTicket.count({
    where: {
      userId: user.id,
      subject: { startsWith: "[DEV]" },
    },
  });

  if (existingTickets === 0) {
    await prisma.supportTicket.createMany({
      data: [
        {
          userId: user.id,
          name: user.name || "Dev User",
          email: user.email,
          category: "Thanh toán",
          priority: "NORMAL",
          subject: "[DEV] Chưa thấy đơn đã thanh toán",
          message: "Tôi đã thanh toán nhưng gói chưa kích hoạt.",
          status: "OPEN",
        },
        {
          userId: user.id,
          name: user.name || "Dev User",
          email: user.email,
          category: "API key",
          priority: "HIGH",
          subject: "[DEV] Không tạo được API key",
          message: "Khi tạo API key, hệ thống báo lỗi xác thực.",
          status: "IN_PROGRESS",
          adminNotes: "Đang kiểm tra cấu hình hệ thống API.",
        },
        {
          userId: user.id,
          name: user.name || "Dev User",
          email: user.email,
          category: "Credits",
          priority: "NORMAL",
          subject: "[DEV] Credits giảm nhanh",
          message: "Tôi muốn kiểm tra vì credits giảm nhanh hơn dự kiến.",
          status: "RESOLVED",
          adminNotes: "Đã gửi bảng usage chi tiết để đối chiếu.",
        },
        {
          userId: user.id,
          name: user.name || "Dev User",
          email: user.email,
          category: "Model/API",
          priority: "URGENT",
          subject: "[DEV] Model không gọi được",
          message: "Model deepseek-v4-flash trả lỗi khi gọi vào buổi sáng.",
          status: "CLOSED",
          adminNotes: "Sự cố đã được khắc phục.",
        },
      ],
    });
  }

  const existingAudits = await prisma.auditLog.count({
    where: {
      action: { in: ["CREATE_ORDER", "MARK_ORDER_PAID", "CREATE_API_KEY", "REVOKE_API_KEY", "UPDATE_PRODUCT", "CREATE_TICKET"] },
      entityId: { startsWith: "dev_" },
    },
  });

  if (existingAudits === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          adminUserId: user.id,
          action: "CREATE_ORDER",
          entityType: "Orders",
          entityId: "dev_order_001",
          metadata: { actorName: user.name || "Dev User", actorEmail: user.email, description: "Tạo đơn hàng thử nghiệm", status: "success", module: "Orders" },
        },
        {
          adminUserId: user.id,
          action: "MARK_ORDER_PAID",
          entityType: "Orders",
          entityId: "dev_order_001",
          metadata: { actorName: user.name || "Dev User", actorEmail: user.email, description: "Đánh dấu đơn hàng đã thanh toán", status: "success", module: "Orders" },
        },
        {
          adminUserId: user.id,
          action: "CREATE_API_KEY",
          entityType: "API Keys",
          entityId: "dev_key_001",
          metadata: { actorName: user.name || "Dev User", actorEmail: user.email, description: "Tạo API key thử nghiệm", status: "success", module: "API Keys" },
        },
        {
          adminUserId: user.id,
          action: "REVOKE_API_KEY",
          entityType: "API Keys",
          entityId: "dev_key_001",
          metadata: { actorName: user.name || "Dev User", actorEmail: user.email, description: "Thu hồi API key thử nghiệm", status: "success", module: "API Keys" },
        },
        {
          adminUserId: user.id,
          action: "UPDATE_PRODUCT",
          entityType: "Products",
          entityId: "dev_product_001",
          metadata: { actorName: user.name || "Dev User", actorEmail: user.email, description: "Cập nhật gói credits thử nghiệm", status: "success", module: "Products" },
        },
        {
          adminUserId: user.id,
          action: "CREATE_TICKET",
          entityType: "Support",
          entityId: "dev_ticket_001",
          metadata: { actorName: user.name || "Dev User", actorEmail: user.email, description: "Tạo ticket hỗ trợ thử nghiệm", status: "success", module: "Support" },
        },
      ],
    });
  }
}

async function seedProducts() {
  const codexModels = [
    "codexai/gpt-5.3-codex",
    "codexai/gpt-5.1-codex",
    "codexai/gpt-5-codex",
    "codexai/gpt-5.4-mini",
    "codexai/gpt-5.1",
    "codexai/gpt-5-mini",
    "codexai/gpt-5.5",
    "codexai/gpt-5.4",
    "codexai/gpt-5.2",
    "codexai/gpt-5",
    "codexai/gpt-5.4-pro",
    "codexai/gpt-5.2-pro",
    "codexai/gpt-5-pro",
    "codexai/gpt-5.5-pro",
  ];

  const claudeModels = [
    "claude/claude-haiku-4.5",
    "claude/claude-sonnet-4.5",
    "claude/claude-sonnet-4.6",
    "claude/claude-opus-4.5",
    "claude/claude-opus-4.6",
    "claude/claude-opus-4.7",
  ];

  const geminiModels = [
    "gemini/gemini-3.1-flash-lite-preview",
    "gemini/gemini-3-flash-preview",
    "gemini/gemini-2.5-pro",
    "gemini/gemini-2.5-flash",
  ];

  const deepseekModels = [
    "deepseek/deepseek-v4-flash",
    "deepseek/deepseek-v4-pro",
  ];

  const allModels = [
    ...codexModels,
    ...claudeModels,
    ...geminiModels,
    ...deepseekModels,
  ];

  const products = [
    // --- DeepSeek ---
    {
      name: "API DeepSeek Trial 7 ngày",
      slug: "deepseek_trial",
      apiFamily: ApiFamily.DEEPSEEK,
      tier: "Trial",
      credits: BigInt(5),
      durationDays: 7,
      priceVnd: 39000,
      apiKeyLimit: 1,
      allowedModels: deepseekModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API DeepSeek 1 tháng",
      slug: "deepseek_monthly",
      apiFamily: ApiFamily.DEEPSEEK,
      tier: "Personal",
      credits: BigInt(40),
      durationDays: 30,
      priceVnd: 300000,
      apiKeyLimit: 1,
      allowedModels: deepseekModels,
      allowedReasoning: [],
      isPopular: true,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API DeepSeek 3 tháng",
      slug: "deepseek_quarterly",
      apiFamily: ApiFamily.DEEPSEEK,
      tier: "Economy",
      credits: BigInt(130),
      durationDays: 90,
      priceVnd: 85000,
      apiKeyLimit: 1,
      allowedModels: deepseekModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API DeepSeek 1 năm",
      slug: "deepseek_yearly",
      apiFamily: ApiFamily.DEEPSEEK,
      tier: "Premium",
      credits: BigInt(600),
      durationDays: 365,
      priceVnd: 3000000,
      apiKeyLimit: 1,
      allowedModels: deepseekModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },

    // --- Gemini ---
    {
      name: "API Gemini Trial 7 ngày",
      slug: "gemini_trial",
      apiFamily: ApiFamily.GEMINI,
      tier: "Trial",
      credits: BigInt(5),
      durationDays: 7,
      priceVnd: 49000,
      apiKeyLimit: 1,
      allowedModels: geminiModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API Gemini 1 tháng",
      slug: "gemini_monthly",
      apiFamily: ApiFamily.GEMINI,
      tier: "Personal",
      credits: BigInt(40),
      durationDays: 30,
      priceVnd: 400000,
      apiKeyLimit: 1,
      allowedModels: geminiModels,
      allowedReasoning: [],
      isPopular: true,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API Gemini 3 tháng",
      slug: "gemini_quarterly",
      apiFamily: ApiFamily.GEMINI,
      tier: "Economy",
      credits: BigInt(130),
      durationDays: 90,
      priceVnd: 1100000,
      apiKeyLimit: 1,
      allowedModels: geminiModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API Gemini 1 năm",
      slug: "gemini_yearly",
      apiFamily: ApiFamily.GEMINI,
      tier: "Premium",
      credits: BigInt(600),
      durationDays: 365,
      priceVnd: 4000000,
      apiKeyLimit: 1,
      allowedModels: geminiModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },

    // --- Claude ---
    {
      name: "API Claude Trial 7 ngày",
      slug: "claude_trial",
      apiFamily: ApiFamily.CLAUDE,
      tier: "Trial",
      credits: BigInt(5),
      durationDays: 7,
      priceVnd: 79000,
      apiKeyLimit: 1,
      allowedModels: claudeModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API Claude 1 tháng",
      slug: "claude_monthly",
      apiFamily: ApiFamily.CLAUDE,
      tier: "Personal",
      credits: BigInt(40),
      durationDays: 30,
      priceVnd: 600000,
      apiKeyLimit: 1,
      allowedModels: claudeModels,
      allowedReasoning: [],
      isPopular: true,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API Claude 3 tháng",
      slug: "claude_quarterly",
      apiFamily: ApiFamily.CLAUDE,
      tier: "Economy",
      credits: BigInt(130),
      durationDays: 90,
      priceVnd: 1650000,
      apiKeyLimit: 1,
      allowedModels: claudeModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API Claude 1 năm",
      slug: "claude_yearly",
      apiFamily: ApiFamily.CLAUDE,
      tier: "Premium",
      credits: BigInt(600),
      durationDays: 365,
      priceVnd: 6000000,
      apiKeyLimit: 1,
      allowedModels: claudeModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },

    // --- CodexAI ---
    {
      name: "API CodexAI Trial 7 ngày",
      slug: "codex_trial",
      apiFamily: ApiFamily.CODEXAI,
      tier: "Trial",
      credits: BigInt(5),
      durationDays: 7,
      priceVnd: 79000,
      apiKeyLimit: 1,
      allowedModels: codexModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API CodexAI 1 tháng",
      slug: "codex_monthly",
      apiFamily: ApiFamily.CODEXAI,
      tier: "Personal",
      credits: BigInt(40),
      durationDays: 30,
      priceVnd: 500000,
      apiKeyLimit: 1,
      allowedModels: codexModels,
      allowedReasoning: [],
      isPopular: true,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API CodexAI 3 tháng",
      slug: "codex_quarterly",
      apiFamily: ApiFamily.CODEXAI,
      tier: "Economy",
      credits: BigInt(130),
      durationDays: 90,
      priceVnd: 1400000,
      apiKeyLimit: 1,
      allowedModels: codexModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API CodexAI 1 năm",
      slug: "codex_yearly",
      apiFamily: ApiFamily.CODEXAI,
      tier: "Premium",
      credits: BigInt(600),
      durationDays: 365,
      priceVnd: 5000000,
      apiKeyLimit: 1,
      allowedModels: codexModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },

    // --- All Models ---
    {
      name: "API All Models Trial 7 ngày",
      slug: "all_models_trial",
      apiFamily: ApiFamily.GEMINI,
      tier: "Trial",
      credits: BigInt(8),
      durationDays: 7,
      priceVnd: 99000,
      apiKeyLimit: 1,
      allowedModels: allModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API All Models 1 tháng",
      slug: "all_models_monthly",
      apiFamily: ApiFamily.GEMINI,
      tier: "Personal",
      credits: BigInt(40),
      durationDays: 30,
      priceVnd: 1200000,
      apiKeyLimit: 1,
      allowedModels: allModels,
      allowedReasoning: [],
      isPopular: true,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API All Models 3 tháng",
      slug: "all_models_quarterly",
      apiFamily: ApiFamily.GEMINI,
      tier: "Economy",
      credits: BigInt(130),
      durationDays: 90,
      priceVnd: 3300000,
      apiKeyLimit: 1,
      allowedModels: allModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
    {
      name: "API All Models 1 năm",
      slug: "all_models_yearly",
      apiFamily: ApiFamily.GEMINI,
      tier: "Premium",
      credits: BigInt(600),
      durationDays: 365,
      priceVnd: 12000000,
      apiKeyLimit: 1,
      allowedModels: allModels,
      allowedReasoning: [],
      isPopular: false,
      isActive: true,
      isContactOnly: false,
    },
  ];

  // Vô hiệu hóa các products cũ không có trong danh sách mới
  const activeSlugs = products.map((p) => p.slug);
  await prisma.product.updateMany({
    where: {
      slug: {
        notIn: activeSlugs,
      },
    },
    data: {
      isActive: false,
    },
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        apiFamily: product.apiFamily,
        tier: product.tier,
        credits: product.credits,
        durationDays: product.durationDays,
        priceVnd: product.priceVnd,
        apiKeyLimit: product.apiKeyLimit,
        allowedModels: product.allowedModels,
        allowedReasoning: product.allowedReasoning,
        isPopular: product.isPopular,
        isActive: product.isActive,
        isContactOnly: product.isContactOnly,
      },
      create: {
        name: product.name,
        slug: product.slug,
        apiFamily: product.apiFamily,
        tier: product.tier,
        credits: product.credits,
        durationDays: product.durationDays,
        priceVnd: product.priceVnd,
        apiKeyLimit: product.apiKeyLimit,
        allowedModels: product.allowedModels,
        allowedReasoning: product.allowedReasoning,
        isPopular: product.isPopular,
        isActive: product.isActive,
        isContactOnly: product.isContactOnly,
      },
    });
  }

  console.log(`Đã seed thành công ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error("Lỗi seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
