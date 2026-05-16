import type { ApiFamily } from "@prisma/client";

export type ChatCompletionMessage = {
  role: string;
  content: string | unknown;
  name?: string;
  tool_call_id?: string;
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: unknown;
  };
};

export type ChatCompletionRequest = {
  model?: string;
  messages?: ChatCompletionMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string | string[];
  tools?: ToolDefinition[] | unknown[];
  tool_choice?: unknown;
  parallel_tool_calls?: boolean;
  response_format?: unknown;
};

export type ModelCapability = {
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsAgent: boolean;
};

export type ProviderRoute = {
  modelId: string;
  publicName: string;
  apiFamily: ApiFamily;
  upstreamModel: string;
  upstreamEndpointType: "CHAT_COMPLETIONS" | "RESPONSES";
  providerId: string;
  providerName: string;
  baseUrl: string;
  encryptedApiKey: string;
  inputCreditRate: number;
  outputCreditRate: number;
  capability: ModelCapability;
};
