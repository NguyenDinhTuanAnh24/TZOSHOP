const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = await prisma.aiModel.findMany({
    where: { publicName: { contains: 'gpt-5.5' } }
  });
  console.log(JSON.stringify(models, null, 2));
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
