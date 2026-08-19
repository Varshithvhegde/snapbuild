export const STARTER_TEMPLATES = [
  {
    name: "Minimal Portfolio",
    description: "Clean portfolio with project grid and about section.",
    framework: "html" as const,
    category: "portfolio" as const,
    thumbnailUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop",
    tags: ["minimal", "portfolio", "dark"],
    featured: true,
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-50 min-h-screen">
  <header class="px-6 py-8 max-w-5xl mx-auto flex justify-between items-center">
    <h1 class="text-xl font-bold" data-editable="name">Jane Doe</h1>
    <nav class="flex gap-6 text-sm text-zinc-400">
      <a href="#work">Work</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
  <main class="px-6 max-w-5xl mx-auto">
    <section class="py-20">
      <h2 class="text-5xl font-bold leading-tight" data-editable="headline">I design & build<br/>digital experiences</h2>
    </section>
    <section id="work" class="py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="aspect-video bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500" data-editable="project">Project 1</div>
      <div class="aspect-video bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">Project 2</div>
    </section>
    <section id="about" class="py-20">
      <p class="text-xl text-zinc-400 max-w-2xl" data-editable="bio">Designer and developer creating beautiful digital products.</p>
    </section>
  </main>
</body>
</html>`,
      },
    ],
  },
  {
    name: "SaaS Landing",
    description: "High-converting SaaS landing page with hero and pricing.",
    framework: "html" as const,
    category: "saas" as const,
    thumbnailUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
    tags: ["saas", "startup", "landing"],
    featured: true,
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ProductX</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900">
  <header class="px-6 py-4 max-w-6xl mx-auto flex justify-between items-center">
    <div class="text-xl font-bold text-indigo-600" data-editable="brand">ProductX</div>
    <a href="#pricing" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Get Started</a>
  </header>
  <main class="px-6 max-w-6xl mx-auto text-center py-24">
    <h1 class="text-5xl font-bold mb-6" data-editable="headline">Ship faster with AI</h1>
    <p class="text-xl text-gray-500 mb-10 max-w-2xl mx-auto" data-editable="subhead">Build, deploy, and share beautiful websites from your phone.</p>
    <button class="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-medium">Start free</button>
  </main>
</body>
</html>`,
      },
    ],
  },
  {
    name: "Link in Bio",
    description: "Mobile-first link page for creators and influencers.",
    framework: "html" as const,
    category: "link-in-bio" as const,
    thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e939e966?w=400&h=300&fit=crop",
    tags: ["links", "creator", "mobile"],
    featured: true,
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Links</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-b from-violet-600 to-indigo-800 min-h-screen text-white">
  <main class="max-w-md mx-auto px-6 py-16 text-center">
    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" alt="Avatar" class="w-24 h-24 rounded-full mx-auto mb-4 object-cover" data-editable="avatar" />
    <h1 class="text-2xl font-bold mb-1" data-editable="name">@creator</h1>
    <p class="text-white/80 mb-8" data-editable="bio">Digital creator & designer</p>
    <div class="space-y-3">
      <a href="#" class="block bg-white/20 backdrop-blur rounded-xl py-4 font-medium hover:bg-white/30 transition">YouTube</a>
      <a href="#" class="block bg-white/20 backdrop-blur rounded-xl py-4 font-medium hover:bg-white/30 transition">Shop</a>
      <a href="#" class="block bg-white/20 backdrop-blur rounded-xl py-4 font-medium hover:bg-white/30 transition">Newsletter</a>
    </div>
  </main>
</body>
</html>`,
      },
    ],
  },
  {
    name: "Restaurant Menu",
    description: "Elegant menu page for restaurants and cafes.",
    framework: "html" as const,
    category: "personal" as const,
    thumbnailUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    tags: ["restaurant", "menu", "food"],
    featured: false,
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Menu</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-amber-50 text-stone-900">
  <main class="max-w-lg mx-auto px-6 py-12">
    <h1 class="text-4xl font-serif text-center mb-2" data-editable="name">The Golden Spoon</h1>
    <p class="text-center text-stone-500 mb-12" data-editable="tagline">Farm to table since 2010</p>
    <section class="space-y-8">
      <div><h2 class="text-lg font-semibold border-b pb-2 mb-4">Starters</h2>
      <div class="flex justify-between"><span data-editable="item">Soup of the day</span><span>$8</span></div></div>
      <div><h2 class="text-lg font-semibold border-b pb-2 mb-4">Mains</h2>
      <div class="flex justify-between"><span>Grilled salmon</span><span>$24</span></div></div>
    </section>
  </main>
</body>
</html>`,
      },
    ],
  },
  {
    name: "Agency Bold",
    description: "Bold agency landing with services and contact CTA.",
    framework: "html" as const,
    category: "agency" as const,
    thumbnailUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    tags: ["agency", "bold", "services"],
    featured: true,
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Studio</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white">
  <main class="max-w-6xl mx-auto px-6 py-20">
    <h1 class="text-7xl font-black tracking-tighter mb-8" data-editable="headline">WE BUILD<br/>BRANDS</h1>
    <p class="text-xl text-gray-400 max-w-xl mb-16" data-editable="bio">Strategy, design, and development for ambitious companies.</p>
    <a href="#contact" class="inline-block border-2 border-white px-8 py-4 text-lg hover:bg-white hover:text-black transition">Work with us</a>
  </main>
</body>
</html>`,
      },
    ],
  },
  {
    name: "Personal Blog",
    description: "Simple blog homepage with featured posts.",
    framework: "html" as const,
    category: "blog" as const,
    thumbnailUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
    tags: ["blog", "writing", "minimal"],
    featured: false,
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-stone-50 text-stone-900">
  <main class="max-w-2xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-bold mb-2" data-editable="name">My Blog</h1>
    <p class="text-stone-500 mb-12" data-editable="bio">Thoughts on design, code, and life.</p>
    <article class="mb-10 pb-10 border-b"><h2 class="text-xl font-semibold mb-2">Getting started with web design</h2><p class="text-stone-600">A beginner's guide to building your first website...</p></article>
    <article><h2 class="text-xl font-semibold mb-2">Why mobile-first matters</h2><p class="text-stone-600">Most of the web is now consumed on phones...</p></article>
  </main>
</body>
</html>`,
      },
    ],
  },
  {
    name: "Event Landing",
    description: "Event or conference landing page with date and RSVP.",
    framework: "html" as const,
    category: "landing" as const,
    thumbnailUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
    tags: ["event", "conference", "rsvp"],
    featured: false,
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Event</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen flex items-center">
  <main class="max-w-3xl mx-auto px-6 py-20 text-center">
    <p class="text-emerald-400 font-medium mb-4" data-editable="date">March 15, 2026 · San Francisco</p>
    <h1 class="text-5xl font-bold mb-6" data-editable="headline">Design Summit 2026</h1>
    <p class="text-xl text-slate-400 mb-10" data-editable="bio">Join 500+ designers for a day of talks, workshops, and networking.</p>
    <button class="bg-emerald-500 text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg">RSVP Now</button>
  </main>
</body>
</html>`,
      },
    ],
  },
  {
    name: "Shop Showcase",
    description: "Simple product showcase for small ecommerce stores.",
    framework: "html" as const,
    category: "ecommerce" as const,
    thumbnailUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    tags: ["shop", "products", "store"],
    featured: false,
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shop</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900">
  <header class="px-6 py-6 max-w-6xl mx-auto"><h1 class="text-2xl font-bold" data-editable="brand">Artisan Co.</h1></header>
  <main class="px-6 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-6 pb-20">
    <div class="rounded-xl overflow-hidden border"><div class="aspect-square bg-gray-100"></div><div class="p-4"><p class="font-medium">Ceramic Vase</p><p class="text-gray-500">$45</p></div></div>
    <div class="rounded-xl overflow-hidden border"><div class="aspect-square bg-gray-100"></div><div class="p-4"><p class="font-medium">Linen Throw</p><p class="text-gray-500">$89</p></div></div>
    <div class="rounded-xl overflow-hidden border"><div class="aspect-square bg-gray-100"></div><div class="p-4"><p class="font-medium">Wooden Bowl</p><p class="text-gray-500">$32</p></div></div>
  </main>
</body>
</html>`,
      },
    ],
  },
];
