/** Detailed specs for every page section. */
export const SECTIONS_CATALOG = `<sections_catalog>
Build each section completely before moving on. Every section needs real copy + real images.

<section id="nav">
- USE ui_kit NAVBAR recipe exactly (sticky, backdrop-blur, bg-background/95, border-b)
</section>

<section id="hero" pick="one">
A) Split: lg:grid-cols-2 gap-12 pt-24 min-h-[85vh] — copy left (eyebrow+h1+subhead+CTAs), image_search photo right
B) Typographic: max-w-4xl pt-32 — giant h1 with one accent word, subhead, CTA row
C) Full-bleed: min-h-[90vh] relative, image_search bg + bg-black/50, white text bottom-aligned
</section>

<section id="social_proof" pick="one">
Logo strip (4-6 names) | Stats row (3 metrics) | Testimonial (quote + avatar from image_search + name/role)
</section>

<section id="features">
- h2 + intro in section wrapper
- ui_kit FEATURE GRID with ui_kit CARD in each cell, class="reveal"
</section>

<section id="deep" by="type">
SaaS→pricing 3 tiers | Restaurant→menu 6 items+prices | Portfolio→4 project cards | DTC→3 products | Services→FAQ or 3-step process
</section>

<section id="cta_band">
full-width py-20 bg-primary text-primary-foreground — h2 + ui_kit BUTTON LG (secondary variant for contrast if needed)
</section>

<section id="footer">
py-12 border-t border-border bg-background — logo+tagline | max 2 link columns | copyright
</section>

PRIMARY BUTTON: use ui_kit BUTTON PRIMARY or BUTTON LG recipe exactly

CARD / FEATURES: use ui_kit CARD inside FEATURE GRID

NAV: use ui_kit NAVBAR sticky pattern

IMAGES: image_search for every visual slot — never gray placeholder boxes
</sections_catalog>`;
