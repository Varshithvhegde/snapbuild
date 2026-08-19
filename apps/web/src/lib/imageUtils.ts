/** Helpers for image uploads and AI vision attachments. */

const OPENAI_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export function inferImageMimeType(
  filename: string,
  provided?: string,
): string {
  if (provided && provided.startsWith("image/")) return provided;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "image/jpeg";
}

export function isOpenAiSupportedImage(mime: string, filename: string): boolean {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return false;
  if (mime === "image/svg+xml") return false;
  return OPENAI_IMAGE_TYPES.has(mime);
}

/** Fix data URLs missing a mime type — common when browsers leave file.type empty. */
export function normalizeImageDataUrl(
  dataUrl: string,
  mimeType: string,
): string {
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const comma = dataUrl.indexOf(",");
  if (comma === -1) return dataUrl;

  const meta = dataUrl.slice(5, comma);
  const payload = dataUrl.slice(comma + 1);
  const isBase64 = meta.includes("base64");
  const currentMime = meta.split(";")[0];

  if (currentMime && currentMime.startsWith("image/")) {
    return dataUrl;
  }

  const normalized = `${mimeType}${isBase64 ? ";base64" : ""},${payload}`;
  return `data:${normalized}`;
}

/** Read a File as a normalized data URL suitable for OpenAI vision. */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  const mimeType = inferImageMimeType(file.name, file.type);

  if (!isOpenAiSupportedImage(mimeType, file.name)) {
    return Promise.reject(
      new Error(
        "Use JPG, PNG, GIF, or WebP for chat images. HEIC and SVG are not supported by the AI.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read image file"));
        return;
      }
      resolve(normalizeImageDataUrl(reader.result, mimeType));
    };
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

/** Normalize image URLs before sending to the AI SDK / OpenAI. */
export function normalizeImageForModel(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (!url.startsWith("data:")) {
    return url;
  }

  const comma = url.indexOf(",");
  if (comma === -1) return url;

  const meta = url.slice(5, comma);
  const payload = url.slice(comma + 1);
  const isBase64 = meta.includes("base64");
  const currentMime = meta.split(";")[0];

  if (currentMime && OPENAI_IMAGE_TYPES.has(currentMime)) {
    return url;
  }

  return `data:image/jpeg${isBase64 ? ";base64" : ""},${payload}`;
}
