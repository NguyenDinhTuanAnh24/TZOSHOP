export const NEWAPI_MODEL_IDS = [
  "GPT-5.5",
  "GPT-5.4",
  "GPT-5.4-Mini",
  "GPT-5.4-Pro",
  "GPT-5.3-Codex",
  "GPT-5.2",
  "GPT-5.1-Codex",
  "GPT-5.1",
  "GPT-5-Codex",
  "GPT-5",
  "GPT-5-Pro",
  "GPT-5-Mini",
  "DeepSeek-V4-Flash",
  "DeepSeek-V4-Pro",
  "Gemini-3.1-Pro-Preview",
  "Gemini-3.1-Flash-Lite-Preview",
  "Gemini-3-Flash-Preview",
  "Gemini-2.5-Pro",
  "Claude-Opus-4.5",
  "Claude-Haiku-4.5",
  "Claude-Sonnet-4.5",
  "Claude-Sonnet-4.6",
  "Claude-Opus-4.6",
  "Claude-Opus-4.7",
] as const;

export type NewApiModelId = (typeof NEWAPI_MODEL_IDS)[number];

const LEGACY_TO_NEW: Record<string, NewApiModelId> = {
  "codexai/gpt-5.5": "GPT-5.5",
  "codexai/gpt-5.4": "GPT-5.4",
  "codexai/gpt-5.4-mini": "GPT-5.4-Mini",
  "codexai/gpt-5.4-pro": "GPT-5.4-Pro",
  "codexai/gpt-5.3-codex": "GPT-5.3-Codex",
  "codexai/gpt-5.2": "GPT-5.2",
  "codexai/gpt-5.1-codex": "GPT-5.1-Codex",
  "codexai/gpt-5.1": "GPT-5.1",
  "codexai/gpt-5-codex": "GPT-5-Codex",
  "codexai/gpt-5": "GPT-5",
  "codexai/gpt-5-pro": "GPT-5-Pro",
  "codexai/gpt-5-mini": "GPT-5-Mini",
  "deepseek/deepseek-v4-flash": "DeepSeek-V4-Flash",
  "deepseek/deepseek-v4-pro": "DeepSeek-V4-Pro",
  "gemini/gemini-3.1-pro-preview": "Gemini-3.1-Pro-Preview",
  "gemini/gemini-3.1-flash-lite-preview": "Gemini-3.1-Flash-Lite-Preview",
  "gemini/gemini-3-flash-preview": "Gemini-3-Flash-Preview",
  "gemini/gemini-2.5-pro": "Gemini-2.5-Pro",
  "claude/claude-opus-4.5": "Claude-Opus-4.5",
  "claude/claude-haiku-4.5": "Claude-Haiku-4.5",
  "claude/claude-sonnet-4.5": "Claude-Sonnet-4.5",
  "claude/claude-sonnet-4.6": "Claude-Sonnet-4.6",
  "claude/claude-opus-4.6": "Claude-Opus-4.6",
  "claude/claude-opus-4.7": "Claude-Opus-4.7",
};

const NEW_SET = new Set<string>(NEWAPI_MODEL_IDS);

const BANNED_LOWERCASE = new Set([
  "gpt-5.2-pro",
  "gpt-5.5-pro",
  "gpt 5.2 pro",
  "gpt 5.5 pro",
  "gpt-5.2 pro",
  "gpt-5.5 pro",
  "codexai/gpt-5.2-pro",
  "codexai/gpt-5.5-pro",
  "codexai/gpt 5.2 pro",
  "codexai/gpt 5.5 pro",
]);

export function isBannedModel(modelName: string): boolean {
  const lower = modelName.toLowerCase().trim();
  return BANNED_LOWERCASE.has(lower);
}

export function normalizeModelId(model: unknown): string {
  const cleaned = String(model || "").trim();
  if (!cleaned) return cleaned;
  if (isBannedModel(cleaned)) return "";
  if (NEW_SET.has(cleaned)) return cleaned;
  const legacy = LEGACY_TO_NEW[cleaned.toLowerCase()] ?? cleaned;
  if (isBannedModel(legacy)) return "";
  return legacy;
}

export function normalizeModelIds(models: string[]): string[] {
  const dedup = new Set<string>();
  for (const raw of models || []) {
    const normalized = normalizeModelId(raw);
    if (normalized) dedup.add(normalized);
  }
  return Array.from(dedup);
}
