import { prisma } from "@/lib/prisma";
import type { ProviderRoute } from "@/lib/ai-gateway/types";

export async function resolveProviderForModel(modelName: string): Promise<ProviderRoute | null> {
  const model = await prisma.aiModel.findFirst({
    where: { publicName: modelName, isActive: true, provider: { isActive: true } },
    include: { provider: true },
  });

  if (!model) return null;

  return {
    modelId: model.id,
    publicName: model.publicName,
    apiFamily: model.apiFamily,
    upstreamModel: model.upstreamModel,
    upstreamEndpointType: model.upstreamEndpointType,
    providerId: model.providerId,
    providerName: model.provider.name,
    baseUrl: model.provider.baseUrl,
    encryptedApiKey: model.provider.encryptedApiKey,
    inputCreditRate: Number(model.inputCreditRate),
    outputCreditRate: Number(model.outputCreditRate),
    capability: {
      supportsStreaming: model.supportsStreaming,
      supportsTools: model.supportsTools,
      supportsAgent: model.supportsAgent,
    },
  };
}
