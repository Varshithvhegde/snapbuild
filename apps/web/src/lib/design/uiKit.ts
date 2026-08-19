/**
 * shadcn/ui-inspired Tailwind component kit for static HTML sites.
 * Agent MUST copy these exact patterns — do not invent one-off class strings.
 */

export const UI_KIT = `<ui_kit priority="critical" stack="tailwind_cdn + shadcn_tokens">
MANDATORY: All UI MUST use Tailwind CSS + shadcn/ui design tokens and the component recipes below.
Do NOT invent random classes. Do NOT use custom CSS for layout/components — Tailwind only.
Do NOT use DaisyUI, Bootstrap, or other CSS frameworks.

WHY: Pre-tested shadcn patterns = consistent spacing, accessible focus rings, fewer visual bugs.

<setup required="every_static_site">
1. Tailwind CDN in head
2. shadcn HSL CSS variables on :root (customize --primary hue for brand accent)
3. tailwind.config extend with shadcn color + radius mappings (see below)
4. Optional: Lucide icons via unpkg script OR inline SVG (stroke-width 2)

SHADCN THEME CSS (paste in style block — change --primary for brand color):
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
}
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}

TAILWIND CONFIG (after cdn script — maps shadcn tokens):
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['YOUR_BODY_FONT', 'system-ui', 'sans-serif'] },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};

To brand a site: ONLY change --primary and --primary-foreground HSL values. Keep everything else.
Example forest green primary: --primary: 152 69% 22%; --primary-foreground: 0 0% 100%;
Example blue primary: --primary: 221 83% 53%; --primary-foreground: 0 0% 100%;

CRITICAL: Use bg-primary, text-primary, border-primary, hover:bg-primary/90 in HTML — NEVER hardcode bg-emerald-600, bg-green-500, bg-blue-600, or random hex in class attributes. Theme changes ONLY work when semantic tokens are used.
</setup>

<components use="copy_exactly">

BUTTON PRIMARY (default):
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
  Button text
</button>

BUTTON SECONDARY (outline):
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
  Secondary
</button>

BUTTON GHOST (nav links):
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
  Link
</button>

BUTTON LG (hero CTA):
<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8">
  Get started
</button>

CARD:
<div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
  <h3 class="text-2xl font-semibold leading-none tracking-tight">Title</h3>
  <p class="text-sm text-muted-foreground mt-2">Description text here.</p>
</div>

BADGE:
<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground">
  Badge
</span>

INPUT:
<input class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Email" />

NAVBAR (sticky):
<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
    <a href="#" class="font-bold text-lg">Logo</a>
    <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
      <a href="#features" class="hover:text-foreground transition-colors">Features</a>
    </nav>
    <button class="...BUTTON PRIMARY classes...">CTA</button>
  </div>
</header>

SECTION WRAPPER:
<section class="py-20 md:py-28">
  <div class="container mx-auto max-w-6xl px-4">
    <!-- content -->
  </div>
</section>

FEATURE GRID (3 col):
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  <!-- CARD components -->
</div>

SEPARATOR:
<div class="shrink-0 bg-border h-[1px] w-full"></div>

</components>

<react_projects optional="true">
If building React/Vite (NOT default for landing pages):
- init_project template: vite-react-ts
- Use Tailwind + shadcn patterns: install clsx tailwind-merge class-variance-authority via manage_dependencies
- Copy shadcn Button/Card/Badge component code into src/components/ui/
- Use lucide-react for icons (add to package.json)
- Still use shadcn HSL tokens in src/index.css
For landing pages: prefer static HTML + ui_kit above — deploys reliably.
</react_projects>

<rules>
- Every button MUST use button recipe above (variant: primary | secondary | ghost | lg)
- Every card/feature block MUST use card recipe
- Every section MUST use section wrapper + container
- Use text-muted-foreground for secondary text, NOT random gray-* unless dark mode
- Use bg-background, text-foreground, border-border — NOT raw bg-white text-black
- Focus rings are built-in — do not remove focus-visible: classes
- Min touch target h-10 (40px) or h-11 for hero CTAs
</rules>
</ui_kit>`;

/** Short starter HTML head snippet reference for agents. */
export const SHADCN_HEAD_CHECKLIST = [
  "Tailwind CDN script",
  "shadcn :root HSL variables in style",
  "tailwind.config with hsl(var(--*)) color mapping",
  "fontFamily in config",
  "motion CSS (optional)",
];
