import type { Attachment } from "../types";
import type { PendingChatImage } from "./pendingImage";

export class AuthRequiredForImagesError extends Error {
  constructor() {
    super("Sign in to upload images to cloud storage");
    this.name = "AuthRequiredForImagesError";
  }
}

export function dataUrlToArrayBuffer(dataUrl: string): {
  buffer: ArrayBuffer;
  mimeType: string;
} {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid image data");

  const header = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mimeMatch = /data:([^;,]+)/.exec(header);
  const mimeType = mimeMatch?.[1]?.startsWith("image/")
    ? mimeMatch[1]
    : "image/jpeg";

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { buffer: bytes.buffer, mimeType };
}

type UploadFn = (args: {
  data: ArrayBuffer;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) => Promise<{ url: string }>;

/** Upload a data-URL image to R2, or pass through an existing https URL. */
export async function resolveChatImageUrl(
  content: string,
  filename: string,
  sizeBytes: number,
  upload: UploadFn,
  isAuthenticated: boolean,
): Promise<string> {
  if (content.startsWith("http://") || content.startsWith("https://")) {
    return content;
  }

  if (!content.startsWith("data:")) {
    throw new Error("Unsupported image format");
  }

  if (!isAuthenticated) {
    throw new AuthRequiredForImagesError();
  }

  const { buffer, mimeType } = dataUrlToArrayBuffer(content);
  const result = await upload({
    data: buffer,
    filename,
    mimeType,
    sizeBytes: sizeBytes || buffer.byteLength,
  });
  return result.url;
}

/** Upload all chat image attachments and collect resolved images for prompt injection. */
export async function prepareChatImages(
  attachments: Attachment[],
  pending: PendingChatImage[],
  upload: UploadFn,
  isAuthenticated: boolean,
): Promise<{ attachments: Attachment[]; images: PendingChatImage[] }> {
  const resolved = await Promise.all(
    attachments.map(async (att) => {
      if (att.type !== "image") return att;
      const url = await resolveChatImageUrl(
        att.content,
        att.name,
        att.size,
        upload,
        isAuthenticated,
      );
      return { ...att, content: url };
    }),
  );

  const images: PendingChatImage[] = [];
  const seen = new Set<string>();

  for (const img of pending) {
    if (!seen.has(img.url)) {
      seen.add(img.url);
      images.push(img);
    }
  }

  for (const att of resolved) {
    if (att.type !== "image") continue;
    if (seen.has(att.content)) continue;
    seen.add(att.content);
    images.push({ url: att.content, filename: att.name });
  }

  return { attachments: resolved, images };
}
