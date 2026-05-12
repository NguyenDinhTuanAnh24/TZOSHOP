/**
 * Helper to format model names for display
 * Examples:
 * codexai/gpt-5.5-pro -> GPT-5.5 Pro
 * codexai/gpt-5.3-codex -> GPT-5.3 Codex
 * claude/claude-opus-4.7 -> Claude Opus 4.7
 * claude/claude-sonnet-4.6 -> Claude Sonnet 4.6
 * gemini/gemini-3.1-pro-preview -> Gemini 3.1 Pro
 * deepseek/deepseek-v4-pro -> DeepSeek V4 Pro
 */
export function formatModelName(modelId: string): string {
  if (!modelId) return "Model";

  // If it's a known pattern, format it nicely
  const parts = modelId.split("/");
  const idPart = parts.length > 1 ? parts[1] : parts[0];

  // Map of common transformations
  const transformations: Record<string, string> = {
    "gpt-5.5-pro": "GPT-5.5 Pro",
    "gpt-5.3-codex": "GPT-5.3 Codex",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gpt-4-turbo": "GPT-4 Turbo",
    "claude-3-5-sonnet": "Claude 3.5 Sonnet",
    "claude-3-opus": "Claude 3 Opus",
    "claude-3-sonnet": "Claude 3 Sonnet",
    "claude-3-haiku": "Claude 3 Haiku",
    "claude-3.5-sonnet": "Claude 3.5 Sonnet",
    "claude-opus-4.7": "Claude Opus 4.7",
    "claude-sonnet-4.6": "Claude Sonnet 4.6",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "gemini-1.5-flash": "Gemini 1.5 Flash",
    "gemini-3.1-pro-preview": "Gemini 3.1 Pro",
    "deepseek-v3": "DeepSeek V3",
    "deepseek-r1": "DeepSeek R1",
    "deepseek-v4-pro": "DeepSeek V4 Pro",
  };

  if (transformations[idPart]) {
    return transformations[idPart];
  }

  // Fallback: capitalize and replace dashes with spaces
  return idPart
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace("Gpt", "GPT");
}
