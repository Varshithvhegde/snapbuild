import type { ContentPart, Message } from "./generator";
import { buildPromptWithUserImages } from "./pendingImage";

function extractImageParts(content: ContentPart[]) {
  const imageUrls = content.filter(
    (p): p is Extract<ContentPart, { type: "image_url" }> =>
      p.type === "image_url",
  );
  if (imageUrls.length === 0) return null;

  const visibleText =
    content.find(
      (p): p is Extract<ContentPart, { type: "text" }> =>
        p.type === "text" &&
        !p.text.startsWith("[File:") &&
        !p.text.startsWith("[Image:") &&
        !p.text.startsWith("[SelectedElement:"),
    )?.text ?? "";

  const metaNames = content
    .filter((p): p is Extract<ContentPart, { type: "text" }> => p.type === "text")
    .map((p) => /^\[Image: (.+?)\]$/.exec(p.text.trim())?.[1])
    .filter((name): name is string => Boolean(name));

  const images = imageUrls.map((part, i) => ({
    url: part.image_url.url,
    filename: metaNames[i] ?? `image-${i + 1}`,
  }));

  return { visibleText, images };
}

/** Expand user messages with image URL instructions for the API. */
export function expandUserMessagesForAPI(
  messages: Message[],
  supportsVision: boolean,
): Message[] {
  return messages.map((msg) => {
    if (msg.role !== "user" || !msg.content || typeof msg.content === "string") {
      return msg;
    }

    const extracted = extractImageParts(msg.content);
    if (!extracted) return msg;

    const aiText = buildPromptWithUserImages(
      extracted.visibleText,
      extracted.images,
    );

    if (!supportsVision) {
      const textOnly: ContentPart[] = [{ type: "text", text: aiText }];
      for (const part of msg.content) {
        if (part.type === "text" && part.text.startsWith("[File:")) {
          textOnly.push(part);
        }
      }
      return { ...msg, content: textOnly };
    }

    const expanded: ContentPart[] = [{ type: "text", text: aiText }];
    for (const part of msg.content) {
      if (part.type === "text" && !part.text.startsWith("[File:")) {
        if (part.text.startsWith("[Image:")) expanded.push(part);
        continue;
      }
      if (part.type === "image_url") expanded.push(part);
      if (part.type === "text" && part.text.startsWith("[File:")) {
        expanded.push(part);
      }
    }

    return { ...msg, content: expanded };
  });
}
