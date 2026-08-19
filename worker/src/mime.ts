/** MIME types for static assets served from R2 (shared logic for worker + Convex). */
export function contentTypeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    jsx: "application/javascript; charset=utf-8",
    ts: "application/javascript; charset=utf-8",
    tsx: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    map: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    wasm: "application/wasm",
  };
  return map[ext] ?? "application/octet-stream";
}

export function isAssetPath(path: string): boolean {
  const base = path.split("/").pop() ?? "";
  return base.includes(".") && !base.endsWith(".html") && !base.endsWith(".htm");
}
