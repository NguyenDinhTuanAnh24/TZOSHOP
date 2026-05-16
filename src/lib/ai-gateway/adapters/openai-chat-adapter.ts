import type { ChatCompletionRequest, ProviderRoute } from "@/lib/ai-gateway/types";

export function buildOpenAICompatiblePayload(params: {
  route: ProviderRoute;
  request: ChatCompletionRequest;
  stream: boolean;
}) {
  const { route, request, stream } = params;
  const isResponsesAPI = route.upstreamEndpointType === "RESPONSES";

  const messages = Array.isArray(request.messages) ? request.messages : [];

  const payload: Record<string, unknown> = isResponsesAPI
    ? {
        model: route.upstreamModel,
        input: messages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        })),
        instructions: messages.find((m) => m.role === "system")?.content || undefined,
        stream,
      }
    : {
        model: route.upstreamModel,
        messages,
        stream,
      };

  if (request.temperature !== undefined) payload.temperature = request.temperature;
  if (request.max_tokens !== undefined) payload.max_tokens = request.max_tokens;
  if (request.top_p !== undefined) payload.top_p = request.top_p;
  if (request.stop !== undefined) payload.stop = request.stop;
  if (request.tools !== undefined) payload.tools = request.tools;
  if (request.tool_choice !== undefined) payload.tool_choice = request.tool_choice;
  if (request.parallel_tool_calls !== undefined) payload.parallel_tool_calls = request.parallel_tool_calls;
  if (request.response_format !== undefined) payload.response_format = request.response_format;

  return payload;
}
