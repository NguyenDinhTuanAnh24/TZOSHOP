const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLog() {
  const log = await prisma.usageLog.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(log, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
}

checkLog()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
