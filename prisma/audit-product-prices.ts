import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const CREDIT_PER_BAG = 4500;
const GOLD_BAG_COST = 3400;
const BREAK_EVEN = GOLD_BAG_COST / CREDIT_PER_BAG; // ~0.755

async function main() {
  console.log("=== PRODUCT PRICE AUDIT ===");
  console.log(`Config: 1 bag = ${GOLD_BAG_COST}đ = ${CREDIT_PER_BAG} credits`);
  console.log(`Break-even: ${BREAK_EVEN.toFixed(3)}đ/credit\n`);

  const products = await prisma.product.findMany({
    orderBy: { apiFamily: 'asc' }
  });

  let riskCount = 0;
  let healthyCount = 0;

  for (const p of products) {
    const credits = Number(p.credits);
    if (p.priceVnd === 0 || credits === 0) {
      console.log(`⚪ [${p.apiFamily}] ${p.name.padEnd(30)} | price=0 | Gói liên hệ/ẩn`);
      continue;
    }

    const pricePerCredit = p.priceVnd / credits;
    let status = "";
    let icon = "";

    if (pricePerCredit >= 1) {
      icon = "✅";
      status = "Tốt";
      healthyCount++;
    } else if (pricePerCredit >= 0.8) {
      icon = "🟡";
      status = "Lời mỏng";
      healthyCount++;
    } else if (pricePerCredit >= BREAK_EVEN) {
      icon = "⚠️";
      status = "Sát hòa vốn";
      healthyCount++;
    } else {
      icon = "❌";
      status = "Nguy cơ lỗ";
      riskCount++;
    }

    console.log(
      `${icon} [${p.apiFamily}] ${p.name.padEnd(30)} | ` +
      `Price/Credit: ${pricePerCredit.toFixed(3)}đ | ` +
      `Price: ${p.priceVnd.toLocaleString()}đ | ` +
      `Credits: ${credits.toLocaleString()} | ` +
      `${status}`
    );
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Healthy/Safe: ${healthyCount}`);
  console.log(`At Risk: ${riskCount}`);
  
  if (riskCount > 0) {
    console.log("\n🚨 CẢNH BÁO: Phát hiện gói có nguy cơ lỗ!");
  } else {
    console.log("\n✨ Tất cả các gói đều đạt ngưỡng an toàn.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
