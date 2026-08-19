/** Normalize static site files for Sandpack preview and visual editor. */

import { PREVIEW_PICKER_SCRIPT } from "./previewElementPicker";
import { repairStaticSiteFiles } from "./staticSiteRepair";

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

/** Extract the first JSON object from AI-generated or markdown-wrapped content. */
function extractJsonObject(text: string): string | null {
  let trimmed = text.trim();
  trimmed = trimmed.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```[\s\S]*$/, "");

  const start = trimmed.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  return null;
}

/** Repair common AI mistakes in package.json before Sandpack parses it. */
export function sanitizePackageJsonContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return JSON.stringify(
      { name: "sandpack-project", version: "1.0.0", private: true },
      null,
      2,
    );
  }

  const candidates = [trimmed, extractJsonObject(trimmed)].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return JSON.stringify(parsed, null, 2);
      }
    } catch {
      /* try next candidate */
    }
  }

  return JSON.stringify(
    { name: "sandpack-project", version: "1.0.0", private: true },
    null,
    2,
  );
}

function isPackageJsonPath(path: string): boolean {
  return normalizePath(path).endsWith("package.json");
}

function cssPaths(files: Record<string, string>): string[] {
  return Object.entries(files)
    .filter(([path, content]) => path.endsWith(".css") && content.trim())
    .map(([path]) => normalizePath(path));
}

function htmlReferencesCss(html: string, cssPath: string): boolean {
  const variants = [cssPath, `/${cssPath}`, `./${cssPath}`];
  return variants.some((ref) => html.includes(ref));
}

export function injectCssLinks(html: string, cssFiles: string[]): string {
  let result = html;
  for (const cssPath of cssFiles) {
    if (htmlReferencesCss(result, cssPath)) continue;
    if (result.includes("</head>")) {
      result = result.replace(
        "</head>",
        `  <link rel="stylesheet" href="/${cssPath}" />\n</head>`,
      );
    } else if (result.includes("<head>")) {
      result = result.replace(
        "<head>",
        `<head>\n  <link rel="stylesheet" href="/${cssPath}" />`,
      );
    }
  }
  return result;
}

export function inlineCssForPreview(
  html: string,
  files: Record<string, string>,
): string {
  let result = html;
  for (const cssPath of cssPaths(files)) {
    const content = files[cssPath] ?? files[`/${cssPath}`];
    if (!content || !htmlReferencesCss(result, cssPath)) continue;

    const styleTag = `<style data-snapbuild-inlined="${cssPath}">\n${content}\n</style>`;
    for (const ref of [cssPath, `/${cssPath}`, `./${cssPath}`]) {
      const linkRe = new RegExp(
        `<link[^>]+href=["']${ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
        "i",
      );
      if (linkRe.test(result)) {
        result = result.replace(linkRe, styleTag);
        break;
      }
    }
  }
  return result;
}

/** Inline linked CSS, then append any remaining .css files (matches deploy behavior). */
export function inlineCssForDeploy(
  html: string,
  files: Record<string, string>,
): string {
  let result = inlineCssForPreview(html, files);

  for (const cssPath of cssPaths(files)) {
    if (result.includes(`data-snapbuild-inlined="${cssPath}"`)) continue;
    const content = files[cssPath] ?? files[`/${cssPath}`];
    if (!content?.trim()) continue;

    const styleTag = `<style data-snapbuild-inlined="${cssPath}">\n${content}\n</style>`;
    if (result.includes("</head>")) {
      result = result.replace("</head>", `  ${styleTag}\n</head>`);
    } else if (result.includes("<body")) {
      result = result.replace("<body", `${styleTag}\n<body`);
    } else {
      result = `${styleTag}\n${result}`;
    }
  }

  return result;
}

export function normalizeStaticFiles(
  files: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith("/") && content === "") continue;
    if (path.includes("node_modules")) continue;
    const normalized = normalizePath(path);
    result[normalized] = isPackageJsonPath(normalized)
      ? sanitizePackageJsonContent(content)
      : content;
  }

  const indexHtml = result["index.html"];
  if (indexHtml) {
    result["index.html"] = injectCssLinks(indexHtml, cssPaths(result));
  }

  return repairStaticSiteFiles(result);
}

export function preparePreviewHtml(
  html: string,
  files: Record<string, string>,
): string {
  const normalized = normalizeStaticFiles(files);
  const indexHtml = normalized["index.html"] ?? html;
  return inlineCssForDeploy(indexHtml, normalized);
}

export function stripPreviewArtifacts(html: string): string {
  let result = stripEditorArtifacts(html);
  // Remove preview-only element picker script (must never be saved to project files)
  result = result.replace(
    /<script[^>]*data-snapbuild-picker[^>]*>[\s\S]*?<\/script>\s*/gi,
    "",
  );
  if (result.includes(PREVIEW_PICKER_SCRIPT.slice(0, 40))) {
    result = result.replace(PREVIEW_PICKER_SCRIPT, "");
  }
  return result;
}

export function stripEditorArtifacts(html: string): string {
  return html
    .replace(/<style[^>]*>\s*\[data-editable\][\s\S]*?<\/style>/gi, "")
    .replace(/\s*class="selected"/g, "")
    .replace(/\s*data-snapbuild-inlined="[^"]*"/g, "");
}

export function insertImageIntoHtml(
  html: string,
  url: string,
  alt: string,
): string {
  const imgTag = `<img src="${url}" alt="${alt}" class="w-full rounded-lg object-cover" data-editable="image-${Date.now()}" />`;

  const heroMatch = html.match(/<section[^>]*class="[^"]*hero[^"]*"[^>]*>/i);
  if (heroMatch) {
    const insertAt = html.indexOf(heroMatch[0]) + heroMatch[0].length;
    return `${html.slice(0, insertAt)}\n    ${imgTag}\n${html.slice(insertAt)}`;
  }

  if (html.includes("</main>")) {
    return html.replace(
      "</main>",
      `  <section class="py-8 px-6">\n    ${imgTag}\n  </section>\n</main>`,
    );
  }

  if (html.includes("</body>")) {
    return html.replace("</body>", `  ${imgTag}\n</body>`);
  }

  return `${html}\n${imgTag}`;
}
