/** Final quality gate before finishing a one-shot build. */
export const QUALITY_BAR = `<quality_bar priority="critical">
Verify ALL before finishing:

UI KIT (shadcn + Tailwind):
[ ] Tailwind CDN + shadcn HSL variables on :root
[ ] tailwind.config maps hsl(var(--primary)) etc.
[ ] ALL buttons use ui_kit button recipes (not custom classes)
[ ] ALL cards use ui_kit card recipe
[ ] Navbar uses ui_kit sticky header pattern
[ ] Sections use container mx-auto max-w-6xl px-4 wrapper
[ ] text-muted-foreground for secondary text, bg-background/text-foreground for surfaces

DESIGN: Google Fonts loaded | brand via --primary HSL only | asymmetric hero | 6+ sections | motion CSS | scroll reveal

CONTENT: zero placeholders | zero AI slop | specific headline | outcome CTA | real images

TECHNICAL: deployable index.html | mobile 375px OK | semantic HTML | alt text | get_console_logs passes

ONE-SHOT: entire site in this session — user can deploy immediately
</quality_bar>`;
