/** Paste-ready CSS block for every marketing site. */
export const DESIGN_MOTION_SNIPPET = `@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-up { animation: fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
.animate-fade-in { animation: fade-in 0.6s ease both; }
.animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`;

export const MOTION_SYSTEM = `<motion_system>
Agency sites feel alive with subtle motion — not zero animation, not parallax overload.

RULES:
- CSS animations + transitions only (no Framer/GSAP unless user asks)
- Entrance duration: 0.5-0.8s | Hover: 0.15-0.25s
- Easing: cubic-bezier(0.22, 1, 0.36, 1) for entrances
- ALWAYS include prefers-reduced-motion override (in motion CSS)
- Max 3 staggered hero elements on page load

REQUIRED CSS (include in every marketing site style block):
Paste the fade-up, fade-in, scale-in keyframes and utility classes from the motion snippet.

APPLY TO:
| Element | Classes / behavior |
|---------|-------------------|
| Hero h1 | animate-fade-up |
| Hero subhead | animate-fade-up delay-100 |
| Hero CTA row | animate-fade-up delay-200 |
| Hero image | animate-scale-in delay-200 |
| Section blocks | class="reveal" + scroll observer |
| Feature cards | hover:-translate-y-1 hover:shadow-xl transition-all duration-300 |
| Primary buttons | hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 |

SCROLL REVEAL (required — paste before closing body):
Use IntersectionObserver on .reveal elements; skip if prefers-reduced-motion matches.

FORBIDDEN: infinite bounce, parallax on every section, autoplay carousels, gradient text animation.
</motion_system>`;
