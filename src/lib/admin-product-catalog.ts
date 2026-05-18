export type AdminAiFamilyKey = "all_models" | "codex" | "claude" | "gemini" | "deepseek";
export type AdminPlanTypeKey = "trial" | "monthly" | "quarterly" | "yearly";

export const ADMIN_PLAN_TYPES: Array<{ key: AdminPlanTypeKey; label: string; durationDays: number }> = [
  { key: "trial", label: "Trial 7 ngày", durationDays: 7 },
  { key: "monthly", label: "1 tháng", durationDays: 30 },
  { key: "quarterly", label: "3 tháng", durationDays: 90 },
  { key: "yearly", label: "1 năm", durationDays: 365 },
];

export const ADMIN_AI_FAMILIES: Array<{ key: AdminAiFamilyKey; label: string; apiFamily: "CODEXAI" | "CLAUDE" | "GEMINI" | "DEEPSEEK" }> = [
  { key: "all_models", label: "All Models", apiFamily: "GEMINI" },
  { key: "codex", label: "CodexAI", apiFamily: "CODEXAI" },
  { key: "claude", label: "Claude", apiFamily: "CLAUDE" },
  { key: "gemini", label: "Gemini", apiFamily: "GEMINI" },
  { key: "deepseek", label: "DeepSeek", apiFamily: "DEEPSEEK" },
];

export const NEWAPI_GROUP_BY_PREFIX: Record<AdminAiFamilyKey, string> = {
  all_models: "all_models_full",
  codex: "codex_full",
  claude: "claude_full",
  gemini: "gemini_full",
  deepseek: "deepseek_full",
};

export const MODEL_REGISTRY: Record<Exclude<AdminAiFamilyKey, "all_models">, Array<{ id: string; label: string }>> = {
  codex: [
    { id: "codexai/gpt-5.5", label: "GPT-5.5" },
    { id: "codexai/gpt-5.5-pro", label: "GPT-5.5 Pro" },
    { id: "codexai/gpt-5.4", label: "GPT-5.4" },
    { id: "codexai/gpt-5.4-mini", label: "GPT-5.4 Mini" },
    { id: "codexai/gpt-5.4-pro", label: "GPT-5.4 Pro" },
    { id: "codexai/gpt-5.3-codex", label: "GPT-5.3 Codex" },
    { id: "codexai/gpt-5.2", label: "GPT-5.2" },
    { id: "codexai/gpt-5.2-pro", label: "GPT-5.2 Pro" },
    { id: "codexai/gpt-5.1-codex", label: "GPT-5.1 Codex" },
    { id: "codexai/gpt-5.1", label: "GPT-5.1" },
    { id: "codexai/gpt-5-codex", label: "GPT-5 Codex" },
    { id: "codexai/gpt-5", label: "GPT-5" },
    { id: "codexai/gpt-5-pro", label: "GPT-5 Pro" },
    { id: "codexai/gpt-5-mini", label: "GPT-5 Mini" },
  ],
  claude: [
    { id: "claude/claude-haiku-4.5", label: "Claude Haiku 4.5" },
    { id: "claude/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
    { id: "claude/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
    { id: "claude/claude-opus-4.5", label: "Claude Opus 4.5" },
    { id: "claude/claude-opus-4.6", label: "Claude Opus 4.6" },
    { id: "claude/claude-opus-4.7", label: "Claude Opus 4.7" },
  ],
  gemini: [
    { id: "gemini/gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite Preview" },
    { id: "gemini/gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
    { id: "gemini/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ],
  deepseek: [
    { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash" },
    { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro" },
  ],
};

export function detectFamilyKeyFromSlug(slug: string): AdminAiFamilyKey {
  const normalized = (slug || "").toLowerCase();
  if (normalized.startsWith("all_models_")) return "all_models";
  if (normalized.startsWith("codex_")) return "codex";
  if (normalized.startsWith("claude_")) return "claude";
  if (normalized.startsWith("gemini_")) return "gemini";
  if (normalized.startsWith("deepseek_")) return "deepseek";
  return "codex";
}

export function detectPlanTypeFromSlug(slug: string): AdminPlanTypeKey {
  const normalized = (slug || "").toLowerCase();
  if (normalized.endsWith("_trial")) return "trial";
  if (normalized.endsWith("_monthly")) return "monthly";
  if (normalized.endsWith("_quarterly")) return "quarterly";
  return "yearly";
}

export function buildPlanSuggestion(familyKey: AdminAiFamilyKey, planType: AdminPlanTypeKey) {
  const familyLabel = ADMIN_AI_FAMILIES.find((f) => f.key === familyKey)?.label ?? "CodexAI";
  const prefix = familyKey;
  const plan = ADMIN_PLAN_TYPES.find((p) => p.key === planType) ?? ADMIN_PLAN_TYPES[0];
  const slug = `${prefix}_${planType}`;
  const nameSuffix =
    planType === "trial" ? "Trial 7 ngày" : planType === "monthly" ? "1 tháng" : planType === "quarterly" ? "3 tháng" : "1 năm";
  return {
    name: `API ${familyLabel} ${nameSuffix}`,
    slug,
    durationDays: plan.durationDays,
    newApiGroup: NEWAPI_GROUP_BY_PREFIX[familyKey],
  };
}

export function getSelectableModels(familyKey: AdminAiFamilyKey) {
  if (familyKey === "all_models") {
    return [...MODEL_REGISTRY.codex, ...MODEL_REGISTRY.claude, ...MODEL_REGISTRY.gemini, ...MODEL_REGISTRY.deepseek];
  }
  return MODEL_REGISTRY[familyKey];
}

export function validateAllowedModelsBySlug(slug: string, allowedModels: string[]) {
  const familyKey = detectFamilyKeyFromSlug(slug);
  if (!Array.isArray(allowedModels) || allowedModels.length === 0) {
    return "Danh sách model hỗ trợ không được để trống.";
  }

  if (familyKey === "all_models") {
    const groups = new Set(
      allowedModels.map((m) => (m.startsWith("codexai/") ? "codex" : m.startsWith("claude/") ? "claude" : m.startsWith("gemini/") ? "gemini" : m.startsWith("deepseek/") ? "deepseek" : "other"))
    );
    if (groups.has("other")) return "Model của gói All Models chứa prefix không hợp lệ.";
    if (groups.size < 2) return "Gói all_models_* cần chứa model từ nhiều dòng AI.";
    return null;
  }

  const prefix = familyKey === "codex" ? "codexai/" : `${familyKey}/`;
  const invalid = allowedModels.find((m) => !m.startsWith(prefix));
  if (invalid) {
    return `Model "${invalid}" không thuộc dòng ${familyKey}.`;
  }
  return null;
}
