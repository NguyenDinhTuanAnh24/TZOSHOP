const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
  const model = await prisma.aiModel.findFirst({
    where: { publicName: 'codexai/gpt-5.5-pro' }
  });
  
  if (!model) {
    console.error("Model not found");
    return;
  }
  
  console.log("Current model:", model);
  
  const updateData = {
    upstreamEndpointType: "RESPONSES"
  };
  
  const updated = await prisma.aiModel.update({
    where: { id: model.id },
    data: updateData
  });
  
  console.log("Updated model:", updated);
}

testUpdate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
