const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const modelName = "codexai/gpt-5.5-pro";
  console.log(`Updating model: ${modelName} to use RESPONSES endpoint...`);
  
  const updated = await prisma.aiModel.updateMany({
    where: { publicName: modelName },
    data: { upstreamEndpointType: "RESPONSES" }
  });
  
  console.log(`Updated ${updated.count} model(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
