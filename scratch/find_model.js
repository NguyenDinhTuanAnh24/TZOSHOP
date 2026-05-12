const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const model = await prisma.aiModel.findFirst({
    where: { publicName: 'codexai/gpt-5.5-pro' }
  });
  console.log(JSON.stringify(model, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
