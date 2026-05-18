import { NextRequest, NextResponse } from "next/server";
import { POST as ChatCompletionPost } from "../chat/completions/route";

export const runtime = "nodejs";

type ChatUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
};

function formatUsage(usageData: ChatUsage | null, text: string) {
  if (usageData) {
    return {
      input_tokens: usageData.prompt_tokens || usageData.input_tokens || 0,
      output_tokens: usageData.completion_tokens || usageData.output_tokens || 0,
      total_tokens: usageData.total_tokens || 0,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens_details: { reasoning_tokens: 0 }
    };
  }
  return {
    input_tokens: 0,
    output_tokens: Math.ceil(text.length / 4),
    total_tokens: Math.ceil(text.length / 4),
    input_tokens_details: { cached_tokens: 0 },
    output_tokens_details: { reasoning_tokens: 0 }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const model = body.model;
    const instructions = body.instructions;
    const input = body.input;
    const clientRequestedStream = body.stream === true;
    const max_output_tokens = body.max_output_tokens;
    const tools = body.tools;
    const temperature = body.temperature;
    
    const hasTools = Array.isArray(tools) && tools.length > 0;

    let finalMessages: { role: string; content: string }[] = [];
    
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      const msgs = body.messages;
      const lastUser = [...msgs].reverse().find(m => m.role === "user" || m.role === "system");
      const lastUserText = lastUser ? (typeof lastUser.content === "string" ? lastUser.content : JSON.stringify(lastUser.content)) : "";
      
      finalMessages = [
        { role: "system", content: "Trả lời ngắn gọn, hữu ích, bằng tiếng Việt nếu người dùng dùng tiếng Việt." },
        { role: "user", content: lastUserText || "Xin chào" }
      ];
    } else {
      let lastUserText = "";
      if (typeof input === "string" && input.trim().length > 0) {
        lastUserText = input;
      } else if (Array.isArray(input)) {
        const lastUser = [...input].reverse().find(i => typeof i === "string" || i?.role === "user");
        lastUserText = typeof lastUser === "string" ? lastUser : (lastUser?.content || lastUser?.text || "");
      }
      
      finalMessages = [
        { role: "system", content: instructions || "Trả lời ngắn gọn, hữu ích, bằng tiếng Việt nếu người dùng dùng tiếng Việt." },
        { role: "user", content: lastUserText || "Xin chào" }
      ];
    }

    const finalMaxTokens = max_output_tokens ?? body.max_tokens ?? body.max_completion_tokens ?? 256;
    const internalStream = hasTools ? false : clientRequestedStream;

    const chatBody: Record<string, unknown> = {
      model,
      stream: internalStream,
      messages: finalMessages,
      max_tokens: finalMaxTokens,
    };
    
    if (temperature !== undefined) chatBody.temperature = temperature;
    
    if (!hasTools) {
       if (body.tools !== undefined) chatBody.tools = body.tools;
       if (body.tool_choice !== undefined) chatBody.tool_choice = body.tool_choice;
       if (body.parallel_tool_calls !== undefined) chatBody.parallel_tool_calls = body.parallel_tool_calls;
    }

    const reqHeaders = new Headers();
    request.headers.forEach((value, key) => {
      reqHeaders.set(key, value);
    });
    const auth = request.headers.get("authorization");
    if (auth) {
      reqHeaders.set("authorization", auth);
    }

    const newRequest = new NextRequest(request.url.replace("/responses", "/chat/completions"), {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify(chatBody),
    });

    const startMs = Date.now();
    
    console.log("[RESPONSES_ADAPTER_SHORT_LOG]", {
      model,
      stream: clientRequestedStream,
      messagesCount: finalMessages.length,
      hasTools,
      toolsCount: hasTools ? tools.length : 0,
    });

    let response = await ChatCompletionPost(newRequest);

    if (!response.ok) {
      if (response.status === 400 && (model === "codexai/gpt-5.3-codex" || model === "gpt-5.3-codex")) {
        chatBody.model = model.startsWith("codexai/") ? "codexai/gpt-5-mini" : "gpt-5-mini";
        const fallbackRequest = new NextRequest(request.url.replace("/responses", "/chat/completions"), {
          method: "POST",
          headers: reqHeaders,
          body: JSON.stringify(chatBody),
        });
        console.log("[RESPONSES_ADAPTER_FALLBACK] Retrying with model:", chatBody.model);
        response = await ChatCompletionPost(fallbackRequest);
      }
    }

    if (!response.ok) {
      const errorStatus = response.status;
      if (errorStatus === 400 || errorStatus >= 500) {
        if (clientRequestedStream) {
           const responseId = `resp-${Date.now()}`;
           const encoder = new TextEncoder();
           const fullText = "Provider hiện không nhận request này, vui lòng thử lại hoặc đổi model.";
           
           const streamObj = new ReadableStream({
             async start(controller) {
               let sequenceNumber = 1;
               function sse(event: string, data: Record<string, unknown>) {
                 let finalData: Record<string, unknown> = { type: event, sequence_number: sequenceNumber++ };
                 if (["response.created", "response.completed", "response.failed"].includes(event)) {
                   finalData.response = data;
                 } else {
                   finalData = { ...finalData, ...data };
                 }
                 return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(finalData)}\n\n`);
               }
               controller.enqueue(sse("response.created", { id: responseId, object: "response", status: "in_progress", model, created_at: Math.floor(Date.now() / 1000), output: [] }));
               controller.enqueue(sse("response.output_item.added", { response_id: responseId, output_index: 0, item: { type: "message", role: "assistant", content: [] } }));
               controller.enqueue(sse("response.content_part.added", { response_id: responseId, output_index: 0, content_index: 0, part: { type: "output_text", text: "" } }));
               controller.enqueue(sse("response.output_text.delta", { response_id: responseId, output_index: 0, content_index: 0, delta: fullText }));
               controller.enqueue(sse("response.output_text.done", { response_id: responseId, output_index: 0, content_index: 0, text: fullText }));
               controller.enqueue(sse("response.content_part.done", { response_id: responseId, output_index: 0, content_index: 0, part: { type: "output_text", text: fullText } }));
               controller.enqueue(sse("response.output_item.done", { response_id: responseId, output_index: 0, item: { type: "message", role: "assistant", content: [{ type: "output_text", text: fullText }] } }));
               controller.enqueue(sse("response.completed", { id: responseId, object: "response", status: "completed", model, output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: fullText }] }], usage: formatUsage(null, fullText) }));
               controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
               controller.close();
             }
           });
           return new Response(streamObj, {
             status: 200,
             headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
           });
        } else {
           return NextResponse.json({
             output_text: "Provider hiện không nhận request này, vui lòng thử lại hoặc đổi model.",
             model,
             usage: formatUsage(null, "Provider hiện không nhận request này, vui lòng thử lại hoặc đổi model."),
             id: `resp-${Date.now()}`
           }, { status: 200 });
        }
      }
      return response;
    }

    if (internalStream) {
      if (!response.ok || !response.body) return response;

      const responseId = `resp-${Date.now()}`;
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = response.body.getReader();

      const streamObj = new ReadableStream({
        async start(controller) {
          let sequenceNumber = 1;
          function sse(event: string, data: Record<string, unknown>) {
            let finalData: Record<string, unknown> = { type: event, sequence_number: sequenceNumber++ };
            if (["response.created", "response.completed", "response.failed"].includes(event)) {
              finalData.response = data;
            } else {
              finalData = { ...finalData, ...data };
            }
            return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(finalData)}\n\n`);
          }

          let firstDeltaTime = 0;

          controller.enqueue(sse("response.created", { id: responseId, object: "response", status: "in_progress", model, created_at: Math.floor(Date.now() / 1000), output: [] }));
          controller.enqueue(sse("response.output_item.added", { response_id: responseId, output_index: 0, item: { type: "message", role: "assistant", content: [] } }));
          controller.enqueue(sse("response.content_part.added", { response_id: responseId, output_index: 0, content_index: 0, part: { type: "output_text", text: "" } }));

          let fullText = "";
          let buffer = "";
          let usage: ChatUsage | null = null;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!value) continue;

              buffer += decoder.decode(value, { stream: true });
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
                    const parsed = JSON.parse(rawData);
                    if (parsed.usage) usage = parsed.usage;
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) {
                      if (firstDeltaTime === 0) firstDeltaTime = Date.now();
                      fullText += delta;
                      controller.enqueue(sse("response.output_text.delta", { response_id: responseId, output_index: 0, content_index: 0, delta }));
                    }
                  } catch {}
                }
              }
            }

            console.log("[RESPONSES_ADAPTER_TIMING] Completed in", Date.now() - startMs, "ms. First delta ms:", firstDeltaTime > 0 ? firstDeltaTime - startMs : 0);

            controller.enqueue(sse("response.output_text.done", { response_id: responseId, output_index: 0, content_index: 0, text: fullText }));
            controller.enqueue(sse("response.content_part.done", { response_id: responseId, output_index: 0, content_index: 0, part: { type: "output_text", text: fullText } }));
            controller.enqueue(sse("response.output_item.done", { response_id: responseId, output_index: 0, item: { type: "message", role: "assistant", content: [{ type: "output_text", text: fullText }] } }));
            controller.enqueue(sse("response.completed", { id: responseId, object: "response", status: "completed", model, output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: fullText }] }], usage: formatUsage(usage, fullText) }));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          } catch (error: unknown) {
            console.error("[Responses Stream Adapter] Error:", error instanceof Error ? error.message : error);
            controller.enqueue(sse("response.completed", { id: responseId, object: "response", status: "failed", model, output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: fullText }] }], usage: formatUsage(usage, fullText) }));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamObj, {
        status: response.status,
        headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
      });
    } else {
       const chatJson = await response.clone().json();
       let outputText = "";
       if (chatJson.choices && chatJson.choices.length > 0) {
         outputText = chatJson.choices[0].message?.content || "";
       }
       const usage = chatJson.usage;

       console.log("[RESPONSES_ADAPTER_TIMING] Completed in", Date.now() - startMs, "ms.");

       if (clientRequestedStream) {
          const responseId = chatJson.id || `resp-${Date.now()}`;
          const encoder = new TextEncoder();
          const streamObj = new ReadableStream({
             async start(controller) {
               let sequenceNumber = 1;
               function sse(event: string, data: Record<string, unknown>) {
                 let finalData: Record<string, unknown> = { type: event, sequence_number: sequenceNumber++ };
                 if (["response.created", "response.completed", "response.failed"].includes(event)) {
                   finalData.response = data;
                 } else {
                   finalData = { ...finalData, ...data };
                 }
                 return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(finalData)}\n\n`);
               }
               
               controller.enqueue(sse("response.created", { id: responseId, object: "response", status: "in_progress", model, created_at: Math.floor(Date.now() / 1000), output: [] }));
               controller.enqueue(sse("response.output_item.added", { response_id: responseId, output_index: 0, item: { type: "message", role: "assistant", content: [] } }));
               controller.enqueue(sse("response.content_part.added", { response_id: responseId, output_index: 0, content_index: 0, part: { type: "output_text", text: "" } }));
               controller.enqueue(sse("response.output_text.delta", { response_id: responseId, output_index: 0, content_index: 0, delta: outputText }));
               controller.enqueue(sse("response.output_text.done", { response_id: responseId, output_index: 0, content_index: 0, text: outputText }));
               controller.enqueue(sse("response.content_part.done", { response_id: responseId, output_index: 0, content_index: 0, part: { type: "output_text", text: outputText } }));
               controller.enqueue(sse("response.output_item.done", { response_id: responseId, output_index: 0, item: { type: "message", role: "assistant", content: [{ type: "output_text", text: outputText }] } }));
               controller.enqueue(sse("response.completed", { id: responseId, object: "response", status: "completed", model, output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: outputText }] }], usage: formatUsage(usage, outputText) }));
               controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
               controller.close();
             }
          });
          return new Response(streamObj, {
             status: 200,
             headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
          });
       } else {
         return NextResponse.json({
           output_text: outputText,
           model: chatJson.model,
           usage: formatUsage(usage, outputText),
           id: chatJson.id,
         }, { status: response.status, headers: response.headers });
       }
    }
  } catch (error) {
    console.error("[Responses API Adapter] Error:", error);
    return NextResponse.json({ error: { message: "Internal server error in Responses adapter" } }, { status: 500 });
  }
}
