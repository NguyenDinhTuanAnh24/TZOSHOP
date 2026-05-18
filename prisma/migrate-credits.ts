import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting credit migration (Scale down by 500,000)...");

  // 1. Migrate Products
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to migrate.`);
  for (const product of products) {
    const oldCredits = Number(product.credits);
    const newCredits = Math.max(1, Math.round(oldCredits / 500000));
    
    await prisma.product.update({
      where: { id: product.id },
      data: {
        credits: BigInt(newCredits),
      },
    });
    console.log(`Product [${product.name}]: ${oldCredits} -> ${newCredits}`);
  }

  // 2. Migrate CreditBuckets
  const buckets = await prisma.creditBucket.findMany();
  console.log(`Found ${buckets.length} credit buckets to migrate.`);
  for (const bucket of buckets) {
    const oldTotal = Number(bucket.creditsTotal);
    const oldRemaining = Number(bucket.creditsRemaining);
    const newTotal = Math.max(1, Math.round(oldTotal / 500000));
    const newRemaining = Math.max(0, Math.round(oldRemaining / 500000));

    await prisma.creditBucket.update({
      where: { id: bucket.id },
      data: {
        creditsTotal: BigInt(newTotal),
        creditsRemaining: BigInt(newRemaining),
      },
    });
    console.log(`Bucket [${bucket.id}]: Total ${oldTotal}->${newTotal}, Remaining ${oldRemaining}->${newRemaining}`);
  }

  // 3. Migrate UsageLogs
  const logs = await prisma.usageLog.findMany();
  console.log(`Found ${logs.length} usage logs to migrate.`);
  for (const log of logs) {
    const oldCharged = Number(log.creditsCharged);
    const oldUsed = log.creditsUsed || 0;
    const newCharged = Math.max(0, Math.round(oldCharged / 500000));
    const newUsed = Math.max(0, Math.round(oldUsed / 500000));

    await prisma.usageLog.update({
      where: { id: log.id },
      data: {
        creditsCharged: BigInt(newCharged),
        creditsUsed: newUsed,
      },
    });
  }

  console.log("Credit migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
