import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Start seeding...");

  await seedModels();
  await seedProducts();

  console.log("Seeding completed.");
}

async function seedModels() {
  let codexProvider = await prisma.aiProvider.findFirst({ where: { apiFamily: 'CODEXAI' } });
  if (!codexProvider) codexProvider = await prisma.aiProvider.create({ data: { name: 'CodeXAI', apiFamily: 'CODEXAI', baseUrl: 'https://api.openai.com/v1', encryptedApiKey: 'dummy' } });

  let claudeProvider = await prisma.aiProvider.findFirst({ where: { apiFamily: 'CLAUDE' } });
  if (!claudeProvider) claudeProvider = await prisma.aiProvider.create({ data: { name: 'Claude', apiFamily: 'CLAUDE', baseUrl: 'https://api.anthropic.com', encryptedApiKey: 'dummy' } });

  let geminiProvider = await prisma.aiProvider.findFirst({ where: { apiFamily: 'GEMINI' } });
  if (!geminiProvider) geminiProvider = await prisma.aiProvider.create({ data: { name: 'Gemini', apiFamily: 'GEMINI', baseUrl: 'https://generativelanguage.googleapis.com', encryptedApiKey: 'dummy' } });

  let deepseekProvider = await prisma.aiProvider.findFirst({ where: { apiFamily: 'DEEPSEEK' } });
  if (!deepseekProvider) deepseekProvider = await prisma.aiProvider.create({ data: { name: 'DeepSeek', apiFamily: 'DEEPSEEK', baseUrl: 'https://api.deepseek.com', encryptedApiKey: 'dummy' } });

  const providers = {
    CODEXAI: codexProvider.id,
    CLAUDE: claudeProvider.id,
    GEMINI: geminiProvider.id,
    DEEPSEEK: deepseekProvider.id,
  };

  const models: Array<{ publicName: string; upstreamModel: string; apiFamily: import("@prisma/client").ApiFamily; providerId: string; inputCreditRate: number; outputCreditRate: number; }> = [
    // CodexAI
    {
      publicName: "codexai/gpt-5.3-codex",
      upstreamModel: "gpt-5.3-codex",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "codexai/gpt-5.1-codex",
      upstreamModel: "gpt-5.1-codex",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "codexai/gpt-5-codex",
      upstreamModel: "gpt-5-codex",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "codexai/gpt-5.4-mini",
      upstreamModel: "gpt-5.4-mini",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "codexai/gpt-5.1",
      upstreamModel: "gpt-5.1",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "codexai/gpt-5-mini",
      upstreamModel: "gpt-5-mini",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "codexai/gpt-5.5",
      upstreamModel: "gpt-5.5",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 4,
      outputCreditRate: 4,
    },
    {
      publicName: "codexai/gpt-5.4",
      upstreamModel: "gpt-5.4",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 4,
      outputCreditRate: 4,
    },
    {
      publicName: "codexai/gpt-5.2",
      upstreamModel: "gpt-5.2",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 4,
      outputCreditRate: 4,
    },
    {
      publicName: "codexai/gpt-5",
      upstreamModel: "gpt-5",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 4,
      outputCreditRate: 4,
    },
    {
      publicName: "codexai/gpt-5.4-pro",
      upstreamModel: "gpt-5.4-pro",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 8,
      outputCreditRate: 8,
    },
    {
      publicName: "codexai/gpt-5.2-pro",
      upstreamModel: "gpt-5.2-pro",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 8,
      outputCreditRate: 8,
    },
    {
      publicName: "codexai/gpt-5-pro",
      upstreamModel: "gpt-5-pro",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 8,
      outputCreditRate: 8,
    },
    {
      publicName: "codexai/gpt-5.5-pro",
      upstreamModel: "gpt-5.5-pro",
      apiFamily: "CODEXAI",
      providerId: providers.CODEXAI,
      inputCreditRate: 50,
      outputCreditRate: 50,
    },

    // Claude
    {
      publicName: "claude/claude-haiku-4.5",
      upstreamModel: "claude-haiku-4.5",
      apiFamily: "CLAUDE",
      providerId: providers.CLAUDE,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "claude/claude-sonnet-4.5",
      upstreamModel: "claude-sonnet-4.5",
      apiFamily: "CLAUDE",
      providerId: providers.CLAUDE,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "claude/claude-sonnet-4.6",
      upstreamModel: "claude-sonnet-4.6",
      apiFamily: "CLAUDE",
      providerId: providers.CLAUDE,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "claude/claude-opus-4.5",
      upstreamModel: "claude-opus-4.5",
      apiFamily: "CLAUDE",
      providerId: providers.CLAUDE,
      inputCreditRate: 2,
      outputCreditRate: 2,
    },
    {
      publicName: "claude/claude-opus-4.6",
      upstreamModel: "claude-opus-4.6",
      apiFamily: "CLAUDE",
      providerId: providers.CLAUDE,
      inputCreditRate: 2,
      outputCreditRate: 2,
    },
    {
      publicName: "claude/claude-opus-4.7",
      upstreamModel: "claude-opus-4.7",
      apiFamily: "CLAUDE",
      providerId: providers.CLAUDE,
      inputCreditRate: 2,
      outputCreditRate: 2,
    },

    // Gemini
    {
      publicName: "gemini/gemini-3.1-flash-lite-preview",
      upstreamModel: "gemini-3.1-flash-lite-preview",
      apiFamily: "GEMINI",
      providerId: providers.GEMINI,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "gemini/gemini-3-flash-preview",
      upstreamModel: "gemini-3-flash-preview",
      apiFamily: "GEMINI",
      providerId: providers.GEMINI,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "gemini/gemini-2.5-pro",
      upstreamModel: "gemini-2.5-pro",
      apiFamily: "GEMINI",
      providerId: providers.GEMINI,
      inputCreditRate: 5,
      outputCreditRate: 5,
    },
    {
      publicName: "gemini/gemini-3.1-pro-preview",
      upstreamModel: "gemini-3.1-pro-preview",
      apiFamily: "GEMINI",
      providerId: providers.GEMINI,
      inputCreditRate: 6,
      outputCreditRate: 6,
    },

    // DeepSeek
    {
      publicName: "deepseek/deepseek-v4-flash",
      upstreamModel: "deepseek-v4-flash",
      apiFamily: "DEEPSEEK",
      providerId: providers.DEEPSEEK,
      inputCreditRate: 1,
      outputCreditRate: 1,
    },
    {
      publicName: "deepseek/deepseek-v4-pro",
      upstreamModel: "deepseek-v4-pro",
      apiFamily: "DEEPSEEK",
      providerId: providers.DEEPSEEK,
      inputCreditRate: 3,
      outputCreditRate: 3,
    },
  ];

  for (const model of models) {
    await prisma.aiModel.upsert({
      where: { publicName: model.publicName },
      update: model,
      create: model,
    });
  }

  console.log(`Seeded ${models.length} models.`);
}

function getTierFromSlug(slug: string) {
  if (slug.endsWith("-trial")) return "Trial";
  if (slug.endsWith("-mini")) return "Mini";
  if (slug.endsWith("-plus")) return "Plus";
  if (slug.endsWith("-pro")) return "Pro";
  if (slug.endsWith("-max")) return "Max";
  if (slug.endsWith("-ultra")) return "Ultra";
  if (slug.endsWith("-enterprise")) return "Enterprise";

  // Long-term suffixes
  if (slug.includes("-pro-")) return "Pro";
  if (slug.includes("-max-")) return "Max";
  if (slug.includes("-plus-")) return "Plus";
  if (slug.includes("-ultra-")) return "Ultra";

  return "Mini";
}

const apiKeyLimitByTier: Record<string, number> = {
  Trial: 1,
  Mini: 2,
  Plus: 3,
  Pro: 5,
  Max: 10,
  Ultra: 20,
  Enterprise: 50,
};

function getModelsForPlanTier(family: string, tier: string): string[] {
  if (family === "DEEPSEEK") {
    const mini = ["deepseek/deepseek-v4-flash"];
    const plus = ["deepseek/deepseek-v4-flash", "deepseek/deepseek-v4-pro"];
    if (tier === "Trial" || tier === "Mini") return mini;
    return plus;
  }

  if (family === "CLAUDE") {
    const trial = ["claude/claude-haiku-4.5"];
    const mini = ["claude/claude-haiku-4.5", "claude/claude-sonnet-4.5"];
    const plus = [...mini, "claude/claude-sonnet-4.6"];
    const pro = [...plus, "claude/claude-opus-4.5"];
    const max = [...pro, "claude/claude-opus-4.6"];
    const ultra = [...max, "claude/claude-opus-4.7"];

    if (tier === "Trial") return trial;
    if (tier === "Mini") return mini;
    if (tier === "Plus") return plus;
    if (tier === "Pro") return pro;
    if (tier === "Max") return max;
    return ultra;
  }

  if (family === "GEMINI") {
    const trial = ["gemini/gemini-3.1-flash-lite-preview"];

    const mini = [
      "gemini/gemini-3.1-flash-lite-preview",
      "gemini/gemini-3-flash-preview",
    ];

    const plus = [
      ...mini,
      "gemini/gemini-2.5-pro",
    ];

    const pro = [
      ...plus,
      "gemini/gemini-3.1-pro-preview",
    ];

    if (tier === "Trial") return trial;
    if (tier === "Mini") return mini;
    if (tier === "Plus") return plus;

    return pro;
  }

  if (family === "CODEXAI") {
    const trial = [
      "codexai/gpt-5.3-codex",
      "codexai/gpt-5.1-codex",
      "codexai/gpt-5-codex",
    ];
    const plus = [
      ...trial,
      "codexai/gpt-5.4-mini",
      "codexai/gpt-5.1",
      "codexai/gpt-5-mini",
    ];
    const pro = [
      ...plus,
      "codexai/gpt-5.5",
      "codexai/gpt-5.4",
      "codexai/gpt-5.2",
      "codexai/gpt-5",
    ];
    const max = [
      ...pro,
      "codexai/gpt-5.4-pro",
      "codexai/gpt-5.2-pro",
      "codexai/gpt-5-pro",
    ];
    const ultra = [...max, "codexai/gpt-5.5-pro"];

    if (tier === "Trial" || tier === "Mini") return trial;
    if (tier === "Plus") return plus;
    if (tier === "Pro") return pro;
    if (tier === "Max") return max;
    return ultra;
  }

  return [];
}

async function seedProducts() {
  const products: Array<{ name: string; slug: string; apiFamily: import("@prisma/client").ApiFamily; credits: bigint; durationDays: number | null; priceVnd: number; isPopular?: boolean; tier?: string; }> = [
    // CodexAI thường
    {
      name: "CodexAI Trial",
      slug: "codexai-trial",
      apiFamily: "CODEXAI",
      credits: BigInt(100_000),
      durationDays: 7,
      priceVnd: 19_000,
    },
    {
      name: "CodexAI Mini",
      slug: "codexai-mini",
      apiFamily: "CODEXAI",
      credits: BigInt(250_000),
      durationDays: null,
      priceVnd: 39_000,
    },
    {
      name: "CodexAI Plus",
      slug: "codexai-plus",
      apiFamily: "CODEXAI",
      credits: BigInt(1_000_000),
      durationDays: null,
      priceVnd: 139_000,
    },
    {
      name: "CodexAI Pro",
      slug: "codexai-pro",
      apiFamily: "CODEXAI",
      credits: BigInt(2_000_000),
      durationDays: null,
      priceVnd: 249_000,
    },
    {
      name: "CodexAI Max",
      slug: "codexai-max",
      apiFamily: "CODEXAI",
      credits: BigInt(5_000_000),
      durationDays: null,
      priceVnd: 699_000,
    },
    {
      name: "CodexAI Ultra",
      slug: "codexai-ultra",
      apiFamily: "CODEXAI",
      credits: BigInt(15_000_000),
      durationDays: null,
      priceVnd: 2_199_000,
    },

    // CodexAI long-term
    {
      name: "CodexAI Pro 3M",
      slug: "codexai-pro-3m",
      apiFamily: "CODEXAI",
      tier: "Pro",
      priceVnd: 710000,
      credits: BigInt(6_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Pro 6M",
      slug: "codexai-pro-6m",
      apiFamily: "CODEXAI",
      tier: "Pro",
      priceVnd: 1345000,
      credits: BigInt(12_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Pro Year",
      slug: "codexai-pro-year",
      apiFamily: "CODEXAI",
      tier: "Pro",
      priceVnd: 2540000,
      credits: BigInt(24_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Max 3M",
      slug: "codexai-max-3m",
      apiFamily: "CODEXAI",
      tier: "Max",
      priceVnd: 1992000,
      credits: BigInt(15_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Max 6M",
      slug: "codexai-max-6m",
      apiFamily: "CODEXAI",
      tier: "Max",
      priceVnd: 3775000,
      credits: BigInt(30_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Max Year",
      slug: "codexai-max-year",
      apiFamily: "CODEXAI",
      tier: "Max",
      priceVnd: 7130000,
      credits: BigInt(60_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Ultra 3M",
      slug: "codexai-ultra-3m",
      apiFamily: "CODEXAI",
      tier: "Ultra",
      priceVnd: 8990000,
      credits: BigInt(75_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Ultra 6M",
      slug: "codexai-ultra-6m",
      apiFamily: "CODEXAI",
      tier: "Ultra",
      priceVnd: 13990000,
      credits: BigInt(120_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Ultra Year",
      slug: "codexai-ultra-year",
      apiFamily: "CODEXAI",
      tier: "Ultra",
      priceVnd: 19990000,
      credits: BigInt(180_000_000),
      durationDays: null,
    },
    {
      name: "CodexAI Enterprise",
      slug: "codexai-enterprise",
      apiFamily: "CODEXAI",
      tier: "Enterprise",
      priceVnd: 0,
      credits: BigInt(300_000_000),
      durationDays: null,
    },

    // Claude thường
    {
      name: "Claude Trial",
      slug: "claude-trial",
      apiFamily: "CLAUDE",
      credits: BigInt(300_000),
      durationDays: 7,
      priceVnd: 19_000,
    },
    {
      name: "Claude Mini",
      slug: "claude-mini",
      apiFamily: "CLAUDE",
      credits: BigInt(1_000_000),
      durationDays: null,
      priceVnd: 69_000,
    },
    {
      name: "Claude Plus",
      slug: "claude-plus",
      apiFamily: "CLAUDE",
      credits: BigInt(2_500_000),
      durationDays: null,
      priceVnd: 149_000,
    },
    {
      name: "Claude Pro",
      slug: "claude-pro",
      apiFamily: "CLAUDE",
      credits: BigInt(6_000_000),
      durationDays: null,
      priceVnd: 399_000,
    },
    {
      name: "Claude Max",
      slug: "claude-max",
      apiFamily: "CLAUDE",
      credits: BigInt(18_000_000),
      durationDays: null,
      priceVnd: 1_199_000,
    },
    {
      name: "Claude Ultra",
      slug: "claude-ultra",
      apiFamily: "CLAUDE",
      credits: BigInt(45_000_000),
      durationDays: null,
      priceVnd: 3_299_000,
    },

    // Claude long-term
    {
      name: "Claude Plus 3M",
      slug: "claude-plus-3m",
      apiFamily: "CLAUDE",
      tier: "Plus",
      priceVnd: 425000,
      credits: BigInt(7_500_000),
      durationDays: null,
    },
    {
      name: "Claude Plus 6M",
      slug: "claude-plus-6m",
      apiFamily: "CLAUDE",
      tier: "Plus",
      priceVnd: 805000,
      credits: BigInt(15_000_000),
      durationDays: null,
    },
    {
      name: "Claude Plus Year",
      slug: "claude-plus-year",
      apiFamily: "CLAUDE",
      tier: "Plus",
      priceVnd: 1520000,
      credits: BigInt(30_000_000),
      durationDays: null,
    },
    {
      name: "Claude Pro 3M",
      slug: "claude-pro-3m",
      apiFamily: "CLAUDE",
      tier: "Pro",
      priceVnd: 1137000,
      credits: BigInt(18_000_000),
      durationDays: null,
    },
    {
      name: "Claude Pro 6M",
      slug: "claude-pro-6m",
      apiFamily: "CLAUDE",
      tier: "Pro",
      priceVnd: 2154000,
      credits: BigInt(36_000_000),
      durationDays: null,
    },
    {
      name: "Claude Pro Year",
      slug: "claude-pro-year",
      apiFamily: "CLAUDE",
      tier: "Pro",
      priceVnd: 4070000,
      credits: BigInt(72_000_000),
      durationDays: null,
    },
    {
      name: "Claude Max 3M",
      slug: "claude-max-3m",
      apiFamily: "CLAUDE",
      tier: "Max",
      priceVnd: 3990000,
      credits: BigInt(54_000_000),
      durationDays: null,
    },
    {
      name: "Claude Max 6M",
      slug: "claude-max-6m",
      apiFamily: "CLAUDE",
      tier: "Max",
      priceVnd: 7990000,
      credits: BigInt(108_000_000),
      durationDays: null,
    },
    {
      name: "Claude Max Year",
      slug: "claude-max-year",
      apiFamily: "CLAUDE",
      tier: "Max",
      priceVnd: 0,
      credits: BigInt(108_000_000),
      durationDays: null,
    },
    {
      name: "Claude Ultra Year",
      slug: "claude-ultra-year",
      apiFamily: "CLAUDE",
      tier: "Ultra",
      priceVnd: 0,
      credits: BigInt(150_000_000),
      durationDays: null,
    },

    // Gemini thường
    {
      name: "Gemini Trial",
      slug: "gemini-trial",
      apiFamily: "GEMINI",
      credits: BigInt(500_000),
      durationDays: 7,
      priceVnd: 9_000,
    },
    {
      name: "Gemini Mini",
      slug: "gemini-mini",
      apiFamily: "GEMINI",
      credits: BigInt(1_000_000),
      durationDays: null,
      priceVnd: 29_000,
    },
    {
      name: "Gemini Plus",
      slug: "gemini-plus",
      apiFamily: "GEMINI",
      credits: BigInt(5_000_000),
      durationDays: null,
      priceVnd: 99_000,
    },
    {
      name: "Gemini Pro",
      slug: "gemini-pro",
      apiFamily: "GEMINI",
      credits: BigInt(10_000_000),
      durationDays: null,
      priceVnd: 179_000,
    },
    {
      name: "Gemini Max",
      slug: "gemini-max",
      apiFamily: "GEMINI",
      credits: BigInt(30_000_000),
      durationDays: null,
      priceVnd: 499_000,
    },
    {
      name: "Gemini Ultra",
      slug: "gemini-ultra",
      apiFamily: "GEMINI",
      credits: BigInt(100_000_000),
      durationDays: null,
      priceVnd: 1_499_000,
    },

    // Gemini long-term
    {
      name: "Gemini Plus 3M",
      slug: "gemini-plus-3m",
      apiFamily: "GEMINI",
      tier: "Plus",
      priceVnd: 282000,
      credits: BigInt(15_000_000),
      durationDays: null,
    },
    {
      name: "Gemini Plus 6M",
      slug: "gemini-plus-6m",
      apiFamily: "GEMINI",
      tier: "Plus",
      priceVnd: 535000,
      credits: BigInt(30_000_000),
      durationDays: null,
    },
    {
      name: "Gemini Plus Year",
      slug: "gemini-plus-year",
      apiFamily: "GEMINI",
      tier: "Plus",
      priceVnd: 1010000,
      credits: BigInt(60_000_000),
      durationDays: null,
    },
    {
      name: "Gemini Pro 3M",
      slug: "gemini-pro-3m",
      apiFamily: "GEMINI",
      tier: "Pro",
      priceVnd: 579000,
      credits: BigInt(30_000_000),
      durationDays: null,
    },
    {
      name: "Gemini Pro 6M",
      slug: "gemini-pro-6m",
      apiFamily: "GEMINI",
      tier: "Pro",
      priceVnd: 1099000,
      credits: BigInt(60_000_000),
      durationDays: null,
    },
    {
      name: "Gemini Pro Year",
      slug: "gemini-pro-year",
      apiFamily: "GEMINI",
      tier: "Pro",
      priceVnd: 2099000,
      credits: BigInt(120_000_000),
      durationDays: null,
    },
    {
      name: "Gemini Max 6M",
      slug: "gemini-max-6m",
      apiFamily: "GEMINI",
      tier: "Max",
      priceVnd: 1399000,
      credits: BigInt(90_000_000),
      durationDays: null,
    },
    {
      name: "Gemini Max Year",
      slug: "gemini-max-year",
      apiFamily: "GEMINI",
      tier: "Max",
      priceVnd: 2599000,
      credits: BigInt(180_000_000),
      durationDays: null,
    },
    {
      name: "Gemini Ultra Year",
      slug: "gemini-ultra-year",
      apiFamily: "GEMINI",
      tier: "Ultra",
      priceVnd: 3499000,
      credits: BigInt(250_000_000),
      durationDays: null,
    },

    // DeepSeek thường
    {
      name: "DeepSeek Trial",
      slug: "deepseek-trial",
      apiFamily: "DEEPSEEK",
      credits: BigInt(1_000_000),
      durationDays: 7,
      priceVnd: 19_000,
    },
    {
      name: "DeepSeek Mini",
      slug: "deepseek-mini",
      apiFamily: "DEEPSEEK",
      credits: BigInt(5_000_000),
      durationDays: null,
      priceVnd: 79_000,
      isPopular: true,
    },
    {
      name: "DeepSeek Plus",
      slug: "deepseek-plus",
      apiFamily: "DEEPSEEK",
      credits: BigInt(10_000_000),
      durationDays: null,
      priceVnd: 139_000,
    },
    {
      name: "DeepSeek Pro",
      slug: "deepseek-pro",
      apiFamily: "DEEPSEEK",
      credits: BigInt(30_000_000),
      durationDays: null,
      priceVnd: 399_000,
    },
    {
      name: "DeepSeek Max",
      slug: "deepseek-max",
      apiFamily: "DEEPSEEK",
      credits: BigInt(100_000_000),
      durationDays: null,
      priceVnd: 1_299_000,
    },
    {
      name: "DeepSeek Ultra",
      slug: "deepseek-ultra",
      apiFamily: "DEEPSEEK",
      credits: BigInt(300_000_000),
      durationDays: null,
      priceVnd: 3_699_000,
    },

    // DeepSeek long-term
    {
      name: "DeepSeek Plus 3M",
      slug: "deepseek-plus-3m",
      apiFamily: "DEEPSEEK",
      tier: "Plus",
      priceVnd: 396000,
      credits: BigInt(30_000_000),
      durationDays: null,
    },
    {
      name: "DeepSeek Plus 6M",
      slug: "deepseek-plus-6m",
      apiFamily: "DEEPSEEK",
      tier: "Plus",
      priceVnd: 751000,
      credits: BigInt(60_000_000),
      durationDays: null,
    },
    {
      name: "DeepSeek Plus Year",
      slug: "deepseek-plus-year",
      apiFamily: "DEEPSEEK",
      tier: "Plus",
      priceVnd: 1418000,
      credits: BigInt(120_000_000),
      durationDays: null,
    },
    {
      name: "DeepSeek Pro 3M",
      slug: "deepseek-pro-3m",
      apiFamily: "DEEPSEEK",
      tier: "Pro",
      priceVnd: 568000,
      credits: BigInt(45_000_000),
      durationDays: null,
    },
    {
      name: "DeepSeek Pro 6M",
      slug: "deepseek-pro-6m",
      apiFamily: "DEEPSEEK",
      tier: "Pro",
      priceVnd: 1077000,
      credits: BigInt(90_000_000),
      durationDays: null,
    },
    {
      name: "DeepSeek Pro Year",
      slug: "deepseek-pro-year",
      apiFamily: "DEEPSEEK",
      tier: "Pro",
      priceVnd: 2035000,
      credits: BigInt(180_000_000),
      durationDays: null,
    },
    {
      name: "DeepSeek Max 6M",
      slug: "deepseek-max-6m",
      apiFamily: "DEEPSEEK",
      tier: "Max",
      priceVnd: 2468000,
      credits: BigInt(200_000_000),
      durationDays: null,
    },
    {
      name: "DeepSeek Max Year",
      slug: "deepseek-max-year",
      apiFamily: "DEEPSEEK",
      tier: "Max",
      priceVnd: 4676000,
      credits: BigInt(400_000_000),
      durationDays: null,
    },
    {
      name: "DeepSeek Ultra Year",
      slug: "deepseek-ultra-year",
      apiFamily: "DEEPSEEK",
      tier: "Ultra",
      priceVnd: 7028000,
      credits: BigInt(600_000_000),
      durationDays: null,
    },
  ];

  for (const product of products) {
    const tier = (product).tier ?? getTierFromSlug(product.slug);
    const apiKeyLimit = apiKeyLimitByTier[tier] ?? 1;

    const allowedModels = getModelsForPlanTier(product.apiFamily, tier);

    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        name: product.name,
        apiFamily: product.apiFamily,
        tier,
        priceVnd: product.priceVnd,
        credits: product.credits,
        durationDays: product.durationDays,
        apiKeyLimit,
        allowedModels,
        allowedReasoning: [],
        isPopular: product.isPopular ?? false,
        isActive: true,
      },
      create: {
        name: product.name,
        slug: product.slug,
        apiFamily: product.apiFamily,
        tier,
        priceVnd: product.priceVnd,
        credits: product.credits,
        durationDays: product.durationDays,
        apiKeyLimit,
        allowedModels,
        allowedReasoning: [],
        isPopular: product.isPopular ?? false,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
