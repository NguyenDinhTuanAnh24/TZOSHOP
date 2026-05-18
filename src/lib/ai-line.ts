export type AiLine = "ALL_MODELS" | "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK";

export function getAiLineFromProductSlug(slug: string): AiLine | null {
  if (slug.startsWith("all_models_")) return "ALL_MODELS";
  if (slug.startsWith("codex_")) return "CODEXAI";
  if (slug.startsWith("claude_")) return "CLAUDE";
  if (slug.startsWith("gemini_")) return "GEMINI";
  if (slug.startsWith("deepseek_")) return "DEEPSEEK";
  return null;
}

export function getAiLineLabelFromSlug(slug: string) {
  if (slug.startsWith("all_models_")) return "All Models";
  if (slug.startsWith("codex_")) return "CodexAI";
  if (slug.startsWith("claude_")) return "Claude";
  if (slug.startsWith("gemini_")) return "Gemini";
  if (slug.startsWith("deepseek_")) return "DeepSeek";
  return "Khác";
}

export function getNewApiGroupFromProductSlug(slug: string) {
  if (slug.startsWith("all_models_")) return "all_models_full";
  if (slug.startsWith("codex_")) return "codex_full";
  if (slug.startsWith("claude_")) return "claude_full";
  if (slug.startsWith("gemini_")) return "gemini_full";
  if (slug.startsWith("deepseek_")) return "deepseek_full";
  throw new Error("Không xác định được nhóm NewAPI cho gói này.");
}

export function getTokenNamePrefixFromProductSlug(slug: string) {
  if (slug.startsWith("all_models_")) return "all_models";
  if (slug.startsWith("codex_")) return "codex";
  if (slug.startsWith("claude_")) return "claude";
  if (slug.startsWith("gemini_")) return "gemini";
  if (slug.startsWith("deepseek_")) return "deepseek";
  return "api";
}

export function getAiLineLabelFromApiFamily(apiFamily: string) {
  if (apiFamily === "CODEXAI") return "CodexAI";
  if (apiFamily === "CLAUDE") return "Claude";
  if (apiFamily === "GEMINI") return "Gemini";
  if (apiFamily === "DEEPSEEK") return "DeepSeek";
  return apiFamily;
}
