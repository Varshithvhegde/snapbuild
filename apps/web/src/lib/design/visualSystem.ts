import { DESIGN_MOTION_SNIPPET } from "./motion";

/** Typography, color, spacing, motion — with paste-ready code templates. */
export const VISUAL_SYSTEM = `<visual_system>
Define tokens FIRST, then build UI. Every site shares this foundation.

<typography mandatory="true">
Load Google Fonts — NEVER ship system-font-only or Inter-only sites.

Font pairs (pick ONE pair per site):
| Archetype | Display | Body |
|-----------|---------|------|
| Editorial | Fraunces, Cormorant, Playfair Display | DM Sans, Source Sans 3, Lato |
| Tech/SaaS | Space Grotesk, Syne, Outfit | IBM Plex Sans, Work Sans, Inter* |
| Luxury | Cormorant Garamond, Bodoni Moda | Jost, Montserrat |
| Bold/Agency | Oswald, Bebas Neue (sparingly) | Lato, Source Sans 3 |
| Creative | Clash-style: Syne, Cabinet Grotesk feel via Outfit | Work Sans |

*Inter only OK as BODY font paired with a distinctive display font — never Inter alone.

Type scale:
- h1: text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[1.05]
- h2: text-2xl sm:text-3xl md:text-4xl font-display tracking-tight
- h3: text-xl md:text-2xl font-semibold
- body: text-base md:text-lg leading-relaxed text-[var(--text-muted)]
- eyebrow: text-xs uppercase tracking-[0.2em] font-semibold text-[var(--accent)]

Headline rules:
- 6-12 words max on h1
- One accent word in italic or accent color is OK — not whole gradient text
- Subhead: one sentence, max 20 words, explains HOW not WHAT
</typography>

<color mandatory="true">
ONE accent color — used ONLY for: primary buttons, links, eyebrows, key highlights, active states.
3-4 neutrals via CSS variables on :root:

Example token block (customize hex per brand):
:root {
  --bg: #FAF8F5;
  --surface: #FFFFFF;
  --text: #1A1814;
  --text-muted: #6B6560;
  --accent: #C2410C;
  --accent-soft: rgba(194, 65, 12, 0.12);
  --border: rgba(26, 24, 20, 0.08);
}

Approved palettes (pick one direction):
- Warm editorial: cream #FAF8F5 + charcoal #1A1814 + terracotta #C2410C
- Indie SaaS: off-white #F7F6F3 + near-black #0F0F0F + forest #166534
- Restaurant: stone #F5F0EB + espresso #2C1810 + burgundy #7F1D1D
- Creative: black #0A0A0A + white + single neon accent (#CCFF00, #FF4D4D)
- Professional: white + navy #1E3A5F + amber CTA #D97706

FORBIDDEN: purple-indigo gradients, cyan-on-navy Web3, pink-purple startup gradients.
</color>

<spacing_and_layout>
- Section padding: py-20 md:py-28 lg:py-32
- Container: max-w-6xl mx-auto px-5 sm:px-6 lg:px-8
- Prose blocks: max-w-xl to max-w-2xl
- Hero: prefer 55/45 or 50/50 split — NOT always centered stack
- Bento grids: grid-cols-12 with mixed col-span-7 + col-span-5, or col-span-8 + col-span-4
- Full-bleed bands: break out of container with w-full bg-[var(--surface)] for contrast sections
- Cards: rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8
- Gap: gap-6 md:gap-8 in grids; gap-12 md:gap-16 between major blocks
</spacing_and_layout>

<html_head_template>
Every static site index.html head MUST include this structure (customize fonts/colors):

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DISPLAY:wght@500;600;700&family=BODY:wght@400;500;600&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          display: ['DISPLAY_NAME', 'Georgia', 'serif'],
          sans: ['BODY_NAME', 'system-ui', 'sans-serif'],
        },
        colors: {
          brand: { DEFAULT: '#ACCENT', dark: '#ACCENT_DARK', light: '#ACCENT_LIGHT' },
        },
      },
    },
  };
</script>
<style>
  :root { /* CSS variables here */ }
  ${DESIGN_MOTION_SNIPPET}
</style>
</html_head_template>
</visual_system>`;
