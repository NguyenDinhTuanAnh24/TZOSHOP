import { NextRequest, NextResponse } from "next/server";
import { ApiFamily } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findActiveApiKeyByPlainTextKey } from "@/lib/api-key-auth";
import { decryptText } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { calculateCreditsUsed, consumeCredits } from "@/lib/server/credits";
import { checkCreditAlertsForUser } from "@/lib/server/notifications";
import { tryParseToolCallFromText } from "@/lib/ai-gateway/adapters/agent-tool-fallback";

export const runtime = "nodejs";

// --- IN-MEMORY CACHE ---
const modelCache = new Map<string, { data: AiModelWithProvider | null, expiresAt: number }>();
const allModelsCache = new Map<string, { data: AiModelWithProvider[], expiresAt: number }>();

async function getCachedAiModel(modelName: string): Promise<AiModelWithProvider | null> {
  const now = Date.now();
  const cached = modelCache.get(modelName);
  if (cached && cached.expiresAt > now) return cached.data;

  const model = await prisma.aiModel.findFirst({
    where: { publicName: modelName },
    include: { provider: true },
  }) as unknown as AiModelWithProvider | null;

  modelCache.set(modelName, { data: model, expiresAt: now + 60000 }); // 60s
  return model;
}

async function getCachedAllModels(upstreamModel: string): Promise<AiModelWithProvider[]> {
  const now = Date.now();
  const cached = allModelsCache.get(upstreamModel);
  if (cached && cached.expiresAt > now) return cached.data;

  const models = await prisma.aiModel.findMany({
    where: {
      upstreamModel: upstreamModel,
      isActive: true,
      provider: { isActive: true },
    },
    include: { provider: true },
  }) as unknown as AiModelWithProvider[];

  allModelsCache.set(upstreamModel, { data: models, expiresAt: now + 60000 }); // 60s
  return models;
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.replace("Bearer ", "").trim();
}

async function logFailedUsage(params: {
  userId: string;
  apiKeyId: string;
  creditBucketId?: string | null;
  apiFamily: ApiFamily;
  model: string;
  errorMessage: string;
  errorCode?: string;
  httpStatus?: number;
  status?: string;
}) {
  try {
    await prisma.usageLog.create({
      data: {
        userId: params.userId,
        apiKeyId: params.apiKeyId,
        creditBucketId: params.creditBucketId,
        apiFamily: params.apiFamily,
        model: params.model,
        endpoint: "/api/v1/chat/completions",
        status: params.status || "FAILED",
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
        httpStatus: params.httpStatus,
        creditsCharged: BigInt(0),
        creditsUsed: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    });
  } catch (error) {
    console.error("[UsageLog] Failed to log failed usage:", error);
  }
}

function extractResponsesText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as Record<string, unknown>;
  if (typeof d.output_text === "string") return d.output_text;
  if (typeof d.text === "string") return d.text;
  if (typeof d.content === "string") return d.content;

  if (Array.isArray(d.output)) {
    const output = d.output as Array<Record<string, unknown>>;
    const outputText = output
      .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
      .map((content) => {
        const c = content as Record<string, unknown>;
        return typeof c.text === "string" ? c.text : "";
      })
      .join("");
    if (outputText) return outputText;
  }

  const choices = d.choices as Array<{ message?: { content?: string } }> | undefined;
  if (choices?.[0]?.message?.content) return choices[0].message.content;
  return "";
}

function isRetryableError(status: number, bodyText: string) {
  if (status === 429) return true;
  const lowerText = bodyText.toLowerCase();
  return (
    lowerText.includes("saturated") ||
    lowerText.includes("too many requests") ||
    lowerText.includes("please try again later")
  );
}

interface AiModelWithProvider {
  id: string;
  publicName: string;
  upstreamModel: string;
  upstreamEndpointType: string;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsAgent: boolean;
  inputCreditRate: number | string;
  outputCreditRate: number | string;
  isActive: boolean;
  providerId: string;
  provider: {
    id: string;
    name: string;
    baseUrl: string;
    encryptedApiKey: string;
    isActive: boolean;
  };
}

type ChatMessage = {
  role: string;
  content: string | unknown;
  tool_call_id?: string;
};

type IncomingBody = {
  model?: string;
  messages?: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string | string[];
  tools?: unknown[];
  tool_choice?: unknown;
  parallel_tool_calls?: boolean;
  response_format?: unknown;
  completionOptions?: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    reasoning?: boolean;
    reasoningBudgetTokens?: number;
  };
};

function hasToolSignals(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => hasToolSignals(item));

  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.tool_calls) && obj.tool_calls.length > 0) return true;
  if (obj.type === "function_call" || obj.type === "tool_call") return true;

  for (const v of Object.values(obj)) {
    if (hasToolSignals(v)) return true;
  }
  return false;
}

function buildToolInstruction(tools: unknown[], toolChoice: unknown) {
  return `You are an AI assistant. Call tools by outputting ONLY valid JSON:
{"tool":"name","arguments":{}}
Tools: ${JSON.stringify(tools)}
Choice: ${JSON.stringify(toolChoice ?? "auto")}`;
}

function normalizeToolMessages(messages: ChatMessage[]) {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "user",
        content: `Tool result for ${message.tool_call_id ?? "tool"}:\n${String(message.content ?? "")}`,
      };
    }

    return {
      ...message,
      role: message.role === "developer" ? "system" : message.role,
    };
  });
}

function buildUpstreamBody(params: {
  aiModel: AiModelWithProvider;
  body: IncomingBody;
  messages: ChatMessage[];
  stream: boolean;
  modelSupportsTools: boolean;
  agentFallbackEnabled: boolean;
}) {
  const { aiModel, body, messages, stream, modelSupportsTools, agentFallbackEnabled } = params;
  const isResponsesAPI = aiModel.upstreamEndpointType === "RESPONSES";
  const completionOptions = body.completionOptions;
  let normalizedMessages = normalizeToolMessages(messages);

  if (agentFallbackEnabled && Array.isArray(body.tools) && body.tools.length > 0) {
    console.log("[AGENT_FALLBACK_ORIGINAL_MESSAGES_COUNT]", messages.length);

    let lastUserMessage = [...normalizedMessages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage && normalizedMessages.length > 0) {
      lastUserMessage = normalizedMessages[normalizedMessages.length - 1];
    }

    normalizedMessages = [
      {
        role: "system",
        content: buildToolInstruction(body.tools, body.tool_choice),
      },
      ...(lastUserMessage ? [lastUserMessage] : []),
    ];

    console.log("[AGENT_FALLBACK_NORMALIZED_MESSAGES]", normalizedMessages.length);
  }

  const payload: Record<string, unknown> = isResponsesAPI
    ? {
        model: aiModel.upstreamModel,
        input: normalizedMessages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        })),
        instructions: normalizedMessages.find((m) => m.role === "system")?.content || undefined,
        stream,
      }
    : {
        model: aiModel.upstreamModel,
        messages: normalizedMessages,
        stream,
      };

  const safeTemperature =
    body.temperature !== undefined ? body.temperature : completionOptions?.temperature;
  const safeTopP = body.top_p !== undefined ? body.top_p : completionOptions?.topP;
  const safeMaxTokens =
    body.max_tokens !== undefined
      ? body.max_tokens
      : body.max_completion_tokens !== undefined
        ? body.max_completion_tokens
        : completionOptions?.maxTokens;

  if (safeTemperature !== undefined) payload.temperature = safeTemperature;
  if (safeTopP !== undefined) payload.top_p = safeTopP;
  if (safeMaxTokens !== undefined) payload.max_tokens = safeMaxTokens;
  if (body.presence_penalty !== undefined) payload.presence_penalty = body.presence_penalty;
  if (body.frequency_penalty !== undefined) payload.frequency_penalty = body.frequency_penalty;
  if (body.stop !== undefined) payload.stop = body.stop;
  if (body.response_format !== undefined) payload.response_format = body.response_format;

  if (modelSupportsTools && body.tools !== undefined) {
    payload.tools = body.tools;
  }
  if (modelSupportsTools && body.tool_choice !== undefined) {
    payload.tool_choice = body.tool_choice;
  }
  if (modelSupportsTools && body.parallel_tool_calls !== undefined) {
    payload.parallel_tool_calls = body.parallel_tool_calls;
  }

  console.log("[TZOSHOP_UPSTREAM_PAYLOAD_DEBUG]", {
    model: payload.model,
    stream: payload.stream,
    hasTools: Array.isArray(payload.tools),
    toolsCount: Array.isArray(payload.tools) ? payload.tools.length : 0,
    toolChoice: payload.tool_choice,
    parallelToolCalls: payload.parallel_tool_calls,
  });
  console.log("[UPSTREAM_SAFE_PAYLOAD_KEYS]", Object.keys(payload));
  console.log(
    "[UPSTREAM_MESSAGES_ROLES]",
    Array.isArray(payload.messages)
      ? (payload.messages as Array<{ role?: string }>).map((m) => m.role ?? "")
      : Array.isArray(payload.input)
        ? (payload.input as Array<{ role?: string }>).map((m) => m.role ?? "")
        : [],
  );

  return payload;
}

async function handleStreamingChatCompletion(params: {
  apiKey: { userId: string; id: string; apiFamily: ApiFamily };
  bucket: { id: string };
  candidates: AiModelWithProvider[];
  messages: ChatMessage[];
  modelName: string;
  body: IncomingBody;
  requestHasTools: boolean;
  startTime: number;
}) {
  const { apiKey, bucket, candidates, messages, modelName, body, requestHasTools, startTime } = params;

  for (let i = 0; i < candidates.length; i++) {
    const aiModel = candidates[i];
    const provider = aiModel.provider;
    const isResponsesAPI = aiModel.upstreamEndpointType === "RESPONSES";

    let providerApiKey: string;
    try {
      providerApiKey = decryptText(provider.encryptedApiKey);
    } catch (err) {
      console.error(`[Fallback] Decrypt error for provider ${provider.name}:`, err);
      continue;
    }

    const endpointPath = isResponsesAPI ? "/responses" : "/chat/completions";
    const baseUrl = provider.baseUrl.endsWith("/") ? provider.baseUrl.slice(0, -1) : provider.baseUrl;
    const upstreamUrl = `${baseUrl}${endpointPath}`;

    const upstreamBody = buildUpstreamBody({
      aiModel,
      body,
      messages,
      stream: true,
      modelSupportsTools: aiModel.supportsTools === true,
      agentFallbackEnabled: requestHasTools && aiModel.supportsAgent === true && aiModel.supportsTools !== true,
    });
    const isAgentFallbackMode = requestHasTools && aiModel.supportsAgent === true && aiModel.supportsTools !== true;

    try {
      const upstreamHeaders = {
        Authorization: `Bearer ${providerApiKey}`,
        "Content-Type": "application/json",
        Accept: body.stream ? "text/event-stream" : "application/json",
      };
      console.log("[UPSTREAM_HEADERS_KEYS]", Object.keys(upstreamHeaders));

      const validateMs = Date.now() - startTime;
      const fetchStartTime = Date.now();

      const upstreamResponse = await fetch(upstreamUrl, {
        method: "POST",
        headers: upstreamHeaders,
        body: JSON.stringify(upstreamBody),
      });

      if (!upstreamResponse.ok) {
        const errorText = await upstreamResponse.text();
        console.error(
          `[Upstream Error Response] Provider: ${provider.name}, Status: ${upstreamResponse.status}, Body: ${errorText}`,
        );

        if (isRetryableError(upstreamResponse.status, errorText) && i < candidates.length - 1) {
          continue;
        }

        let errorMsg = `Upstream error: ${upstreamResponse.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
        } catch {}

        await logFailedUsage({
          userId: apiKey.userId,
          apiKeyId: apiKey.id,
          creditBucketId: bucket.id,
          apiFamily: apiKey.apiFamily,
          model: modelName,
          errorMessage: errorMsg,
          errorCode:
            upstreamResponse.status === 429 || errorText.toLowerCase().includes("saturated")
              ? "PROVIDER_RATE_LIMITED"
              : "UPSTREAM_ERROR",
          httpStatus: upstreamResponse.status,
        });

        return NextResponse.json(
          {
            error: {
              message:
                "Nhà cung cấp dịch vụ AI đang quá tải hoặc bận. Vui lòng thử lại sau giây lát.",
              type: "upstream_error",
              code: "PROVIDER_RATE_LIMITED",
            },
          },
          { status: upstreamResponse.status === 429 ? 429 : 503 },
        );
      }

      const reader = upstreamResponse.body?.getReader();
      if (!reader) throw new Error("Failed to get reader from upstream response");

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          let buffer = "";
          let promptTokens = 0;
          let completionTokens = 0;
          let assistantText = "";
          let hasToolCalls = false;
          let isFallbackTextStream = false;
          let bufferedChunks: Uint8Array[] = [];

          let firstByteTime = 0;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!value) continue;

              if (firstByteTime === 0) firstByteTime = Date.now();

              // 1. Pass-through immediately for non-fallback or if we detected text
              if (!isAgentFallbackMode || isFallbackTextStream) {
                controller.enqueue(value);
              } else {
                bufferedChunks.push(value);
              }

              const chunkText = decoder.decode(value, { stream: true });
              buffer += chunkText;

              const events = buffer.split("\n\n");
              buffer = events.pop() ?? "";

              for (const event of events) {
                const lines = event.split("\n");
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const rawData = trimmed.replace(/^data:\s?/, "");
                  if (rawData === "[DONE]") continue;

                  try {
                    const parsed = JSON.parse(rawData) as Record<string, unknown>;
                    if (hasToolSignals(parsed)) hasToolCalls = true;

                    const usage = parsed.usage as Record<string, number> | undefined;
                    if (usage) {
                      promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? promptTokens;
                      completionTokens = usage.completion_tokens ?? usage.output_tokens ?? completionTokens;
                    }

                    if (isResponsesAPI) {
                      const contentPart = extractResponsesText(parsed);
                      if (contentPart) assistantText += contentPart;
                    } else {
                      const choices = parsed.choices as Array<{ delta?: { content?: string } }> | undefined;
                      const deltaContent = choices?.[0]?.delta?.content;
                      if (typeof deltaContent === "string") assistantText += deltaContent;
                    }

                    if (isAgentFallbackMode && !isFallbackTextStream) {
                      const trimmedAss = assistantText.trimStart();
                      if (trimmedAss.length > 5 && !trimmedAss.startsWith("{") && !trimmedAss.startsWith("<") && !trimmedAss.startsWith("[")) {
                        isFallbackTextStream = true;
                        for (const chunk of bufferedChunks) {
                          controller.enqueue(chunk);
                        }
                        bufferedChunks = [];
                      }
                    }
                  } catch {}
                }
              }
            }

            if (isAgentFallbackMode && !isFallbackTextStream) {
              const parsedToolCall = tryParseToolCallFromText(assistantText);

              if (parsedToolCall) {
                const created = Math.floor(Date.now() / 1000);
                const chunkId = `chatcmpl-${Date.now()}`;
                const toolChunk = {
                  id: chunkId,
                  object: "chat.completion.chunk",
                  created,
                  model: modelName,
                  choices: [
                    {
                      index: 0,
                      delta: {
                        tool_calls: [
                          {
                            index: 0,
                            id: parsedToolCall.id,
                            type: "function",
                            function: {
                              name: parsedToolCall.function.name,
                              arguments: parsedToolCall.function.arguments,
                            },
                          },
                        ],
                      },
                      finish_reason: null,
                    },
                  ],
                };

                const finishChunk = {
                  id: chunkId,
                  object: "chat.completion.chunk",
                  created,
                  model: modelName,
                  choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
                };

                controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolChunk)}\n\n`));
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`));
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              } else {
                for (const chunk of bufferedChunks) {
                  controller.enqueue(chunk);
                }
              }
            }

            const hasOutput = assistantText.trim().length > 0 || hasToolCalls;
            if (!hasOutput && isAgentFallbackMode) {
              logFailedUsage({
                userId: apiKey.userId,
                apiKeyId: apiKey.id,
                creditBucketId: bucket.id,
                apiFamily: apiKey.apiFamily,
                model: modelName,
                errorMessage: "Upstream returned empty stream payload",
                errorCode: "EMPTY_PROVIDER_RESPONSE",
                httpStatus: 200,
              }).catch(console.error);
              return;
            }

            if (promptTokens === 0) {
              const inputContent = messages
                .map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
                .join(" ");
              promptTokens = Math.ceil(inputContent.length / 4);
            }
            if (completionTokens === 0) {
              completionTokens = Math.ceil(assistantText.length / 4);
            }

            const creditsUsed = calculateCreditsUsed({
              promptTokens,
              completionTokens,
              inputRate: Number(aiModel.inputCreditRate),
              outputRate: Number(aiModel.outputCreditRate),
            });

            const dbLogStart = Date.now();
            // Non-blocking DB logging
            Promise.all([
              consumeCredits({
                userId: apiKey.userId,
                apiKeyId: apiKey.id,
                creditBucketId: bucket.id,
                creditsUsed,
                usageData: {
                  model: modelName,
                  apiFamily: apiKey.apiFamily,
                  endpoint: "/api/v1/chat/completions",
                  inputTokens: promptTokens,
                  outputTokens: completionTokens,
                  totalTokens: promptTokens + completionTokens,
                },
              }),
              checkCreditAlertsForUser(apiKey.userId),
            ]).catch(console.error);

            console.log("[STREAM_PERFORMANCE_LOG]", {
              validateMs,
              upstreamFirstByteMs: firstByteTime > 0 ? firstByteTime - fetchStartTime : 0,
              totalMs: Date.now() - startTime,
              dbLogTriggeredMs: Date.now() - dbLogStart,
            });
          } catch (error) {
            console.error("[Stream] Stream error:", error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        status: upstreamResponse.status,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    } catch (error) {
      console.error(`[Stream] Fetch error for provider ${provider.name}:`, error);
      if (i < candidates.length - 1) continue;
      return NextResponse.json(
        {
          error: {
            message: "Lỗi kết nối tới nhà cung cấp AI.",
            type: "server_error",
            code: "internal_error",
          },
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: { message: "Không có provider khả dụng.", type: "upstream_error", code: "no_provider_available" } },
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        {
          error: {
            message: "Vui lòng cung cấp API key trong header Authorization.",
            type: "invalid_request_error",
            code: "missing_api_key",
          },
        },
        { status: 401 },
      );
    }

    const apiKey = await findActiveApiKeyByPlainTextKey(token);
    if (!apiKey || apiKey.revokedAt) {
      return NextResponse.json(
        {
          error: {
            message: "API key không hợp lệ hoặc đã bị thu hồi.",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        },
        { status: 401 },
      );
    }

    const rateLimit = await checkRateLimit(apiKey.id, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: {
            message: "Bạn đã vượt giới hạn request. Vui lòng thử lại sau.",
            type: "rate_limit_exceeded",
          },
        },
        { status: 429 },
      );
    }

    const bucket = apiKey.creditBucket;
    const isExpired = bucket?.expiresAt && new Date(bucket.expiresAt) < new Date();
    if (!bucket || !bucket.isActive || isExpired) {
      return NextResponse.json(
        {
          error: { message: "Gói credits không khả dụng.", type: "insufficient_quota", code: "quota_exceeded" },
        },
        { status: 401 },
      );
    }
    if (bucket.creditsRemaining <= BigInt(0)) {
      return NextResponse.json(
        {
          error: { message: "Tài khoản đã hết credits.", type: "insufficient_quota", code: "quota_exceeded" },
        },
        { status: 402 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as IncomingBody;

    console.log("[INCOMING]", {
      model: body?.model,
      stream: body?.stream,
      messagesCount: Array.isArray(body?.messages) ? body.messages.length : 0,
      hasTools: Array.isArray(body?.tools),
      toolsCount: Array.isArray(body?.tools) ? body.tools.length : 0,
      toolNames: Array.isArray(body?.tools)
        ? body.tools
            .filter((tool): tool is { name?: string; function?: { name?: string } } => {
              return typeof tool === "object" && tool !== null;
            })
            .map((tool) => tool.name ?? tool.function?.name)
            .filter((name): name is string => typeof name === "string")
        : [],
    });

    const modelName = body.model;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const stream = body.stream === true;

    if (!modelName) {
      return NextResponse.json(
        { error: { message: "Vui lòng chỉ định model.", type: "invalid_request_error", code: "missing_model" } },
        { status: 400 },
      );
    }

    if (!bucket.allowedModels.includes(modelName)) {
      return NextResponse.json(
        {
          error: {
            message: "Model không nằm trong gói đã mua.",
            type: "invalid_request_error",
            code: "model_not_allowed",
          },
        },
        { status: 403 },
      );
    }

    const aiModel = await getCachedAiModel(modelName);

    if (!aiModel) {
      return NextResponse.json(
        { error: { message: "Model không tồn tại.", type: "invalid_request_error", code: "model_not_found" } },
        { status: 404 },
      );
    }

    if (!aiModel.isActive) {
      return NextResponse.json(
        {
          error: {
            message: "Model này hiện đang tạm ngưng. Vui lòng chọn model khác.",
            type: "model_inactive",
            code: "MODEL_INACTIVE",
          },
        },
        { status: 403 },
      );
    }

    const requestHasTools = Array.isArray(body.tools) && body.tools.length > 0;
    const supportsTools = aiModel.supportsTools === true;
    const supportsAgent = aiModel.supportsAgent === true;

    if (requestHasTools && !supportsTools && !supportsAgent) {
      return NextResponse.json(
        {
          error: {
            message:
              "Model này chưa hỗ trợ tool calling/function calling. Vui lòng dùng model Agent hoặc chuyển extension sang Chat/Edit/Apply.",
            type: "unsupported_feature",
            code: "tools_not_supported",
          },
        },
        { status: 400 },
      );
    }

    const allModels = await getCachedAllModels(aiModel.upstreamModel);

    const candidates = [aiModel, ...allModels.filter((m) => m.id !== aiModel.id)];

    if (stream) {
      return handleStreamingChatCompletion({
        apiKey,
        bucket,
        candidates,
        messages,
        modelName,
        body,
        requestHasTools,
        startTime,
      });
    }

    for (let i = 0; i < candidates.length; i++) {
      const currentModel = candidates[i];
      const currentProvider = currentModel.provider;
      const isResponsesAPI = currentModel.upstreamEndpointType === "RESPONSES";

      let currentProviderApiKey: string;
      try {
        currentProviderApiKey = decryptText(currentProvider.encryptedApiKey);
      } catch {
        continue;
      }

      const endpointPath = isResponsesAPI ? "/responses" : "/chat/completions";
      const baseUrl = currentProvider.baseUrl.endsWith("/") ? currentProvider.baseUrl.slice(0, -1) : currentProvider.baseUrl;
      const upstreamUrl = `${baseUrl}${endpointPath}`;

      const upstreamBody = buildUpstreamBody({
        aiModel: currentModel,
        body,
        messages,
        stream: false,
        modelSupportsTools: currentModel.supportsTools === true,
        agentFallbackEnabled: requestHasTools && currentModel.supportsAgent === true && currentModel.supportsTools !== true,
      });

      try {
        const upstreamHeaders = {
          Authorization: `Bearer ${currentProviderApiKey}`,
          "Content-Type": "application/json",
          Accept: body.stream ? "text/event-stream" : "application/json",
        };
        console.log("[UPSTREAM_HEADERS_KEYS]", Object.keys(upstreamHeaders));

        const upstreamResponse = await fetch(upstreamUrl, {
          method: "POST",
          headers: upstreamHeaders,
          body: JSON.stringify(upstreamBody),
        });

        if (!upstreamResponse.ok) {
          const errorText = await upstreamResponse.text();
          console.error(
            `[Upstream Error Response] Provider: ${currentProvider.name}, Status: ${upstreamResponse.status}, Body: ${errorText}`,
          );

          if (isRetryableError(upstreamResponse.status, errorText) && i < candidates.length - 1) {
            continue;
          }

          let errorMsg = `Upstream error: ${upstreamResponse.status}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
          } catch {}

          await logFailedUsage({
            userId: apiKey.userId,
            apiKeyId: apiKey.id,
            creditBucketId: bucket.id,
            apiFamily: apiKey.apiFamily,
            model: modelName,
            errorMessage: errorMsg,
            errorCode:
              upstreamResponse.status === 429 || errorText.toLowerCase().includes("saturated")
                ? "PROVIDER_RATE_LIMITED"
                : "UPSTREAM_ERROR",
            httpStatus: upstreamResponse.status,
          });

          return NextResponse.json(
            {
              error: {
                message:
                  "Nhà cung cấp dịch vụ AI đang quá tải hoặc bận. Vui lòng thử lại sau giây lát.",
                type: "upstream_error",
                code: "PROVIDER_RATE_LIMITED",
              },
            },
            { status: upstreamResponse.status === 429 ? 429 : 503 },
          );
        }

        const responseData = (await upstreamResponse.json()) as Record<string, unknown>;
        const hasToolCalls = hasToolSignals(responseData);
        const isAgentFallbackMode =
          requestHasTools && currentModel.supportsAgent === true && currentModel.supportsTools !== true;
        const assistantContent = isResponsesAPI
          ? extractResponsesText(responseData)
          : ((responseData.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? "");

        let parsedFallbackToolCall: ReturnType<typeof tryParseToolCallFromText> = null;
        if (isAgentFallbackMode && assistantContent) {
          parsedFallbackToolCall = tryParseToolCallFromText(assistantContent);
          console.log("[AGENT_FALLBACK_UPSTREAM_TEXT]", assistantContent.slice(0, 2000));
          console.log("[AGENT_FALLBACK_PARSED_TOOL_CALL]", parsedFallbackToolCall);
        }

        if ((!assistantContent || assistantContent.trim().length === 0) && !hasToolCalls && !parsedFallbackToolCall) {
          if (i < candidates.length - 1) continue;
          return NextResponse.json(
            { error: { message: "Nhà cung cấp AI trả về phản hồi rỗng." } },
            { status: 502 },
          );
        }

        let promptTokens =
          (responseData.usage as Record<string, number> | undefined)?.prompt_tokens ??
          (responseData.usage as Record<string, number> | undefined)?.input_tokens;
        let completionTokens =
          (responseData.usage as Record<string, number> | undefined)?.completion_tokens ??
          (responseData.usage as Record<string, number> | undefined)?.output_tokens;

        if (typeof promptTokens !== "number") {
          const inputContent = messages
            .map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
            .join(" ");
          promptTokens = Math.ceil(inputContent.length / 4);
        }
        if (typeof completionTokens !== "number") {
          completionTokens = Math.ceil(assistantContent.length / 4);
        }

        const creditsUsed = calculateCreditsUsed({
          promptTokens,
          completionTokens,
          inputRate: Number(currentModel.inputCreditRate),
          outputRate: Number(currentModel.outputCreditRate),
        });

        const result = await consumeCredits({
          userId: apiKey.userId,
          apiKeyId: apiKey.id,
          creditBucketId: bucket.id,
          creditsUsed,
          usageData: {
            model: modelName,
            apiFamily: apiKey.apiFamily,
            endpoint: "/api/v1/chat/completions",
            inputTokens: promptTokens,
            outputTokens: completionTokens,
            totalTokens: promptTokens + completionTokens,
          },
        });

        checkCreditAlertsForUser(apiKey.userId).catch(() => {});

        const finalResponse =
          parsedFallbackToolCall
            ? {
                id: (responseData.id as string) || `chatcmpl-${Date.now()}`,
                object: "chat.completion",
                created: (responseData.created as number) || Math.floor(Date.now() / 1000),
                model: modelName,
                choices: [
                  {
                    index: 0,
                    message: {
                      role: "assistant",
                      content: null,
                      tool_calls: [parsedFallbackToolCall],
                    },
                    finish_reason: "tool_calls",
                  },
                ],
                usage: {
                  prompt_tokens: promptTokens,
                  completion_tokens: completionTokens,
                  total_tokens: promptTokens + completionTokens,
                },
              }
            : isResponsesAPI && !("choices" in responseData)
            ? {
                id: (responseData.id as string) || `chatcmpl-${Date.now()}`,
                object: "chat.completion",
                created: (responseData.created as number) || Math.floor(Date.now() / 1000),
                model: modelName,
                choices: [
                  {
                    index: 0,
                    message: { role: "assistant", content: assistantContent },
                    finish_reason: "stop",
                  },
                ],
                usage: {
                  prompt_tokens: promptTokens,
                  completion_tokens: completionTokens,
                  total_tokens: promptTokens + completionTokens,
                },
              }
            : responseData;

        return NextResponse.json({
          ...finalResponse,
          model: modelName,
          usage: {
            ...((finalResponse as Record<string, unknown>).usage as Record<string, unknown> | undefined),
            credits_charged: creditsUsed,
            credits_remaining: result.remaining.toString(),
          },
        });
      } catch (error) {
        if (i < candidates.length - 1) continue;
        throw error;
      }
    }

    return NextResponse.json(
      { error: { message: "Không có provider khả dụng.", type: "upstream_error", code: "no_provider_available" } },
      { status: 503 },
    );
  } catch (error) {
    console.error("[Gateway] /api/v1/chat/completions failed:", error);
    return NextResponse.json(
      { error: { message: "Đã có lỗi xảy ra trên hệ thống Gateway." } },
      { status: 500 },
    );
  }
}
