/**
 * Snapbuild Design Skill — agency-grade, one-shot website building system.
 */
import { ONE_SHOT_BUILDER } from "./oneShotBuilder";
import { VISUAL_SYSTEM } from "./visualSystem";
import { MOTION_SYSTEM } from "./motion";
import { SECTIONS_CATALOG } from "./sectionsCatalog";
import { SITE_ARCHETYPES } from "./siteArchetypes";
import { COPY_SYSTEM } from "./copySystem";
import { ANTI_AI_SLOP } from "./antiSlop";
import { QUALITY_BAR } from "./qualityBar";
import { UI_KIT } from "./uiKit";
import { EDIT_PROTOCOL } from "./editProtocol";

export { DESIGN_MOTION_SNIPPET } from "./motion";

export const DESIGN_SYSTEM_PROMPT = `<design_system version="2">
You are a senior product designer AND front-end developer at a top digital agency (Pentagram × Stripe × Awwwards). You build COMPLETE, deployable websites in ONE SHOT that look hand-crafted — never like ChatGPT output.

${ONE_SHOT_BUILDER}

${VISUAL_SYSTEM}

${UI_KIT}

${MOTION_SYSTEM}

${SECTIONS_CATALOG}

${SITE_ARCHETYPES}

${COPY_SYSTEM}

${ANTI_AI_SLOP}

${QUALITY_BAR}

${EDIT_PROTOCOL}
</design_system>`;

export const DESIGN_STARTER_PROMPTS = {
  landing:
    "ONE-SHOT: Build a complete B2B SaaS landing page (indie_saas). Tailwind + shadcn ui_kit components only. All 7 sections. Set --primary to forest green HSL. image_search photos. ui_kit buttons/cards/nav. Deploy-ready index.html.",
  portfolio:
    "ONE-SHOT: Build a complete creative director portfolio (creative_portfolio archetype). Syne + Work Sans, black + lime #CCFF00 accent. All sections: nav, typographic hero, 4-project grid with image_search photos, about + portrait, contact CTA, footer. Staggered animations + scroll reveal. Awwwards-level — NOT generic AI layout. Complete in one pass.",
  localBusiness:
    "ONE-SHOT: Build a complete restaurant site for 'Ember & Oak' wood-fired Italian (local_restaurant archetype). Playfair + Lato, stone #F5F0EB, burgundy #7F1D1D. Full-bleed food hero (image_search), menu highlights with prices, chef story, reservation CTA, hours block, footer. Elegant motion. Zero placeholder copy. Deploy-ready.",
  animated:
    "ONE-SHOT: Build a complete DTC skincare brand site (dtc_lifestyle archetype). Fraunces + DM Sans, cream #FAF5F2, sage #4A6741. All sections with scroll-reveal, hover lift cards, button press scale. image_search for product/lifestyle photos. Full motion CSS + reduced-motion fallback. Complete index.html in one generation.",
  oneShot:
    "ONE-SHOT: Build a complete professional services site for branding agency 'Northline Studio' (professional_services archetype). All 7 sections, fonts, colors, image_search photos, motion CSS, scroll reveal, mobile nav. Entire deployable site in one pass — no placeholders, no AI slop.",
} as const;

export const TEMPLATE_CUSTOMIZE_PROMPT =
  "ONE-SHOT upgrade: Transform this template into a complete agency-quality site. Full design system (Google Fonts, CSS variables, one accent hex), asymmetric layout, image_search for all photos, motion CSS + scroll reveal, human niche-specific copy. Fill ALL sections — not just hero. Must NOT look AI-generated. Deploy-ready when done.";
