# Snapbuild

**AI-powered mobile website builder** — build beautiful sites from your phone, edit visually or via chat, deploy instantly, share with a link.

Built on [Open Builder](https://github.com/Amery2010/open-builder) + [Convex](https://convex.dev) + Cloudflare R2.

## Features

| Feature | Description |
|---------|-------------|
| AI Chat → Website | Describe what you want, AI generates code |
| Visual Editor | Tap elements with `data-editable` to edit text/images |
| Templates | 8 starter templates (portfolio, SaaS, link-in-bio, etc.) |
| Image Library | Upload photos via Convex storage, use in AI prompts |
| One-Click Deploy | Publish to R2 → `{slug}.yourdomain.com` |
| Auth | Email/password via Convex Auth |
| Mobile-First | Responsive UI + Sandpack preview on mobile |
| Site History | Deployments + snapshots in Convex |

## Architecture

```
Mobile/Web App (React + Open Builder)
        ↓ Convex client
Convex Backend
  ├── Auth (email/password)
  ├── Sites, Deployments, Templates, Images
  └── R2 upload action (S3-compatible)
        ↓
Cloudflare R2 (static sites at sites/{slug}/)
        ↓
Cloudflare Worker (*.yourdomain.com → R2)
```

## Quick Start

### Prerequisites

- Node.js 20+
- [Convex account](https://convex.dev) (free tier)
- Cloudflare account (for R2 + subdomain routing)
- Your domain (for `*.yourdomain.com`)

### 1. Install

```bash
cd snapbuild
npm install
```

### 2. Start Convex

```bash
npx convex dev
```

This creates your deployment and generates `convex/_generated/`. Copy the URL to `apps/web/.env.local`:

```
VITE_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud
```

### 3. Seed templates

In another terminal (while Convex dev is running):

```bash
npm run seed
```

### 4. Configure R2 (for deploy)

In the [Convex dashboard](https://dashboard.convex.dev) → Settings → Environment Variables:

| Variable | Example |
|----------|---------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_SITES_BUCKET` | `snapbuild-sites` |
| `SNAPBUILD_DOMAIN` | `sites.yourdomain.com` |

Create the R2 bucket:

```bash
wrangler r2 bucket create snapbuild-sites
```

### 5. Run the app

```bash
npm run dev:web
```

Open http://localhost:5173

### 6. Deploy subdomain router

```bash
# Edit worker/wrangler.toml — set DOMAIN and bucket name
cd worker && wrangler deploy
```

DNS: add wildcard `*.sites.yourdomain.com` → Worker route.

## Project Structure

```
snapbuild/
├── apps/web/              # React frontend (Open Builder fork)
│   └── src/components/platform/  # Auth, Deploy, Templates, Images, Visual Edit
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Convex Auth
│   ├── sites.ts           # Site CRUD
│   ├── deployments.ts     # Deploy action
│   ├── images.ts          # Image uploads (Convex storage)
│   ├── templates.ts       # Template gallery
│   ├── r2.ts              # R2 upload (Node action)
│   └── seedData.ts        # 8 starter templates
└── worker/                # Cloudflare Worker for subdomain routing
```

## Cost (small scale)

| Service | Cost |
|---------|------|
| Convex | Free tier (generous) |
| Cloudflare R2 | Free tier (10GB) |
| Cloudflare Workers | Free tier |
| AI API | User's own key (BYOK) |
| Domain | ~$10-15/year |

## Deploy flow

1. User builds site (template or AI chat)
2. Optional: visual edit or upload images
3. Click **Deploy**
4. Convex action uploads files to `R2:sites/{slug}/`
5. Live at `https://{slug}.sites.yourdomain.com`

## License

MIT
