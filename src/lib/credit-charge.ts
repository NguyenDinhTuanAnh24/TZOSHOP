import { prisma } from "@/lib/prisma";

export async function calculateChargedCredits(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
}) {
  const model = await prisma.aiModel.findFirst({
    where: {
      publicName: params.model,
      isActive: true,
    },
  });

  if (!model) {
    throw new Error("Model không tồn tại hoặc chưa được hỗ trợ.");
  }

  // Rate is credits per 1,000 tokens
  const inputCredits = (params.inputTokens / 1000) * Number(model.inputCreditRate);
  const outputCredits = (params.outputTokens / 1000) * Number(model.outputCreditRate);

  // We don't have cache rate in the new schema yet, but if we did, it would go here
  const chargedCreditsOld = Math.ceil(inputCredits + outputCredits);

  return {
    model,
    chargedCredits: Math.max(chargedCreditsOld / 500000, 0.000001),
  };
}
