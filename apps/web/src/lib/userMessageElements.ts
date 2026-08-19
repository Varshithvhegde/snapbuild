import type { ContentPart, Message } from "./generator";
import {
  formatSelectedElementsForPrompt,
  parseSelectedElementPart,
  type StoredElementSelection,
} from "./previewElementPicker";

function extractElementParts(content: ContentPart[]) {
  const elements: StoredElementSelection[] = [];
  for (const part of content) {
    if (part.type !== "text") continue;
    const parsed = parseSelectedElementPart(part.text);
    if (parsed) elements.push(parsed);
  }
  if (elements.length === 0) return null;

  const visibleText =
    content.find(
      (p): p is Extract<ContentPart, { type: "text" }> =>
        p.type === "text" &&
        !p.text.startsWith("[File:") &&
        !p.text.startsWith("[Image:") &&
        !p.text.startsWith("[SelectedElement:"),
    )?.text ?? "";

  return { visibleText, elements };
}

/** Expand stored element markers into full AI instructions for the API. */
export function expandUserMessagesForAPIWithElements(
  messages: Message[],
): Message[] {
  return messages.map((msg) => {
    if (msg.role !== "user" || !msg.content || typeof msg.content === "string") {
      return msg;
    }

    const extracted = extractElementParts(msg.content);
    if (!extracted) return msg;

    const aiText = formatSelectedElementsForPrompt(
      extracted.elements.map((el, i) => ({
        id: `stored-${i}`,
        ...el,
      })),
      extracted.visibleText,
    );

    const expanded: ContentPart[] = [{ type: "text", text: aiText }];
    for (const part of msg.content) {
      if (part.type === "text" && part.text.startsWith("[SelectedElement:")) {
        expanded.push(part);
        continue;
      }
      if (part.type === "text" && part.text.startsWith("[Image:")) {
        expanded.push(part);
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
