export interface FilePatch {
  search: string;
  replace: string;
  replace_all?: boolean;
}

export const PATCH_FAILED_MARKER = "PATCH_FAILED: true";
export const RECOVERY_MESSAGE_PREFIX = "[snapbuild:recovery]";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find needle in haystack — exact, then normalized newlines, then flexible whitespace. */
export function findPatchMatch(
  content: string,
  search: string,
): { index: number; length: number } | null {
  if (!search) return null;

  let idx = content.indexOf(search);
  if (idx >= 0) return { index: idx, length: search.length };

  const normContent = content.replace(/\r\n/g, "\n");
  const normSearch = search.replace(/\r\n/g, "\n");
  idx = normContent.indexOf(normSearch);
  if (idx >= 0) {
    const before = content.slice(0, idx).replace(/\r\n/g, "\n");
    const origIdx = before.length === idx ? idx : content.indexOf(normSearch);
    if (origIdx >= 0) return { index: origIdx, length: normSearch.length };
  }

  const tokens = search.trim().split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const pattern = tokens.map(escapeRegex).join("\\s+");
    const re = new RegExp(pattern, "ms");
    const match = re.exec(content);
    if (match && match.index !== undefined) {
      return { index: match.index, length: match[0].length };
    }
  }

  return null;
}

export function applyFilePatches(
  content: string,
  patches: FilePatch[],
): {
  content: string;
  log: string[]; applied: number; failed: number;
  failedSearches: string[];
} {
  let result = content;
  const log: string[] = [];
  let applied = 0;
  let failed = 0;
  const failedSearches: string[] = [];

  for (let i = 0; i < patches.length; i++) {
    const { search, replace, replace_all } = patches[i];
    if (!search) {
      log.push(`patch #${i + 1}: ✗ empty search string`);
      failed++;
      failedSearches.push("");
      continue;
    }

    if (replace_all) {
      let count = 0;
      let working = result;
      let safety = 0;
      while (safety++ < 1000) {
        const match = findPatchMatch(working, search);
        if (!match) break;
        working =
          working.slice(0, match.index) +
          replace +
          working.slice(match.index + match.length);
        count++;
      }
      if (count > 0) {
        result = working;
        log.push(`patch #${i + 1}: ✓ applied ×${count}`);
        applied++;
      } else {
        const preview =
          search.length > 80 ? search.slice(0, 80) + "…" : search;
        log.push(`patch #${i + 1}: ✗ not found — "${preview}"`);
        failed++;
        failedSearches.push(search);
      }
      continue;
    }

    const match = findPatchMatch(result, search);
    if (match) {
      result =
        result.slice(0, match.index) +
        replace +
        result.slice(match.index + match.length);
      log.push(`patch #${i + 1}: ✓ applied`);
      applied++;
    } else {
      const preview = search.length > 80 ? search.slice(0, 80) + "…" : search;
      log.push(`patch #${i + 1}: ✗ not found — "${preview}"`);
      failed++;
      failedSearches.push(search);
    }
  }

  return { content: result, log, applied, failed, failedSearches };
}

/** Extract keywords from a failed patch search string for fuzzy line matching. */
function extractSearchKeywords(search: string): string[] {
  const keywords = new Set<string>();
  const classMatch = /class="([^"]+)"/.exec(search);
  if (classMatch) {
    for (const cls of classMatch[1].split(/\s+/)) {
      if (cls.length > 2) keywords.add(cls);
    }
  }
  const tagMatch = /^<\s*(\w+)/.exec(search.trim());
  if (tagMatch) keywords.add(`<${tagMatch[1]}`);
  for (const id of search.match(/#([\w-]+)/g) ?? []) keywords.add(id);
  for (const word of search.split(/\s+/)) {
    if (word.length > 4 && !word.includes("=")) keywords.add(word);
  }
  return [...keywords].slice(0, 8);
}

/** Help the agent see what's actually in the file after a failed patch. */
export function buildPatchFailureContext(
  fileContent: string,
  failedSearches: string[],
  maxChars = 14000,
): string {
  const sections: string[] = [];
  const fileLines = fileContent.split("\n");

  for (const search of failedSearches) {
    if (!search) continue;
    const keywords = extractSearchKeywords(search);
    const matches: { lineNum: number; text: string }[] = [];

    for (let i = 0; i < fileLines.length; i++) {
      const line = fileLines[i];
      const hitCount = keywords.filter((k) => line.includes(k)).length;
      if (hitCount >= Math.min(2, keywords.length)) {
        matches.push({ lineNum: i + 1, text: line.trim() });
      }
    }

    const preview =
      search.length > 100 ? search.slice(0, 100) + "…" : search;
    sections.push(`Failed search (not in file):\n  "${preview}"`);

    if (matches.length > 0) {
      sections.push("Closest matching lines in file:");
      for (const m of matches.slice(0, 10)) {
        sections.push(`  L${m.lineNum}: ${m.text.slice(0, 160)}`);
      }
    } else if (keywords.length > 0) {
      sections.push(`Keywords searched: ${keywords.join(", ")}`);
      const partial: { lineNum: number; text: string }[] = [];
      for (let i = 0; i < fileLines.length; i++) {
        if (keywords.some((k) => fileLines[i].includes(k))) {
          partial.push({ lineNum: i + 1, text: fileLines[i].trim() });
        }
      }
      if (partial.length > 0) {
        sections.push("Partial matches:");
        for (const m of partial.slice(0, 8)) {
          sections.push(`  L${m.lineNum}: ${m.text.slice(0, 160)}`);
        }
      }
    }
    sections.push("");
  }

  sections.push("=== CURRENT FULL FILE — copy, edit, then write_file ===");
  if (fileContent.length <= maxChars) {
    sections.push(fileContent);
  } else {
    sections.push(fileContent.slice(0, maxChars));
    sections.push(
      `\n... [truncated — file is ${fileContent.length} chars total]`,
    );
  }

  return sections.join("\n");
}

export function formatPatchResult(
  path: string,
  applied: number,
  failed: number,
  total: number,
  log: string[],
  fileContent?: string,
  failedSearches?: string[],
): string {
  const lines = [...log, "", `Result: ${applied}/${total} patches applied.`];

  if (failed > 0) {
    lines.push(
      "",
      PATCH_FAILED_MARKER,
      `STATUS: FAILED — ${failed}/${total} patch(es) NOT applied on "${path}".`,
      "The file was NOT updated (or only partially updated).",
      "REQUIRED: call write_file with the COMPLETE updated file content.",
      "Do NOT tell the user the edit is done — the change did not save.",
    );
    if (fileContent !== undefined && failedSearches && failedSearches.length > 0) {
      lines.push("", buildPatchFailureContext(fileContent, failedSearches));
    }
  } else {
    lines.push("", "PATCH_FAILED: false", "STATUS: SUCCESS — all patches applied.");
  }

  return lines.join("\n");
}

export function isPatchFailureResult(result: string): boolean {
  return result.includes(PATCH_FAILED_MARKER);
}

export function extractPatchFailurePath(result: string): string | null {
  const match = /NOT applied on "([^"]+)"/.exec(result);
  return match?.[1] ?? null;
}

export function isRecoveryMessage(content: string): boolean {
  return content.startsWith(RECOVERY_MESSAGE_PREFIX);
}

export function formatRecoveryForDisplay(content: string): string {
  const pathMatch = /"([^"]+)"/.exec(content);
  const path = pathMatch?.[1] ?? "file";
  return `⚠️ Patch failed on \`${path}\` — auto-retrying with full file context…`;
}
