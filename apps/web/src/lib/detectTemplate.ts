import type { ProjectFiles } from "./generator";

/** Pick the Sandpack template that matches project files. */
export function detectSandpackTemplate(files: ProjectFiles): string {
  const paths = Object.keys(files).filter(
    (p) => !p.endsWith("/") && files[p] !== "",
  );

  const hasReactEntry = paths.some(
    (p) =>
      p === "src/App.tsx" ||
      p === "src/main.tsx" ||
      p === "src/App.jsx" ||
      p === "App.tsx",
  );

  const hasIndexHtml = paths.some(
    (p) => p === "index.html" || p.endsWith("/index.html"),
  );

  if (hasReactEntry) return "vite-react-ts";
  if (hasIndexHtml) return "static";
  return "vite-react-ts";
}
