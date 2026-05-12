import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiFamily } from "@prisma/client";
import { findActiveApiKeyByPlainTextKey } from "@/lib/api-key-auth";
import { decryptText } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { calculateCreditsUsed, consumeCredits } from "@/lib/server/credits";
import { checkCreditAlertsForUser } from "@/lib/server/notifications";

export const runtime = "nodejs";

/**
 * Lấy Bearer token từ header Authorization
 */
function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.replace("Bearer ", "").trim();
}

/**
 * Ghi nhật ký sử dụng thất bại (UsageLog FAILED)
 */
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

/**
 * Trích xuất nội dung từ Responses API response
 */
/**
 * Trích xuất nội dung từ Responses API response
 */
function extractResponsesText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  
  const d = data as Record<string, unknown>;
  
  if (typeof d.output_text === "string") return d.output_text;
  if (typeof d.text === "string") return d.text;
  if (typeof d.content === "string") return d.content;

  if (Array.isArray(d.output)) {
    const output = d.output as Array<Record<string, unknown>>;
    const outputText = output
      ?.flatMap((item) => (item.content as unknown[]) ?? [])
      ?.map((content) => (content as Record<string, string>).text ?? "")
      ?.join("");
    if (outputText) return outputText;
  }

  const choices = d.choices as Array<{ message?: { content?: string } }> | undefined;
  if (choices?.[0]?.message?.content) return choices[0].message.content;

  return "";
}

/**
 * Kiểm tra xem lỗi từ upstream có thể thử lại với provider khác không
 */
function isRetryableError(status: number, bodyText: string) {
  if (status === 429) return true;
  const lowerText = bodyText.toLowerCase();
  return lowerText.includes("saturated") ||
    lowerText.includes("too many requests") ||
    lowerText.includes("please try again later");
}

interface AiModelWithProvider {
  id: string;
  publicName: string;
  upstreamModel: string;
  upstreamEndpointType: string;
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

interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Xử lý Streaming Chat Completion (OpenAI-compatible)
 */
async function handleStreamingChatCompletion(params: {
  apiKey: { userId: string; id: string; apiFamily: ApiFamily };
  bucket: { id: string };
  candidates: AiModelWithProvider[];
  messages: ChatMessage[];
  temperature: number;
  max_tokens: number;
  modelName: string;
}) {
  const { apiKey, bucket, candidates, messages, temperature, max_tokens, modelName } = params;

  for (let i = 0; i < candidates.length; i++) {
    const aiModel = candidates[i];
    const provider = aiModel.provider;
    const isResponsesAPI = aiModel.upstreamEndpointType === "RESPONSES";

    let providerApiKey;
    try {
      providerApiKey = decryptText(provider.encryptedApiKey);
    } catch (err) {
      console.error(`[Fallback] Decrypt error for provider ${provider.name}:`, err);
      continue;
    }

    const endpointPath = isResponsesAPI ? "/responses" : "/chat/completions";
    const baseUrl = provider.baseUrl.endsWith("/") ? provider.baseUrl.slice(0, -1) : provider.baseUrl;
    const upstreamUrl = `${baseUrl}${endpointPath}`;

    console.log(`[TzoShop upstream debug] Attempt ${i + 1}/${candidates.length}: ${provider.name} -> ${aiModel.upstreamModel} (Stream)`);

    let upstreamBody: Record<string, unknown>;
    if (isResponsesAPI) {
      upstreamBody = {
        model: aiModel.upstreamModel,
        input: messages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
        })),
        stream: true,
        instructions: messages.find((m) => m.role === "system")?.content || undefined
      };
    } else {
      upstreamBody = {
        model: aiModel.upstreamModel,
        messages,
        temperature,
        max_tokens,
        stream: true,
      };
    }

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${providerApiKey}`,
        },
        body: JSON.stringify(upstreamBody),
      });

      if (!upstreamResponse.ok) {
        const errorText = await upstreamResponse.text();
        console.error(`[Upstream Error Response] Provider: ${provider.name}, Status: ${upstreamResponse.status}, Body: ${errorText}`);

        if (isRetryableError(upstreamResponse.status, errorText) && i < candidates.length - 1) {
          console.warn(`[Fallback] Provider ${provider.name} failed. Trying next...`);
          continue;
        }

        // Not retryable or last candidate
        let errorMsg = `Upstream error: ${upstreamResponse.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
        } catch { }

        await logFailedUsage({
          userId: apiKey.userId,
          apiKeyId: apiKey.id,
          creditBucketId: bucket.id,
          apiFamily: apiKey.apiFamily,
          model: modelName,
          errorMessage: errorMsg,
          errorCode: (upstreamResponse.status === 429 || errorText.toLowerCase().includes("saturated")) ? "PROVIDER_RATE_LIMITED" : "UPSTREAM_ERROR",
          httpStatus: upstreamResponse.status,
        });

        return NextResponse.json({
          error: {
            message: "Nhà cung cấp dịch vụ AI đang quá tải hoặc bận. Vui lòng thử lại sau giây lát.",
            type: "upstream_error",
            code: "PROVIDER_RATE_LIMITED"
          }
        }, { status: upstreamResponse.status === 429 ? 429 : 503 });
      }

      // SUCCESS! Start streaming
      console.log(`[Fallback] Success with provider: ${provider.name}`);
      const encoder = new TextEncoder();
      const reader = upstreamResponse.body?.getReader();
      if (!reader) throw new Error("Failed to get reader from upstream response");

      const stream = new ReadableStream({
        async start(controller) {
          let fullAssistantContent = "";
          let promptTokens = 0;
          let completionTokens = 0;
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

                const data = trimmedLine.replace("data: ", "");
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data) as Record<string, unknown>;

                  let content = "";
                  if (isResponsesAPI) {
                    const outputText = parsed.output_text as Record<string, string> | undefined;
                    const contentObj = parsed.content as Record<string, string> | undefined;
                    
                    if (outputText?.delta) content = outputText.delta;
                    else if (parsed.delta) content = parsed.delta as string;
                    else if (contentObj?.delta) content = contentObj.delta;
                    else content = extractResponsesText(parsed);
                  } else {
                    const choices = parsed.choices as Array<{ delta?: { content?: string }, message?: { content?: string }, finish_reason?: string }> | undefined;
                    const delta = parsed.delta as { content?: string } | undefined;

                    if (choices?.[0]?.delta?.content) content = choices[0].delta.content;
                    else if (choices?.[0]?.message?.content) content = choices[0].message.content;
                    else if (delta?.content) content = delta.content;
                    else if (parsed.content) content = parsed.content as string;
                    else if (parsed.text) content = parsed.text as string;
                  }

                  if (content) {
                    fullAssistantContent += content;
                  }

                  if (parsed.usage) {
                    const usage = parsed.usage as Record<string, number>;
                    promptTokens = usage.prompt_tokens || promptTokens;
                    completionTokens = usage.completion_tokens || completionTokens;
                  }

                  const choices = parsed.choices as Array<{ finish_reason?: string }> | undefined;
                  const clientChunk = {
                    id: (parsed.id as string) || `chatcmpl-${Date.now()}`,
                    object: "chat.completion.chunk",
                    created: (parsed.created as number) || Math.floor(Date.now() / 1000),
                    model: modelName,
                    choices: [{
                      index: 0,
                      delta: content ? { content } : {},
                      finish_reason: choices?.[0]?.finish_reason || (parsed.done ? "stop" : null)
                    }]
                  };

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(clientChunk)}\n\n`));
                } catch { }
              }
            }

            if (fullAssistantContent.trim().length === 0) {
              await logFailedUsage({
                userId: apiKey.userId,
                apiKeyId: apiKey.id,
                creditBucketId: bucket.id,
                apiFamily: apiKey.apiFamily,
                model: modelName,
                errorMessage: "Upstream returned empty content",
                errorCode: "EMPTY_PROVIDER_RESPONSE",
                httpStatus: 200,
              });
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { message: "Nhà cung cấp AI trả về phản hồi rỗng." } })}\n\n`));
            } else {
              if (promptTokens === 0) {
                const inputContent = messages?.map((m: { content: string }) => m.content).join(" ") || "";
                promptTokens = Math.ceil(inputContent.length / 4);
              }
              if (completionTokens === 0) {
                completionTokens = Math.ceil(fullAssistantContent.length / 4);
              }

              const creditsUsed = calculateCreditsUsed({
                promptTokens,
                completionTokens,
                inputRate: Number(aiModel.inputCreditRate),
                outputRate: Number(aiModel.outputCreditRate),
              });

              await consumeCredits({
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
              checkCreditAlertsForUser(apiKey.userId).catch(() => { });
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (error) {
            console.error("[Stream] Stream error:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { message: "Mất kết nối stream với nhà cung cấp AI." } })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    } catch (error) {
      console.error(`[Stream] Fetch error for provider ${provider.name}:`, error);
      if (i < candidates.length - 1) continue;
      return NextResponse.json({ error: { message: "Lỗi kết nối tới nhà cung cấp AI.", type: "server_error", code: "internal_error" } }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: { message: "Vui lòng cung cấp API key trong header Authorization.", type: "invalid_request_error", code: "missing_api_key" } }, { status: 401 });
    }

    const apiKey = await findActiveApiKeyByPlainTextKey(token);
    if (!apiKey || apiKey.revokedAt) {
      return NextResponse.json({ error: { message: "API key không hợp lệ hoặc đã bị thu hồi.", type: "invalid_request_error", code: "invalid_api_key" } }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(apiKey.id, 60);
    if (!rateLimit.success) {
      return NextResponse.json({ error: { message: "Bạn đã vượt giới hạn request. Vui lòng thử lại sau.", type: "rate_limit_exceeded" } }, { status: 429 });
    }

    const bucket = apiKey.creditBucket;
    const isExpired = bucket?.expiresAt && new Date(bucket.expiresAt) < new Date();

    if (!bucket || !bucket.isActive || isExpired) {
      return NextResponse.json({ error: { message: "Gói credits không khả dụng.", type: "insufficient_quota", code: "quota_exceeded" } }, { status: 401 });
    }

    if (bucket.creditsRemaining <= BigInt(0)) {
      return NextResponse.json({ error: { message: "Tài khoản đã hết credits.", type: "insufficient_quota", code: "quota_exceeded" } }, { status: 402 });
    }

    const body = await request.json().catch(() => ({}));
    const { model: modelName, messages, temperature = 0.7, max_tokens = 1000, stream } = body;

    if (!modelName) {
      return NextResponse.json({ error: { message: "Vui lòng chỉ định model.", type: "invalid_request_error", code: "missing_model" } }, { status: 400 });
    }

    if (!bucket.allowedModels.includes(modelName)) {
      return NextResponse.json({ error: { message: "Model không nằm trong gói đã mua.", type: "invalid_request_error", code: "model_not_allowed" } }, { status: 403 });
    }

    const aiModel = await prisma.aiModel.findFirst({
      where: { publicName: modelName },
      include: { provider: true }
    }) as unknown as AiModelWithProvider | null;

    if (!aiModel) {
      return NextResponse.json({ error: { message: "Model không tồn tại.", type: "invalid_request_error", code: "model_not_found" } }, { status: 404 });
    }

    if (!aiModel.isActive) {
      return NextResponse.json({
        error: {
          message: "Model này hiện đang tạm ngưng. Vui lòng chọn model khác.",
          type: "model_inactive",
          code: "MODEL_INACTIVE"
        }
      }, { status: 403 });
    }

    // --- Fallback Selection ---
    const allModels = await prisma.aiModel.findMany({
      where: {
        upstreamModel: aiModel.upstreamModel,
        isActive: true,
        provider: { isActive: true }
      },
      include: { provider: true }
    }) as unknown as AiModelWithProvider[];

    const candidates = [
      aiModel,
      ...allModels.filter(m => m.id !== aiModel.id)
    ];

    if (stream === true) {
      return handleStreamingChatCompletion({
        apiKey,
        bucket,
        candidates,
        messages,
        temperature,
        max_tokens,
        modelName,
      });
    }

    // --- Non-Streaming with Fallback ---
    for (let i = 0; i < candidates.length; i++) {
      const currentModel = candidates[i];
      const currentProvider = currentModel.provider;
      const isResponsesAPI = currentModel.upstreamEndpointType === "RESPONSES";

      let currentProviderApiKey;
      try {
        currentProviderApiKey = decryptText(currentProvider.encryptedApiKey);
      } catch { continue; }

      const endpointPath = isResponsesAPI ? "/responses" : "/chat/completions";
      const baseUrl = currentProvider.baseUrl.endsWith("/") ? currentProvider.baseUrl.slice(0, -1) : currentProvider.baseUrl;
      const upstreamUrl = `${baseUrl}${endpointPath}`;

      console.log(`[TzoShop upstream debug] Attempt ${i + 1}/${candidates.length}: ${currentProvider.name} -> ${currentModel.upstreamModel} (Non-Stream)`);

      let upstreamBody: Record<string, unknown>;
      if (isResponsesAPI) {
        upstreamBody = {
          model: currentModel.upstreamModel,
          input: messages.map((m: ChatMessage) => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
          })),
          stream: false,
          instructions: messages.find((m: ChatMessage) => m.role === "system")?.content || undefined
        };
      } else {
        upstreamBody = {
          model: currentModel.upstreamModel,
          messages,
          temperature,
          max_tokens,
          stream: false,
        };
      }

      try {
        const upstreamResponse = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentProviderApiKey}`,
          },
          body: JSON.stringify(upstreamBody),
        });

        if (!upstreamResponse.ok) {
          const errorText = await upstreamResponse.text();
          console.error(`[Upstream Error Response] Provider: ${currentProvider.name}, Status: ${upstreamResponse.status}, Body: ${errorText}`);

          if (isRetryableError(upstreamResponse.status, errorText) && i < candidates.length - 1) {
            continue;
          }

          let errorMsg = `Upstream error: ${upstreamResponse.status}`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
          } catch { }

          await logFailedUsage({
            userId: apiKey.userId,
            apiKeyId: apiKey.id,
            creditBucketId: bucket.id,
            apiFamily: apiKey.apiFamily,
            model: modelName,
            errorMessage: errorMsg,
            errorCode: (upstreamResponse.status === 429 || errorText.toLowerCase().includes("saturated")) ? "PROVIDER_RATE_LIMITED" : "UPSTREAM_ERROR",
            httpStatus: upstreamResponse.status,
          });

          return NextResponse.json({
            error: {
              message: "Nhà cung cấp dịch vụ AI đang quá tải hoặc bận. Vui lòng thử lại sau giây lát.",
              type: "upstream_error",
              code: "PROVIDER_RATE_LIMITED"
            }
          }, { status: upstreamResponse.status === 429 ? 429 : 503 });
        }

        const responseData = await upstreamResponse.json();
        let assistantContent = "";
        if (isResponsesAPI) {
          assistantContent = extractResponsesText(responseData);
        } else {
          assistantContent = responseData.choices?.[0]?.message?.content || "";
        }

        if (!assistantContent || assistantContent.trim().length === 0) {
          if (i < candidates.length - 1) continue;
          return NextResponse.json({ error: { message: "Nhà cung cấp AI trả về phản hồi rỗng." } }, { status: 502 });
        }

        // SUCCESS
        let promptTokens = responseData.usage?.prompt_tokens || responseData.usage?.input_tokens;
        let completionTokens = responseData.usage?.completion_tokens || responseData.usage?.output_tokens;

        if (typeof promptTokens !== "number") {
          const inputContent = messages?.map((m: { content: string }) => m.content).join(" ") || "";
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

        checkCreditAlertsForUser(apiKey.userId).catch(() => { });

        const finalResponse = isResponsesAPI ? {
          id: responseData.id || `chatcmpl-${Date.now()}`,
          object: "chat.completion",
          created: responseData.created || Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [{ index: 0, message: { role: "assistant", content: assistantContent }, finish_reason: "stop" }],
          usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }
        } : responseData;

        return NextResponse.json({
          ...finalResponse,
          model: modelName,
          usage: {
            ...finalResponse.usage,
            credits_charged: creditsUsed,
            credits_remaining: result.remaining.toString(),
          }
        });
      } catch (error) {
        if (i < candidates.length - 1) continue;
        throw error;
      }
    }
  } catch (error) {
    console.error("[Gateway] /api/v1/chat/completions failed:", error);
    return NextResponse.json({ error: { message: "Đã có lỗi xảy ra trên hệ thống Gateway." } }, { status: 500 });
  }
}
