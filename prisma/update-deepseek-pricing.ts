import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const DEEPSEEK_UPDATES = [
  { slug: "deepseek-trial", credits: 22000 },
  { slug: "deepseek-mini", credits: 90000 },
  { slug: "deepseek-plus", credits: 160000 },
  { slug: "deepseek-plus-3m", credits: 460000 },
  { slug: "deepseek-pro", credits: 460000 },
  { slug: "deepseek-pro-3m", credits: 660000 },
  { slug: "deepseek-plus-6m", credits: 880000 },
  { slug: "deepseek-pro-6m", credits: 1250000 },
  { slug: "deepseek-max", credits: 1500000 },
  { slug: "deepseek-plus-year", credits: 1650000 },
  { slug: "deepseek-pro-year", credits: 2350000 },
  { slug: "deepseek-max-6m", credits: 2850000 },
  { slug: "deepseek-ultra", credits: 4300000 },
  { slug: "deepseek-max-year", credits: 5400000 },
  { slug: "deepseek-ultra-year", credits: 8100000 },
];

async function main() {
  console.log("Updating DeepSeek product credits...");
  
  for (const item of DEEPSEEK_UPDATES) {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: item.slug }
      });

      if (!product) {
        console.warn(`⚠️  Không tìm thấy product slug: ${item.slug}`);
        continue;
      }

      const updated = await prisma.product.update({
        where: { slug: item.slug },
        data: {
          credits: item.credits,
        }
      });

      const pricePerCredit = Number(updated.credits) > 0 ? updated.priceVnd / Number(updated.credits) : 0;

      console.log(`Updated [${updated.name}] (${updated.slug}):`);
      console.log(`  Credits: ${Number(product.credits).toLocaleString()} -> ${Number(updated.credits).toLocaleString()}`);
      console.log(`  Price: ${updated.priceVnd.toLocaleString()}đ`);
      console.log(`  Price/Credit: ${pricePerCredit.toFixed(4)}đ/credit`);
      console.log("--------------------------------------------------");
    } catch (error) {
      console.error(`❌ Lỗi khi update slug ${item.slug}:`, error);
    }
  }

  console.log("\nDeepSeek update completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
