import { contentTypeForPath, isAssetPath } from "./mime";

interface Env {
  SITES_BUCKET: R2Bucket;
  DOMAIN: string;
}

const LANDING_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Snapbuild Sites</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#fff"><div style="text-align:center;max-width:28rem;padding:2rem"><h1 style="font-size:1.5rem;margin-bottom:.5rem">Snapbuild</h1><p style="opacity:.7">Published sites live at <code style="opacity:.9">yourname.site.sharepad.in</code></p></div></body></html>`;

function notFoundHtml(): Response {
  return new Response(
    `<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#fff"><div style="text-align:center"><h1 style="font-size:4rem;opacity:.3">404</h1><p style="opacity:.6">Site not found</p></div></body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function serveSite(
  env: Env,
  slug: string,
  filePath: string,
): Promise<Response> {
  if (!slug || slug.includes(".")) {
    return notFoundHtml();
  }

  let path = filePath;
  if (path === "/") path = "/index.html";
  const r2Key = `sites/${slug}${path}`;

  let object = await env.SITES_BUCKET.get(r2Key);
  if (!object && !isAssetPath(path)) {
    object = await env.SITES_BUCKET.get(`sites/${slug}/index.html`);
    if (object) path = "/index.html";
  }
  if (!object) return notFoundHtml();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", contentTypeForPath(path));
  headers.set("etag", object.httpEtag);
  headers.set(
    "Cache-Control",
    path.endsWith(".html") ? "public, max-age=60" : "public, max-age=31536000, immutable",
  );
  headers.set("X-Snapbuild-Slug", slug);

  return new Response(object.body, { headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    if (hostname === env.DOMAIN) {
      return new Response(LANDING_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (hostname.endsWith(`.${env.DOMAIN}`)) {
      const slug = hostname.slice(0, -(env.DOMAIN.length + 1));
      if (!slug || slug.includes(".")) {
        return Response.redirect(`https://${env.DOMAIN}`, 302);
      }
      return serveSite(env, slug, url.pathname);
    }

    return new Response("Not found", { status: 404 });
  },
};
