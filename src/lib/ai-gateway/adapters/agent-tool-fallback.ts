export type ParsedToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export function tryParseToolCallFromText(text: string): ParsedToolCall | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;

  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    const objectMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;
    try {
      parsed = JSON.parse(objectMatch[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  if (!parsed) return null;
  const functionObj = parsed.function as Record<string, unknown> | undefined;

  const toolName =
    (parsed.tool as string | undefined) ||
    (parsed.name as string | undefined) ||
    (functionObj?.name as string | undefined) ||
    (parsed.tool_name as string | undefined);

  const args =
    parsed.arguments ??
    parsed.args ??
    parsed.parameters ??
    functionObj?.arguments ??
    {};

  if (!toolName || typeof toolName !== "string") return null;

  return {
    id: `call_${crypto.randomUUID().replaceAll("-", "")}`,
    type: "function",
    function: {
      name: toolName,
      arguments: typeof args === "string" ? args : JSON.stringify(args),
    },
  };
}
