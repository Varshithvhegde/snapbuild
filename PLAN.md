# Snapbuild — Full Product Plan

## Vision

Everyone on mobile can build beautiful websites, edit them visually or via AI chat, deploy with one tap, and share a live link — `{username}.sites.yourdomain.com`.

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + Vite + Open Builder core | AI code gen + Sandpack preview already built |
| Backend | **Convex** | Real-time DB, auth, file storage, server actions — no separate API server |
| Site hosting | **Cloudflare R2** | Cheap static hosting, no egress fees |
| Subdomains | **Cloudflare Worker** | `*.sites.yourdomain.com` → R2 |
| AI | User's own API key (BYOK) | No AI bill for you as platform owner |
| Mobile | Mobile-first PWA (Tauri later) | Ship web first, wrap for app stores |

## Feature Matrix

| # | Feature | Status | Implementation |
|---|---------|--------|----------------|
| 1 | Email/password auth | ✅ Built | Convex Auth (`@convex-dev/auth`) |
| 2 | AI chat → website | ✅ Built | Open Builder generator + Sandpack |
| 3 | Template gallery | ✅ Built | 8 HTML templates in Convex, seed script |
| 4 | Image upload | ✅ Built | Convex file storage + image library UI |
| 5 | Use images in site | ✅ Built | Tap image → prefills AI chat prompt |
| 6 | Visual edit | ✅ Built | Tap `data-editable` elements in HTML preview |
| 7 | One-click deploy | ✅ Built | Convex action → R2 upload |
| 8 | Auto subdomain | ✅ Built | `{slug}.sites.yourdomain.com` via Worker |
| 9 | Share live link | ✅ Built | Deploy returns URL, copy/share |
| 10 | Site list | ✅ Built | Convex query, shown in header |
| 11 | Deploy history | ✅ Built | `deployments` table + snapshots |
| 12 | Draft auto-save | ✅ Built | `sites.saveDraft` mutation |
| 13 | Custom domain | 🔜 Phase 2 | `sites.customDomain` field ready |
| 14 | Tauri Android/iOS | 🔜 Phase 2 | Wrap existing web app |
| 15 | Billing / Pro plan | 🔜 Phase 3 | Stripe + Convex webhooks |

## Data Model (Convex)

```
users          — auth + plan (free/pro)
sites          — name, slug, files[], status, deployedUrl
deployments    — build history per site
siteSnapshots  — version history
userImages     — Convex storage refs + metadata
templates      — starter designs (public read)
```

## Deploy Pipeline

```
User clicks Deploy
    ↓
deployments.deploy (Convex action)
    ↓
Export static HTML (from index.html or Sandpack files)
    ↓
r2.uploadSiteToR2 (Node action, AWS Sig V4)
    ↓
R2: sites/{slug}/index.html + assets
    ↓
Worker: alice.sites.yourdomain.com → R2 lookup
    ↓
Live URL returned to user
```

## DNS Setup (one time)

```
Type    Name              Value
CNAME   sites             your-app.pages.dev (marketing site)
Worker  *.sites           snapbuild-router (serves user sites)
```

Set `SNAPBUILD_DOMAIN=sites.yourdomain.com` in Convex env vars.

## Cost at 1K users

| Item | Monthly cost |
|------|-------------|
| Convex | $0 (free tier) |
| R2 (10GB sites) | ~$0.15 |
| Workers | $0 (free tier) |
| Convex storage (images) | $0 (free tier) |
| Domain | ~$1/mo amortized |
| AI | $0 (users BYOK) |
| **Total** | **~$1-5/mo** |

## Phase 2 Roadmap

- [ ] Custom domains per site (Cloudflare for SaaS)
- [ ] Tauri mobile apps (Android + iOS)
- [ ] Drag-and-drop section editor (GrapesJS)
- [ ] Analytics (page views via Worker)
- [ ] Team collaboration
- [ ] Stripe Pro tier (more sites, remove branding)

## Phase 3 Roadmap

- [ ] Template marketplace (user-submitted)
- [ ] AI site generation from photo (upload mockup → site)
- [ ] E-commerce (Stripe checkout embed)
- [ ] SEO meta editor
- [ ] A/B testing

## Getting Started

See [README.md](./README.md) for setup instructions.

```bash
npm install
npx convex dev          # Terminal 1 — creates backend
npm run seed            # Seed templates
npm run dev:web         # Terminal 2 — frontend at :5173
```

Configure R2 env vars in Convex dashboard, deploy Worker for live subdomains.
