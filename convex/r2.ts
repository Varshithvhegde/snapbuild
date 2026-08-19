"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { contentType } from "./lib/utils";
import { publicUrlForKey, r2Credentials } from "./lib/r2Config";

async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string | ArrayBuffer): Promise<string> {
  const input =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest("SHA-256", input);
  return toHex(hash);
}

async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: ArrayBuffer | string,
  accessKey: string,
  secretKey: string,
  region: string,
): Promise<Record<string, string>> {
  const service = "s3";
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body);

  const signedHeaders = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
    .join(";");

  const canonicalHeaders = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}\n`)
    .sort()
    .join("");

  const canonicalRequest = [
    method,
    url.pathname,
    url.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmacSha256(
    new TextEncoder().encode(`AWS4${secretKey}`).buffer,
    dateStamp,
  );
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = toHex(await hmacSha256(kSigning, stringToSign));

  return {
    ...headers,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function putObject(
  endpoint: string,
  bucket: string,
  key: string,
  body: ArrayBuffer | string,
  accessKey: string,
  secretKey: string,
  mimeType?: string,
): Promise<void> {
  const url = new URL(`${endpoint}/${bucket}/${key}`);
  const bodyBytes =
    typeof body === "string" ? new TextEncoder().encode(body) : new Uint8Array(body);
  const headers: Record<string, string> = {
    Host: url.host,
    "Content-Type": mimeType ?? contentType(key),
    "Content-Length": String(bodyBytes.byteLength),
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const signed = await signRequest(
    "PUT",
    url,
    headers,
    bodyBytes.buffer,
    accessKey,
    secretKey,
    "auto",
  );

  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: signed,
    body: bodyBytes,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }
}

export const uploadSiteToR2 = internalAction({
  args: {
    siteId: v.string(),
    slug: v.string(),
    files: v.array(v.object({ path: v.string(), content: v.string() })),
  },
  handler: async (_ctx, args) => {
    const creds = r2Credentials();
    if (!creds) {
      throw new Error(
        "Missing R2 env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_SITES_BUCKET (or R2_BUCKET)",
      );
    }

    const prefix = `sites/${args.slug}`;

    await Promise.all(
      args.files.map((file) => {
        const normalized = file.path.replace(/^\/+/, "");
        return putObject(
          creds.endpoint,
          creds.bucket,
          `${prefix}/${normalized}`,
          file.content,
          creds.accessKey,
          creds.secretKey,
        );
      }),
    );

    const domain = process.env.SNAPBUILD_DOMAIN ?? "localhost";
    const isLocal =
      domain.includes("localhost") || domain.startsWith("127.");
    return {
      deployedUrl: `${isLocal ? "http" : "https"}://${args.slug}.${domain}`,
      r2Prefix: prefix,
    };
  },
});

export const uploadUserImageToR2 = internalAction({
  args: {
    userId: v.string(),
    data: v.bytes(),
    filename: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, args) => {
    const creds = r2Credentials();
    if (!creds?.publicBaseUrl) {
      throw new Error(
        "Missing R2 env vars for image upload. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL",
      );
    }

    const ext = args.filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExt = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
      ? ext
      : "jpg";
    const key = `snapbuild-images/${args.userId}/${crypto.randomUUID()}.${safeExt}`;

    await putObject(
      creds.endpoint,
      creds.bucket,
      key,
      args.data,
      creds.accessKey,
      creds.secretKey,
      args.mimeType,
    );

    return {
      r2Key: key,
      publicUrl: publicUrlForKey(key, creds.publicBaseUrl),
    };
  },
});
