"use node";

import esbuild from "esbuild";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { FileEntry } from "./lib/projectBuildDetect";
import {
  fileMapFromEntries,
  isBundledProject,
  normalizePath,
} from "./lib/projectBuildDetect";

const fileValidator = v.object({
  path: v.string(),
  content: v.string(),
});

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

function cleanVersion(version: string): string {
  return version.replace(/^[\^~>=<]+/, "").split(" ")[0] ?? version;
}

function esmShUrl(specifier: string, deps: Record<string, string>): string {
  let pkgName = specifier;
  let subpath = "";

  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    pkgName = `${parts[0]}/${parts[1]}`;
    subpath = parts.slice(2).join("/");
  } else {
    const slash = specifier.indexOf("/");
    if (slash !== -1) {
      pkgName = specifier.slice(0, slash);
      subpath = specifier.slice(slash + 1);
    }
  }

  const version = deps[pkgName] ? cleanVersion(deps[pkgName]) : "";
  const base = version
    ? `https://esm.sh/${pkgName}@${version}`
    : `https://esm.sh/${pkgName}`;
  return subpath ? `${base}/${subpath}` : base;
}

function resolveWithExtensions(
  base: string,
  files: Record<string, string>,
): string | null {
  const clean = normalizePath(base);
  const candidates = [
    clean,
    clean.replace(/^\.\//, ""),
    `${clean}.tsx`,
    `${clean}.ts`,
    `${clean}.jsx`,
    `${clean}.js`,
    `${clean}.css`,
    `${clean.replace(/^\.\//, "")}.tsx`,
    `${clean.replace(/^\.\//, "")}.jsx`,
  ];

  for (const candidate of candidates) {
    const key = normalizePath(candidate);
    if (files[key] !== undefined) return key;
  }

  for (const key of Object.keys(files)) {
    if (key.endsWith(`${clean}/index.tsx`) || key.endsWith(`${clean}/index.ts`)) {
      return key;
    }
  }

  return null;
}

function findEntryPoint(map: Record<string, string>): string | null {
  const html = map["index.html"];
  if (html) {
    const moduleMatch = html.match(
      /<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/i,
    );
    const srcMatch =
      moduleMatch ??
      html.match(/<script[^>]+src=["']([^"']+\.(?:tsx?|jsx?|mjs))["']/i);
    if (srcMatch) {
      const resolved = resolveWithExtensions(srcMatch[1], map);
      if (resolved) return resolved;
    }
  }

  for (const candidate of [
    "src/main.tsx",
    "src/main.jsx",
    "src/index.tsx",
    "src/index.jsx",
    "index.tsx",
    "index.jsx",
    "main.tsx",
    "main.jsx",
  ]) {
    if (map[candidate]) return candidate;
  }

  return null;
}

function findRootElementId(map: Record<string, string>): string {
  const html = map["index.html"];
  const match = html?.match(/<div[^>]+id=["']([^"']+)["']/i);
  return match?.[1] ?? "root";
}

function loaderForPath(
  filePath: string,
): "tsx" | "ts" | "jsx" | "js" | "json" | "text" {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const loaders: Record<string, "tsx" | "ts" | "jsx" | "js" | "json" | "text"> = {
    tsx: "tsx",
    ts: "ts",
    jsx: "jsx",
    js: "js",
    json: "json",
    svg: "text",
    html: "text",
    txt: "text",
  };
  return loaders[ext] ?? "js";
}

function cssModuleContents(path: string, css: string): string {
  return `
const css = ${JSON.stringify(css)};
if (typeof document !== "undefined") {
  const el = document.createElement("style");
  el.setAttribute("data-snapbuild-inlined", ${JSON.stringify(path)});
  el.textContent = css;
  document.head.appendChild(el);
}
export default css;
`;
}

function extractHeadExtras(html: string | undefined): string {
  if (!html) return "";
  const parts: string[] = [];
  const tailwind = html.match(
    /<script[^>]+src=["']https:\/\/cdn\.tailwindcss\.com[^"']*["'][^>]*><\/script>/i,
  );
  if (tailwind) parts.push(tailwind[0]);
  const chart = html.match(
    /<script[^>]+src=["']https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js[^"']*["'][^>]*><\/script>/i,
  );
  if (chart) parts.push(chart[0]);
  return parts.join("\n  ");
}

function buildDeployHtml(
  originalHtml: string | undefined,
  scriptPath: string,
  rootId: string,
): string {
  const title =
    originalHtml?.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ??
    "My Site";
  const headExtras = extractHeadExtras(originalHtml);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${headExtras}
</head>
<body>
  <div id="${rootId}"></div>
  <script type="module" src="/${scriptPath}"></script>
</body>
</html>`;
}

function synthesizeEntry(map: Record<string, string>, rootId: string): string {
  const appImport = map["src/App.tsx"]
    ? "./src/App"
    : map["src/App.jsx"]
      ? "./src/App"
      : map["App.tsx"]
        ? "./App"
        : map["App.jsx"]
          ? "./App"
          : null;

  if (!appImport) {
    throw new Error("Could not find a React entry file (App.tsx or main.tsx)");
  }

  const cssImports = ["src/index.css", "src/styles.css", "src/style.css", "styles.css", "style.css"]
    .filter((p) => map[p])
    .map((p) => `import "./${p}";`)
    .join("\n");

  return `${cssImports}
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "${appImport}";

const rootEl = document.getElementById("${rootId}");
if (!rootEl) throw new Error("Missing #${rootId} element");
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
}

function collectStaticAssets(
  source: Record<string, string>,
  usedPaths: Set<string>,
): FileEntry[] {
  const assets: FileEntry[] = [];
  for (const [path, content] of Object.entries(source)) {
    if (usedPaths.has(path)) continue;
    if (
      !/\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|mp4|webm|avif)$/i.test(path)
    ) {
      continue;
    }
    assets.push({ path, content });
  }
  return assets;
}

async function bundleProjectForDeploy(
  files: FileEntry[],
): Promise<FileEntry[]> {
  const source = fileMapFromEntries(files);
  if (!isBundledProject(source)) {
    return files;
  }

  const working = { ...source };
  const deps = parsePackageJson(working);
  let entry = findEntryPoint(working);
  const rootId = findRootElementId(working);

  if (!entry) {
    const syntheticPath = "__snapbuild_entry__.tsx";
    working[syntheticPath] = synthesizeEntry(working, rootId);
    entry = syntheticPath;
  }

  const entryAlias = "snapbuild-entry";
  const virtualPlugin: import("esbuild").Plugin = {
    name: "snapbuild-virtual-fs",
    setup(build) {
      build.onResolve({ filter: new RegExp(`^${entryAlias}$`) }, () => ({
        path: entry!,
        namespace: "snapbuild",
      }));

      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.namespace !== "snapbuild") return undefined;

        if (args.path.startsWith("https://")) {
          return { path: args.path, external: true };
        }

        if (args.path.startsWith(".")) {
          const importer = normalizePath(args.importer);
          const importerDir = importer.includes("/")
            ? importer.replace(/\/[^/]+$/, "")
            : "";
          let joined = args.path;
          if (args.path.startsWith("./")) {
            joined = importerDir
              ? `${importerDir}/${args.path.slice(2)}`
              : args.path.slice(2);
          } else if (args.path.startsWith("../")) {
            const parts = importerDir ? importerDir.split("/") : [];
            let rel = args.path;
            while (rel.startsWith("../")) {
              parts.pop();
              rel = rel.slice(3);
            }
            joined = [...parts, rel].join("/");
          }
          const resolved = resolveWithExtensions(joined, working);
          if (resolved) return { path: resolved, namespace: "snapbuild" };
        }

        if (!args.path.startsWith(".") && !args.path.startsWith("/")) {
          return { path: esmShUrl(args.path, deps), external: true };
        }

        return undefined;
      });

      build.onLoad({ filter: /\.css$/, namespace: "snapbuild" }, (args) => {
        const content = working[normalizePath(args.path)];
        if (content === undefined) {
          return { errors: [{ text: `CSS file not found: ${args.path}` }] };
        }
        return {
          contents: cssModuleContents(args.path, content),
          loader: "js",
        };
      });

      build.onLoad({ filter: /.*/, namespace: "snapbuild" }, (args) => {
        if (/\.css$/i.test(args.path)) return undefined;

        const content = working[normalizePath(args.path)];
        if (content === undefined) {
          return { errors: [{ text: `File not found: ${args.path}` }] };
        }
        return {
          contents: content,
          loader: loaderForPath(args.path),
        };
      });
    },
  };

  const result = await esbuild.build({
    entryPoints: [entryAlias],
    bundle: true,
    write: false,
    format: "esm",
    target: ["es2020"],
    jsx: "automatic",
    jsxImportSource: "react",
    plugins: [virtualPlugin],
    logLevel: "silent",
  });

  const jsOutput =
    result.outputFiles.find((f) => f.path.endsWith(".js")) ??
    result.outputFiles[0];
  if (!jsOutput) {
    throw new Error("Build produced no JavaScript output");
  }

  const usedPaths = new Set(Object.keys(working));
  const assetPath = "assets/index.js";
  return [
    {
      path: "index.html",
      content: buildDeployHtml(source["index.html"], assetPath, rootId),
    },
    { path: assetPath, content: jsOutput.text },
    ...collectStaticAssets(source, usedPaths),
  ];
}

export const bundleForDeploy = internalAction({
  args: {
    files: v.array(fileValidator),
  },
  handler: async (_ctx, args) => {
    try {
      return await bundleProjectForDeploy(args.files);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Build failed";
      throw new Error(`Vite/React build failed: ${message}`);
    }
  },
});
