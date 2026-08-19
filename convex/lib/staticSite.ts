/** Normalize static site files for preview and deploy. */

type FileEntry = { path: string; content: string };

function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

function isDeployableFile(path: string, content: string): boolean {
  if (path.endsWith("/") && content === "") return false;
  if (path.includes("node_modules")) return false;
  return true;
}

function findIndexHtml(files: Record<string, string>): string | null {
  return files["index.html"] ?? files["/index.html"] ?? null;
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

/** Ensure index.html links to styles.css when that file exists. */
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
    } else {
      result = result.replace(
        "<html",
        `<html><head><link rel="stylesheet" href="/${cssPath}" /></head>`,
      );
    }
  }
  return result;
}

/** Inline linked local CSS, then append any remaining .css files into index.html. */
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

function cssWasInlined(html: string, cssPath: string): boolean {
  return html.includes(`data-snapbuild-inlined="${cssPath}"`);
}

/** Inline linked local CSS into HTML for iframe previews. */
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

export function normalizeStaticFiles(
  files: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    if (!isDeployableFile(path, content)) continue;
    result[normalizePath(path)] = content;
  }

  const indexHtml = findIndexHtml(result);
  if (indexHtml) {
    const key = result["index.html"] !== undefined ? "index.html" : null;
    if (key) {
      result[key] = injectCssLinks(indexHtml, cssPaths(result));
    }
  }

  return result;
}

export function normalizeFileList(files: FileEntry[]): FileEntry[] {
  const map = normalizeStaticFiles(
    Object.fromEntries(files.map((f) => [f.path, f.content])),
  );
  return Object.entries(map).map(([path, content]) => ({ path, content }));
}

/** Inline local JS referenced from index.html so deploy works without separate MIME issues. */
export function inlineLocalScripts(
  html: string,
  files: Record<string, string>,
): string {
  let result = html;
  for (const [path, content] of Object.entries(files)) {
    if (!/\.(js|mjs)$/i.test(path)) continue;
    const refs = [path, `/${path}`, `./${path}`];
    for (const ref of refs) {
      const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const scriptRe = new RegExp(
        `<script([^>]*?)src=["']${escaped}["']([^>]*)>\\s*</script>`,
        "i",
      );
      if (scriptRe.test(result)) {
        result = result.replace(
          scriptRe,
          `<script$1$2>\n${content}\n</script>`,
        );
        break;
      }
    }
  }
  return result;
}

function isDeployAssetPath(path: string): boolean {
  if (path === "index.html") return true;
  if (/^src\//.test(path) && /\.(tsx?|jsx)$/i.test(path)) return false;
  if (/^(package\.json|vite\.config|tsconfig|\.env)/.test(path)) return false;
  return /\.(css|js|mjs|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|json|wasm|map|txt|html)$/i.test(
    path,
  );
}

function htmlReferencesScript(html: string, scriptPath: string): boolean {
  const refs = [scriptPath, `/${scriptPath}`, `./${scriptPath}`];
  return refs.some((ref) => {
    const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `<script[^>]+src=["']${escaped}["']`,
      "i",
    ).test(html);
  });
}

/** Bundle static site for deploy: normalize paths, inline CSS/JS into index.html. */
export function prepareDeployBundle(files: FileEntry[]): FileEntry[] {
  const normalized = normalizeFileList(files);
  const map = Object.fromEntries(normalized.map((f) => [f.path, f.content]));
  const originalHtml = map["index.html"];

  if (!originalHtml) {
    return normalized.filter((f) => isDeployAssetPath(f.path));
  }

  let indexHtml = inlineCssForDeploy(originalHtml, map);
  indexHtml = inlineLocalScripts(indexHtml, map);

  const bundled = normalized
    .filter((f) => isDeployAssetPath(f.path))
    .filter((f) => {
      if (f.path === "index.html") return true;
      if (f.path.endsWith(".css") && cssWasInlined(indexHtml, f.path)) return false;
      if (/\.(js|mjs)$/i.test(f.path) && htmlReferencesScript(originalHtml, f.path)) {
        return false;
      }
      return true;
    })
    .map((f) =>
      f.path === "index.html" ? { path: "index.html", content: indexHtml } : f,
    );

  return bundled.length > 0 ? bundled : [{ path: "index.html", content: indexHtml }];
}
