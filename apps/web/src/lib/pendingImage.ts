import type { Attachment } from "../types";

/** Image selected from the user's library, pending attachment to the next chat message. */
export interface PendingChatImage {
  url: string;
  filename: string;
}

/** Marker prefix for AI-only image instructions (stripped from chat UI). */
export const AI_IMAGE_INSTRUCTION_MARKER =
  "[User uploaded image — use this EXACT URL in your code. Do NOT ask for the image again or use placeholders.]";

/** Hidden metadata prefix for image filename in message parts (stripped from chat UI). */
export const IMAGE_META_PREFIX = "[Image:";

/** Append explicit image URL instructions so the AI uses uploads without asking again. */
export function buildPromptWithUserImages(
  prompt: string,
  images: PendingChatImage[],
): string {
  if (images.length === 0) return prompt.trim();

  const base =
    prompt.trim() ||
    (images.length === 1
      ? "Use the attached image in the website as described."
      : `Use all ${images.length} attached images in the website as described.`);

  const lines = images.map(
    (img, i) => `${i + 1}. ${img.filename}: ${img.url}`,
  );

  return `${base}

${AI_IMAGE_INSTRUCTION_MARKER}
The user uploaded ${images.length} image${images.length === 1 ? "" : "s"}. Use these EXACT URLs in your code. Do NOT ask for images again or use placeholders.
${lines.join("\n")}`;
}

/** @deprecated Use buildPromptWithUserImages */
export function buildPromptWithUserImage(
  prompt: string,
  image: PendingChatImage,
): string {
  return buildPromptWithUserImages(prompt, [image]);
}

/** Remove AI-only image instructions from text shown in the chat bubble. */
export function stripAiImageInstructions(text: string): string {
  const idx = text.indexOf(AI_IMAGE_INSTRUCTION_MARKER);
  if (idx === -1) return text.trim();
  return text.slice(0, idx).trim();
}

/** Default visible label when the user sends images without typing a message. */
export function defaultDisplayTextForImages(
  prompt: string,
  imageCount: number,
): string {
  if (prompt.trim()) return prompt.trim();
  if (imageCount <= 1) return "Use this image in the site";
  return `Use these ${imageCount} images in the site`;
}

/** @deprecated Use defaultDisplayTextForImages */
export function defaultDisplayTextForImage(prompt: string): string {
  return defaultDisplayTextForImages(prompt, 1);
}

/** Merge pending library picks into attachment list without duplicates. */
export function mergePendingIntoAttachments(
  attachments: Attachment[],
  pending: PendingChatImage[],
): Attachment[] {
  const result: Attachment[] = [...attachments];
  for (const img of pending) {
    if (result.some((a) => a.type === "image" && a.content === img.url)) {
      continue;
    }
    result.push({
      type: "image",
      name: img.filename,
      content: img.url,
      size: 0,
    });
  }
  return result;
}
