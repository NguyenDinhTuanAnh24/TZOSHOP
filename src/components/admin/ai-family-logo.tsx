import Image from "next/image";

const AI_FAMILY_LOGO: Record<string, string> = {
  CODEXAI: "/logos/codexai.svg",
  CLAUDE: "/logos/claude.svg",
  GEMINI: "/logos/gemini.svg",
  DEEPSEEK: "/logos/deepseek.svg",
};

export function normalizeFamily(family?: string | null) {
  return String(family ?? "").toUpperCase();
}

export function familyIconBoxClass(family?: string | null) {
  const normalized = normalizeFamily(family);
  const bg =
    normalized === "CODEXAI"
      ? "bg-[#C7F0D8]"
      : normalized === "CLAUDE"
        ? "bg-[#FFD93D]"
        : normalized === "GEMINI"
          ? "bg-[#A78BFA]"
          : normalized === "DEEPSEEK"
            ? "bg-[#FF6B6B]"
            : "bg-white";

  return [
    "flex h-11 w-11 items-center justify-center",
    "border-4 border-black",
    "shadow-[3px_3px_0px_0px_#000]",
    bg,
  ].join(" ");
}

export function AiFamilyLogo({
  family,
  size = 28,
  className,
}: {
  family?: string | null;
  size?: number;
  className?: string;
}) {
  const normalized = normalizeFamily(family);
  const src = AI_FAMILY_LOGO[normalized] || "/logo.png";

  return (
    <Image
      src={src}
      alt={normalized || "AI Family"}
      width={size}
      height={size}
      className={className ?? "h-7 w-7 object-contain"}
    />
  );
}

