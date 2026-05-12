import { prisma } from "@/lib/prisma";

/**
 * Lấy danh sách các model đang hoạt động (isActive = true)
 */
export async function getActiveModels() {
  return await prisma.aiModel.findMany({
    where: { isActive: true },
    select: {
      publicName: true,
      apiFamily: true,
    }
  });
}

/**
 * Lọc danh sách model name, chỉ giữ lại các model đang hoạt động
 */
export async function filterActiveModelNames(modelNames: string[]) {
  const activeModels = await prisma.aiModel.findMany({
    where: {
      publicName: { in: modelNames },
      isActive: true
    },
    select: { publicName: true }
  });
  
  const activeNames = activeModels.map(m => m.publicName);
  return modelNames.filter(name => activeNames.includes(name));
}

/**
 * Lấy danh sách model name đang hoạt động theo ApiFamily
 */
export async function getActiveModelNamesByFamily(apiFamily: string) {
  const models = await prisma.aiModel.findMany({
    where: {
      apiFamily: apiFamily as import("@prisma/client").ApiFamily,
      isActive: true
    },
    select: { publicName: true }
  });
  
  return models.map(m => m.publicName);
}
