import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const NEW_PRICING = [
  // CodexAI
  { slug: "codexai-trial", credits: 20000, priceVnd: 19000 },
  { slug: "codexai-mini", credits: 45000, priceVnd: 39000 },
  { slug: "codexai-plus", credits: 160000, priceVnd: 139000 },
  { slug: "codexai-pro", credits: 280000, priceVnd: 249000 },
  { slug: "codexai-max", credits: 800000, priceVnd: 699000 },
  { slug: "codexai-ultra", credits: 2500000, priceVnd: 2199000 },
  // CodexAI dài hạn
  { slug: "codexai-pro-3m", credits: 850000, priceVnd: 710000 },
  { slug: "codexai-pro-6m", credits: 1600000, priceVnd: 1345000 },
  { slug: "codexai-pro-year", credits: 3050000, priceVnd: 2540000 },
  { slug: "codexai-max-3m", credits: 2300000, priceVnd: 1992000 },
  { slug: "codexai-max-6m", credits: 4400000, priceVnd: 3775000 },
  { slug: "codexai-max-year", credits: 8400000, priceVnd: 7130000 },
  { slug: "codexai-ultra-3m", credits: 10500000, priceVnd: 8990000 },
  { slug: "codexai-ultra-6m", credits: 16500000, priceVnd: 13990000 },
  { slug: "codexai-ultra-year", credits: 23500000, priceVnd: 19990000 },
  { slug: "codexai-enterprise", credits: 30000000, priceVnd: 0 },
  // Claude
  { slug: "claude-trial", credits: 15000, priceVnd: 19000 },
  { slug: "claude-mini", credits: 60000, priceVnd: 69000 },
  { slug: "claude-plus", credits: 130000, priceVnd: 149000 },
  { slug: "claude-pro", credits: 350000, priceVnd: 399000 },
  { slug: "claude-max", credits: 1000000, priceVnd: 1199000 },
  { slug: "claude-ultra", credits: 2800000, priceVnd: 3299000 },
  // Claude dài hạn
  { slug: "claude-plus-3m", credits: 380000, priceVnd: 425000 },
  { slug: "claude-plus-6m", credits: 720000, priceVnd: 805000 },
  { slug: "claude-plus-year", credits: 1350000, priceVnd: 1520000 },
  { slug: "claude-pro-3m", credits: 1000000, priceVnd: 1137000 },
  { slug: "claude-pro-6m", credits: 1900000, priceVnd: 2154000 },
  { slug: "claude-pro-year", credits: 3600000, priceVnd: 4070000 },
  { slug: "claude-max-3m", credits: 3500000, priceVnd: 3990000 },
  { slug: "claude-max-6m", credits: 7000000, priceVnd: 7990000 },
  { slug: "claude-max-year", credits: 0, priceVnd: 0 },
  { slug: "claude-ultra-year", credits: 0, priceVnd: 0 },
  // Gemini
  { slug: "gemini-trial", credits: 15000, priceVnd: 9000 },
  { slug: "gemini-mini", credits: 45000, priceVnd: 29000 },
  { slug: "gemini-plus", credits: 150000, priceVnd: 99000 },
  { slug: "gemini-pro", credits: 270000, priceVnd: 179000 },
  { slug: "gemini-max", credits: 750000, priceVnd: 499000 },
  { slug: "gemini-ultra", credits: 2200000, priceVnd: 1499000 },
  // Gemini dài hạn
  { slug: "gemini-plus-3m", credits: 430000, priceVnd: 282000 },
  { slug: "gemini-plus-6m", credits: 820000, priceVnd: 535000 },
  { slug: "gemini-plus-year", credits: 1550000, priceVnd: 1010000 },
  { slug: "gemini-pro-3m", credits: 850000, priceVnd: 579000 },
  { slug: "gemini-pro-6m", credits: 1600000, priceVnd: 1099000 },
  { slug: "gemini-pro-year", credits: 3100000, priceVnd: 2099000 },
  { slug: "gemini-max-6m", credits: 2100000, priceVnd: 1399000 },
  { slug: "gemini-max-year", credits: 3900000, priceVnd: 2599000 },
  { slug: "gemini-ultra-year", credits: 5200000, priceVnd: 3499000 },
  // DeepSeek
  { slug: "deepseek-trial", credits: 30000, priceVnd: 19000 },
  { slug: "deepseek-mini", credits: 120000, priceVnd: 79000 },
  { slug: "deepseek-plus", credits: 220000, priceVnd: 139000 },
  { slug: "deepseek-pro", credits: 650000, priceVnd: 399000 },
  { slug: "deepseek-max", credits: 2000000, priceVnd: 1299000 },
  { slug: "deepseek-ultra", credits: 5500000, priceVnd: 3699000 },
  // DeepSeek dài hạn
  { slug: "deepseek-plus-3m", credits: 620000, priceVnd: 396000 },
  { slug: "deepseek-plus-6m", credits: 1180000, priceVnd: 751000 },
  { slug: "deepseek-plus-year", credits: 2250000, priceVnd: 1418000 },
  { slug: "deepseek-pro-3m", credits: 950000, priceVnd: 568000 },
  { slug: "deepseek-pro-6m", credits: 1800000, priceVnd: 1077000 },
  { slug: "deepseek-pro-year", credits: 3400000, priceVnd: 2035000 },
  { slug: "deepseek-max-6m", credits: 3900000, priceVnd: 2468000 },
  { slug: "deepseek-max-year", credits: 7400000, priceVnd: 4676000 },
  { slug: "deepseek-ultra-year", credits: 11000000, priceVnd: 7028000 },
];

const BREAK_EVEN = 3400 / 4500; // ~0.755

async function main() {
  console.log("Starting product pricing update...");
  console.log(`Break-even point: ${BREAK_EVEN.toFixed(3)} VND/credit\n`);

  for (const item of NEW_PRICING) {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: item.slug },
      });

      if (!product) {
        console.warn(`⚠️  Không tìm thấy product slug: ${item.slug}`);
        continue;
      }

      const updated = await prisma.product.update({
        where: { slug: item.slug },
        data: {
          credits: item.credits,
          priceVnd: item.priceVnd,
        },
      });

      const oldCredits = Number(product.credits);
      const newCredits = Number(updated.credits);
      const pricePerCredit = newCredits > 0 ? updated.priceVnd / newCredits : 0;
      
      let status = "";
      if (updated.priceVnd === 0) {
        status = "ℹ️  Gói liên hệ";
      } else if (pricePerCredit < BREAK_EVEN) {
        status = "❌ CÓ NGUY CƠ LỖ";
      } else {
        status = "✅ OK";
      }

      console.log(`Updated [${updated.name}] (${updated.slug}):`);
      console.log(`  Credits: ${oldCredits.toLocaleString()} -> ${newCredits.toLocaleString()}`);
      console.log(`  Price: ${product.priceVnd.toLocaleString()}đ -> ${updated.priceVnd.toLocaleString()}đ`);
      console.log(`  Price/Credit: ${pricePerCredit.toFixed(3)}đ/credit - ${status}`);
      console.log("--------------------------------------------------");
    } catch (error) {
      console.error(`❌ Lỗi khi update slug ${item.slug}:`, error);
    }
  }

  console.log("\nUpdate completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
