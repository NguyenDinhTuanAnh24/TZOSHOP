import type { ChatCompletionRequest, ModelCapability } from "@/lib/ai-gateway/types";

export function requestHasTools(request: ChatCompletionRequest) {
  return Array.isArray(request.tools) && request.tools.length > 0;
}

export function isToolRequestSupported(request: ChatCompletionRequest, capability: ModelCapability) {
  if (!requestHasTools(request)) return true;
  return capability.supportsTools === true;
}
