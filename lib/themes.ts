export type ThemeKey = "default" | "vitor" | "rafael";

interface ThemeDef {
  label: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  ring1: string;
  ring2: string;
  ring3: string;
  conic: string;
  greeting: string;
}

// classes escritas por extenso (não geradas dinamicamente) pra o Tailwind conseguir compilar
export const THEMES: Record<ThemeKey, ThemeDef> = {
  default: {
    label: "Gabi",
    accentText: "text-lime",
    accentBg: "bg-lime",
    accentBorder: "border-lime/20",
    ring1: "border-lime/20",
    ring2: "border-horn/10",
    ring3: "border-lime/5",
    conic:
      "bg-[conic-gradient(from_0deg,transparent_0%,rgba(200,255,77,0.35)_15%,transparent_30%,transparent_50%,rgba(232,169,76,0.3)_65%,transparent_80%)]",
    greeting: "preparando o rebanho…",
  },
  vitor: {
    label: "Vitor",
    accentText: "text-sky-300",
    accentBg: "bg-sky-300",
    accentBorder: "border-sky-300/20",
    ring1: "border-sky-300/25",
    ring2: "border-sky-400/10",
    ring3: "border-sky-300/5",
    conic:
      "bg-[conic-gradient(from_0deg,transparent_0%,rgba(125,211,252,0.35)_15%,transparent_30%,transparent_50%,rgba(56,189,248,0.25)_65%,transparent_80%)]",
    greeting: "afiando os chifres…",
  },
  rafael: {
    label: "Rafael",
    accentText: "text-orange-300",
    accentBg: "bg-orange-300",
    accentBorder: "border-orange-300/20",
    ring1: "border-orange-300/25",
    ring2: "border-amber-400/10",
    ring3: "border-orange-300/5",
    conic:
      "bg-[conic-gradient(from_0deg,transparent_0%,rgba(253,186,116,0.35)_15%,transparent_30%,transparent_50%,rgba(245,158,11,0.25)_65%,transparent_80%)]",
    greeting: "escalando a montanha…",
  },
};

export function getTheme(theme: string | null | undefined): ThemeDef {
  return THEMES[(theme as ThemeKey) ?? "default"] ?? THEMES.default;
}
