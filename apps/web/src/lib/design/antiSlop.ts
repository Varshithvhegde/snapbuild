/** Patterns that make sites look AI-generated — hard ban list. */
export const ANTI_AI_SLOP = `<anti_ai_slop priority="critical">
These patterns are BANNED. If you catch yourself using any, rewrite before finishing.

VISUAL BANS:
- Purple/indigo/violet gradients (#6366F1, #8B5CF6, #7C3AED) on white or dark
- Inter as the only font + blue #3B82F6 primary button (the default AI combo)
- Everything centered in one max-w-2xl column with no layout variety
- Identical 3-column icon+title+paragraph cards repeated 4+ times
- Glassmorphism cards floating on gradient backgrounds
- Neon cyan/purple accents on dark mode without explicit user request
- Gray placeholder boxes, "Image here", "Project 1", unsplash-style gray divs
- Badge pills: "New", "AI-Powered", "🚀", "Beta", "Launch faster"
- Stock photo of diverse team high-fiving in generic office
- Heavy drop shadows on every element, gradient text on headings
- Hamburger menu on desktop when 3-4 links would fit inline

COPY BANS (never write):
- "Welcome to [Product Name]" as the hero headline
- "Unlock the power of" / "Revolutionize" / "Seamlessly" / "Leverage" / "Cutting-edge"
- "In today's fast-paced digital world" / "We're passionate about"
- "Our mission is to empower" / "Take your X to the next level"
- "Easy to use" / "Fast & reliable" / "Secure" as feature titles with no specifics
- "Get Started" / "Learn More" as the only CTA with no outcome verb
- Lorem ipsum / "Your text here" / "Company Name" / "Product Name" placeholders
- Fake stats: "10,000+ happy customers" when no data was given

STRUCTURE BANS:
- Footer with 4 identical columns of filler links (Product, Company, Resources, Legal)
- Pricing at exactly $9 / $29 / $99 unless user specified
- Same section template copy-pasted with only the icon changed
- Missing mobile nav when desktop nav has 4+ links

WRITE LIKE A HUMAN INSTEAD:
- Headline = specific outcome: "Run standups without another Zoom call"
- CTA = action + outcome: "Book a 15-min demo" / "See tonight's menu" / "Reserve a table"
- Features = concrete benefit: "Slack threads auto-summarized every morning" not "Easy integrations"
- If no real stats, omit — use qualitative proof ("Trusted by remote teams at Stripe, Notion…" only if plausible for niche)
</anti_ai_slop>`;
