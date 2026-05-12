const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.usageLog.count();
  console.log('Total UsageLogs:', count);
  
  if (count > 0) {
    const lastLogs = await prisma.usageLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        apiKey: true
      }
    });
    console.log('Last 5 logs:', JSON.stringify(lastLogs, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
