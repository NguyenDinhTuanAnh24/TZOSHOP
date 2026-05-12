const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const model = await prisma.aiModel.findFirst({
    where: { publicName: 'codexai/gpt-5.5-pro' }
  });
  
  if (!model) {
    console.log("Model codexai/gpt-5.5-pro not found.");
    return;
  }
  
  console.log("Current upstreamEndpointType:", model.upstreamEndpointType);
  
  if (model.upstreamEndpointType !== 'RESPONSES') {
    console.log("Updating to RESPONSES...");
    await prisma.aiModel.update({
      where: { id: model.id },
      data: { upstreamEndpointType: 'RESPONSES' }
    });
    console.log("Updated successfully.");
  } else {
    console.log("Already set to RESPONSES.");
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
