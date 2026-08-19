/** How to edit existing sites — theme, layout, copy, selected elements. */
export const EDIT_PROTOCOL = `<edit_protocol priority="critical">
Use this whenever the user asks to CHANGE an existing site (theme, colors, spacing, copy, layout) — NOT for greenfield builds.

<mandatory_workflow>
1. read_files FIRST — always read index.html (and styles.css if separate) BEFORE any edit. Never guess file contents.
2. Apply changes with patch_file for small edits OR write_file for theme/overhaul (preferred when >3 patches needed).
3. If patch_file returns "✗ not found" or "FAILED" — immediately read_files then write_file the full file. Never stop after failed patches.
4. get_console_logs after edits; fix errors before saying done.
5. Chat: 1 sentence confirming what changed visually (e.g. "Done — switched to a blue theme across buttons, nav, and CTA.").
</mandatory_workflow>

<theme_color_change procedure="follow_exactly">
When user asks for blue/green/red/dark theme or "change colors":

STEP 1 — Call apply_site_theme with the matching preset (blue, navy, green, emerald, etc.)
  This reliably updates --primary CSS variables AND replaces hardcoded green/emerald Tailwind classes.

STEP 2 — read_files(["index.html"]) to verify. If custom hex colors or brown/cream brand colors remain on buttons/CTAs, write_file with those updated to bg-primary/text-primary.

STEP 3 — get_console_logs to confirm no errors.

DO NOT use patch_file for theme changes — it fails too often.
</theme_color_change>

<spacing_layout_change>
When user selects elements or mentions padding/margin/gap/spacing:
1. Use the CSS selector from [Preview element selection] if provided.
2. read_files to find exact class strings on that element.
3. patch_file the specific class attribute OR parent section padding (e.g. py-20 → py-12, pt-24 → pt-12, gap-12 → gap-8).
4. For "space between X and Y": reduce padding-top on the lower element OR padding-bottom on the upper, or gap in their shared grid/flex parent.
</spacing_layout_change>

<copy_change>
- patch_file the exact text string found in read_files output.
- Include 2-3 lines of surrounding HTML context in the search string for uniqueness.
</copy_change>

<when_to_write_vs_patch>
- Theme rebrand, section restructure, >3 changes → write_file (full index.html)
- Single text swap, one class change, one CSS variable → patch_file
- ANY failed patch → write_file immediately
- Style removal (glassmorphic, blur, transparency) → read_files then write_file with backdrop-blur/bg-opacity classes removed from the target selector
</when_to_write_vs_patch>

<style_removal>
When user asks to remove glassmorphic/glass/blur/transparency on nav/header/element:
1. read_files(["index.html"])
2. Find the element by CSS selector from [Preview element selection] if provided
3. Remove classes like backdrop-blur*, bg-white/80, bg-opacity-*, supports-[backdrop-filter] from that element
4. Replace with solid bg (e.g. bg-white or bg-background) — write_file the full index.html
5. Do NOT reply "Done" until write_file returns OK
</style_removal>
</edit_protocol>`;

/** HSL presets the agent can use for common theme requests */
export const THEME_PRESETS = {
  blue: { primary: "221 83% 53%", label: "Blue" },
  navy: { primary: "224 76% 40%", label: "Navy" },
  sky: { primary: "199 89% 48%", label: "Sky blue" },
  indigo: { primary: "239 84% 67%", label: "Indigo" },
  purple: { primary: "262 83% 58%", label: "Purple" },
  green: { primary: "142 71% 35%", label: "Green" },
  emerald: { primary: "152 69% 22%", label: "Emerald" },
  red: { primary: "0 72% 51%", label: "Red" },
  orange: { primary: "25 95% 53%", label: "Orange" },
  rose: { primary: "346 77% 50%", label: "Rose" },
} as const;
