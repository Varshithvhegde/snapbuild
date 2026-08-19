import { THEME_PRESETS } from "./design/editProtocol";

export type ThemeName = keyof typeof THEME_PRESETS;

/** Hex equivalents for tailwind.config brand colors */
const THEME_HEX: Record<
  ThemeName,
  { main: string; dark: string; light: string }
> = {
  blue: { main: "#2563eb", dark: "#1d4ed8", light: "#3b82f6" },
  navy: { main: "#1e3a8a", dark: "#172554", light: "#2563eb" },
  sky: { main: "#0ea5e9", dark: "#0284c7", light: "#38bdf8" },
  indigo: { main: "#6366f1", dark: "#4f46e5", light: "#818cf8" },
  purple: { main: "#9333ea", dark: "#7e22ce", light: "#a855f7" },
  green: { main: "#16a34a", dark: "#15803d", light: "#22c55e" },
  emerald: { main: "#166534", dark: "#14532d", light: "#059669" },
  red: { main: "#dc2626", dark: "#b91c1c", light: "#ef4444" },
  orange: { main: "#ea580c", dark: "#c2410c", light: "#f97316" },
  rose: { main: "#e11d48", dark: "#be123c", light: "#f43f5e" },
};

const BRAND_CLASS_REPLACEMENTS: Array<[RegExp, string]> = [
  [/bg-emerald-\d+/g, "bg-primary"],
  [/bg-green-\d+/g, "bg-primary"],
  [/bg-teal-\d+/g, "bg-primary"],
  [/bg-lime-\d+/g, "bg-primary"],
  [/text-emerald-\d+/g, "text-primary"],
  [/text-green-\d+/g, "text-primary"],
  [/text-teal-\d+/g, "text-primary"],
  [/border-emerald-\d+/g, "border-primary"],
  [/border-green-\d+/g, "border-primary"],
  [/hover:bg-emerald-\d+/g, "hover:bg-primary/90"],
  [/hover:bg-green-\d+/g, "hover:bg-primary/90"],
  [/hover:text-emerald-\d+/g, "hover:text-primary"],
  [/from-emerald-\d+/g, "from-primary"],
  [/to-emerald-\d+/g, "to-primary"],
  [/from-green-\d+/g, "from-primary"],
  [/to-green-\d+/g, "to-primary"],
];

/** Reliably apply a color theme to static HTML (updates CSS vars + Tailwind classes). */
export function applySiteTheme(
  html: string,
  theme: ThemeName,
): { html: string; changes: string[] } {
  const preset = THEME_PRESETS[theme];
  const hex = THEME_HEX[theme];
  const changes: string[] = [];
  let result = html;

  if (/--primary\s*:/.test(result)) {
    result = result.replace(
      /(--primary\s*:\s*)[^;]+/g,
      `$1${preset.primary}`,
    );
    changes.push(`--primary → ${preset.primary}`);
  } else if (/:root\s*\{/.test(result)) {
    result = result.replace(
      /:root\s*\{/,
      `:root {\n  --primary: ${preset.primary};\n  --primary-foreground: 0 0% 100%;`,
    );
    changes.push("Added --primary to :root");
  }

  if (/--primary-foreground\s*:/.test(result)) {
    result = result.replace(
      /(--primary-foreground\s*:\s*)[^;]+/g,
      `$10 0% 100%`,
    );
    changes.push("--primary-foreground → white");
  }

  for (const [pattern, replacement] of BRAND_CLASS_REPLACEMENTS) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (before !== result) {
      changes.push(`${pattern.source} → ${replacement}`);
    }
  }

  const semanticReplacements: Array<[RegExp, string]> = [
    [/bg-\[var\(--accent\)\]/g, "bg-primary"],
    [/text-\[var\(--accent\)\]/g, "text-primary"],
    [/border-\[var\(--accent\)\]/g, "border-primary"],
    [/bg-\[var\(--primary\)\]/g, "bg-primary"],
  ];
  for (const [pattern, replacement] of semanticReplacements) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (before !== result) changes.push(`Semantic: ${replacement}`);
  }

  // Brand accent CSS vars used in some generated sites
  if (/--accent\s*:/.test(result)) {
    result = result.replace(/(--accent\s*:\s*)[^;]+/g, `$1${preset.primary}`);
    changes.push("--accent updated");
  }

  // visualSystem sites: tailwind.config brand hex colors
  if (/brand:\s*\{/.test(result)) {
    result = result.replace(
      /(brand:\s*\{\s*DEFAULT:\s*)'#[^']+'/g,
      `$1'${hex.main}'`,
    );
    result = result.replace(
      /(dark:\s*)'#[^']+'(\s*,?\s*\/?\*?\s*ACCENT_DARK)/g,
      `$1'${hex.dark}'$2`,
    );
    result = result.replace(/dark:\s*'#[^']+'/g, `dark: '${hex.dark}'`);
    result = result.replace(/light:\s*'#[^']+'/g, `light: '${hex.light}'`);
    changes.push(`tailwind brand colors → ${hex.main}`);
  }

  // Custom :root hex accent vars (common in generated sites)
  result = result.replace(
    /(--accent\s*:\s*)#[0-9a-fA-F]{3,8}/g,
    `$1${hex.main}`,
  );
  result = result.replace(
    /(--brand\s*:\s*)#[0-9a-fA-F]{3,8}/g,
    `$1${hex.main}`,
  );

  // bg-brand / text-brand classes from visualSystem tailwind config
  const brandClassReplacements: Array<[RegExp, string]> = [
    [/bg-brand-dark/g, "bg-primary"],
    [/bg-brand-light/g, "bg-primary/80"],
    [/bg-brand/g, "bg-primary"],
    [/text-brand-dark/g, "text-primary"],
    [/text-brand/g, "text-primary"],
    [/border-brand/g, "border-primary"],
    [/hover:bg-brand-dark/g, "hover:bg-primary/90"],
    [/hover:bg-brand/g, "hover:bg-primary/90"],
  ];
  for (const [pattern, replacement] of brandClassReplacements) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (before !== result) changes.push(`brand class → ${replacement}`);
  }

  return { html: result, changes };
}

export function isKnownTheme(theme: string): theme is ThemeName {
  return theme in THEME_PRESETS;
}
