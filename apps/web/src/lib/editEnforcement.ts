import {
  RECOVERY_MESSAGE_PREFIX,
  PATCH_FAILED_MARKER,
} from "./patchFile";

const EDIT_KEYWORDS =
  /\b(remove|change|update|fix|make|add|delete|increase|decrease|reduce|solid|glass|glassmorphic|theme|color|padding|margin|spacing|bigger|smaller|blue|red|green|edit|move|align|center|bold|font|background|border|hover|style|nav|header|hero|button|cta)\b/i;

const MUTATING_TOOL_NAMES = new Set([
  "write_file",
  "patch_file",
  "apply_site_theme",
  "delete_file",
]);

export function isRecoveryMessage(content: string): boolean {
  return content.startsWith(RECOVERY_MESSAGE_PREFIX);
}

/** User message that expects a file edit (not a question). */
export function isEditUserMessage(content: string): boolean {
  if (!content.trim()) return false;
  if (isRecoveryMessage(content)) return false;
  if (content.includes("[Preview element selection")) return true;
  if (content.includes("[SelectedElement:")) return true;
  if (content.includes("CSS selector:")) return true;
  return EDIT_KEYWORDS.test(content);
}

export function formatRecoveryForDisplay(content: string): string {
  if (content.includes("PATCH FAILED") || content.includes("Patch on")) {
    const pathMatch = /"([^"]+)"/.exec(content);
    const path = pathMatch?.[1] ?? "file";
    return `⚠️ Patch failed on \`${path}\` — auto-retrying with full file context…`;
  }
  if (content.includes("EDIT NOT APPLIED") || content.includes("did NOT call write_file")) {
    const pathMatch = /write_file\("([^"]+)"/.exec(content);
    const path = pathMatch?.[1] ?? "file";
    return `⚠️ Edit not saved — retrying with \`${path}\` (must use write_file)…`;
  }
  return `⚠️ Edit incomplete — auto-retrying…`;
}

export function isMutatingToolName(name: string): boolean {
  return MUTATING_TOOL_NAMES.has(name);
}

export function toolResultModifiedFile(result: string): boolean {
  if (result.startsWith("OK — modified:") || result.startsWith("OK — created:")) {
    return true;
  }
  if (result.startsWith("OK — applied") && result.includes("theme")) {
    return true;
  }
  if (result.includes("PATCH_FAILED: false")) {
    return true;
  }
  if (result.includes("✓ applied") && !result.includes(PATCH_FAILED_MARKER)) {
    return true;
  }
  return false;
}

export function buildEditNotAppliedRecovery(
  path: string,
  fileContent: string,
): string {
  const maxChars = 14000;
  const fileSection =
    fileContent.length <= maxChars
      ? fileContent
      : `${fileContent.slice(0, maxChars)}\n... [truncated ${fileContent.length - maxChars} chars]`;

  return (
    `${RECOVERY_MESSAGE_PREFIX} EDIT NOT APPLIED — you did NOT call write_file or patch_file. ` +
    `The user's requested change was NOT saved to the site. ` +
    `You MUST call write_file("${path}", ...) with the complete updated HTML now. ` +
    `Do NOT reply "Done" until write_file returns OK.\n\n` +
    `=== CURRENT ${path} (edit this, then write_file the full result) ===\n${fileSection}`
  );
}

export function getMessageText(content: MessageLike): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("\n");
  }
  return "";
}

export function messageExpectsEdit(content: MessageLike): boolean {
  const text = getMessageText(content);
  if (isEditUserMessage(text)) return true;
  if (Array.isArray(content)) {
    return content.some(
      (p) => p.type === "text" && p.text?.startsWith("[SelectedElement:"),
    );
  }
  return false;
}

type MessageLike =
  | string
  | ReadonlyArray<{ type: string; text?: string }>
  | null
  | undefined;
