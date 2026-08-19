/** Repair common static-site issues so preview matches edits. */

import { stripPreviewArtifacts } from "./staticSite";

/** CSS fallbacks when Tailwind config lacks shadcn hsl() color mappings. */
export const SEMANTIC_TOKEN_CSS = `/* Snapbuild semantic token utilities */
.bg-background { background-color: hsl(var(--background)); }
.text-foreground { color: hsl(var(--foreground)); }
.bg-primary { background-color: hsl(var(--primary)); }
.text-primary { color: hsl(var(--primary)); }
.text-primary-foreground { color: hsl(var(--primary-foreground)); }
.bg-secondary { background-color: hsl(var(--secondary)); }
.text-secondary-foreground { color: hsl(var(--secondary-foreground)); }
.bg-muted { background-color: hsl(var(--muted)); }
.text-muted-foreground { color: hsl(var(--muted-foreground)); }
.bg-accent { background-color: hsl(var(--accent)); }
.text-accent-foreground { color: hsl(var(--accent-foreground)); }
.bg-card { background-color: hsl(var(--card)); }
.text-card-foreground { color: hsl(var(--card-foreground)); }
.bg-destructive { background-color: hsl(var(--destructive)); }
.text-destructive-foreground { color: hsl(var(--destructive-foreground)); }
.border-border { border-color: hsl(var(--border)); }
.ring-ring { --tw-ring-color: hsl(var(--ring)); }
.hover\\:bg-primary\\/90:hover { background-color: hsl(var(--primary) / 0.9); }
.hover\\:text-foreground:hover { color: hsl(var(--foreground)); }
`;

const SEMANTIC_CLASS_RE =
  /\b(bg|text|border|ring|from|to|via)-(?:primary|secondary|muted|accent|background|foreground|card|destructive)\b/;

const SHADCN_PRIMARY_IN_CONFIG =
  /primary\s*:\s*\{\s*DEFAULT\s*:\s*['"]hsl\(var\(--primary\)\)/;

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

function htmlReferencesCss(html: string, cssPath: string): boolean {
  const variants = [cssPath, `/${cssPath}`, `./${cssPath}`];
  return variants.some((ref) => html.includes(ref));
}

function usesSemanticTailwindClasses(html: string): boolean {
  return SEMANTIC_CLASS_RE.test(html);
}

function hasShadcnPrimaryVars(html: string): boolean {
  return /--primary\s*:/.test(html);
}

function tailwindMapsPrimary(html: string): boolean {
  return SHADCN_PRIMARY_IN_CONFIG.test(html);
}

/** Inject shadcn hsl color mappings into tailwind.config when missing. */
export function ensureTailwindSemanticConfig(html: string): string {
  if (!hasShadcnPrimaryVars(html) || !usesSemanticTailwindClasses(html)) {
    return html;
  }
  if (tailwindMapsPrimary(html)) return html;
  if (!html.includes("tailwind.config") || !html.includes("colors")) return html;

  const colorEntries = `        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
`;

  return html.replace(/colors\s*:\s*\{/, `colors: {\n${colorEntries}`);
}

function ensureStylesCss(
  files: Record<string, string>,
  html: string,
): Record<string, string> {
  const result = { ...files };
  const cssPath = "styles.css";

  if (!htmlReferencesCss(html, cssPath)) return result;

  const needsFallback =
    hasShadcnPrimaryVars(html) &&
    usesSemanticTailwindClasses(html) &&
    !tailwindMapsPrimary(html);

  if (!needsFallback) return result;

  const existing = result[cssPath] ?? "";
  if (existing.includes("Snapbuild semantic token utilities")) return result;

  result[cssPath] = existing.trim()
    ? `${existing.trim()}\n\n${SEMANTIC_TOKEN_CSS}`
    : SEMANTIC_TOKEN_CSS;

  return result;
}

/** Strip preview artifacts, fix tailwind tokens, ensure linked CSS exists. */
export function repairStaticSiteFiles(
  files: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith("/") && content === "") {
      result[path] = content;
      continue;
    }
    const normalized = normalizePath(path);
    if (normalized.endsWith(".html")) {
      let html = stripPreviewArtifacts(content);
      html = ensureTailwindSemanticConfig(html);
      // Restore proper document ending if picker injection corrupted it
      if (!html.includes("</html>") && html.includes("<html")) {
        html = html.replace(/<script[^>]*data-snapbuild-picker[^>]*>[\s\S]*$/i, "");
        if (!html.trimEnd().endsWith("</body>")) {
          html = `${html.trimEnd()}\n</body>\n</html>`;
        } else if (!html.includes("</html>")) {
          html = `${html.trimEnd()}\n</html>`;
        }
      }
      result[normalized] = html;
    } else {
      result[normalized] = content;
    }
  }

  const indexHtml = result["index.html"];
  if (!indexHtml) return result;

  return ensureStylesCss(result, indexHtml);
}
