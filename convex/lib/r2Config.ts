/** Shared R2 configuration for site deploys and user image uploads. */

export function r2Credentials() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_SITES_BUCKET ?? process.env.R2_BUCKET;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

  if (!accountId || !accessKey || !secretKey || !bucket) {
    return null;
  }

  return {
    accountId,
    accessKey,
    secretKey,
    bucket,
    publicBaseUrl,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

export function publicUrlForKey(key: string, publicBaseUrl?: string): string {
  const base = publicBaseUrl ?? process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("Missing R2_PUBLIC_BASE_URL for public image URLs");
  }
  return `${base}/${key}`;
}
