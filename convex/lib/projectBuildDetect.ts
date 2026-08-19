/** Detect Vite/React projects for server-side bundling (no Node APIs). */

export type FileEntry = { path: string; content: string };

export function normalizePath(path: string): string {
  return path.replace(/^\/+/, "");
}

export function fileMapFromEntries(files: FileEntry[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const file of files) {
    map[normalizePath(file.path)] = file.content;
  }
  return map;
}

function parsePackageJson(map: Record<string, string>): Record<string, string> {
  const raw = map["package.json"];
  if (!raw) return {};
  try {
    const pkg = JSON.parse(raw);
    return {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
  } catch {
    return {};
  }
}

export function isBundledProject(map: Record<string, string>): boolean {
  if (map["vite.config.ts"] || map["vite.config.js"]) return true;

  const deps = parsePackageJson(map);
  if (deps.vite || deps.react || deps["react-dom"]) return true;

  const hasModuleEntry = Object.keys(map).some(
    (p) =>
      /\.(tsx|jsx)$/i.test(p) &&
      !p.includes("vite.config") &&
      !p.includes(".d.ts"),
  );

  const indexHtml = map["index.html"];
  if (indexHtml && /type=["']module["']/i.test(indexHtml) && hasModuleEntry) {
    return true;
  }

  if (!indexHtml && (map["src/App.tsx"] || map["src/App.jsx"] || map["App.tsx"])) {
    return true;
  }

  return false;
}
