#!/usr/bin/env bash
# Snapbuild — Convex cloud setup
# Run from repo root: ./scripts/setup-convex.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_NAME="${1:-snapbuild}"

echo "╔══════════════════════════════════════════╗"
echo "║   Snapbuild — Convex Cloud Setup         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Login ─────────────────────────────────────────────────────────────
echo "→ Step 1/5: Login to Convex (browser will open)..."
if ! npx convex login status 2>/dev/null | grep -q "Logged in"; then
  npx convex login --device-name "snapbuild-$(hostname -s 2>/dev/null || echo dev)"
fi
echo "✓ Logged in"
echo ""

# ── Step 2: Create project (skip if already linked) ───────────────────────────
if [[ -f .env.local ]] && grep -q "^CONVEX_DEPLOYMENT=" .env.local && ! grep -q "anonymous:" .env.local; then
  echo "→ Step 2/5: Project already linked in .env.local — skipping create"
else
  echo "→ Step 2/5: Creating Convex project '$PROJECT_NAME'..."
  npx convex project create "$PROJECT_NAME" || true
  echo "→ Linking dev deployment..."
  npx convex dev --once --configure=new
fi
echo "✓ Project configured"
echo ""

# ── Step 3: Push functions ───────────────────────────────────────────────────
echo "→ Step 3/5: Pushing Convex functions..."
npx convex dev --once
echo "✓ Functions deployed"
echo ""

# ── Step 4: Seed templates ─────────────────────────────────────────────────────
echo "→ Step 4/5: Seeding templates..."
npx convex run seed:seedTemplates
echo "✓ Templates seeded"
echo ""

# ── Step 5: Write frontend env ─────────────────────────────────────────────────
CONVEX_URL="$(grep '^CONVEX_URL=' .env.local | cut -d= -f2-)"
if [[ -n "$CONVEX_URL" ]]; then
  mkdir -p apps/web
  cat > apps/web/.env.local <<EOF
VITE_CONVEX_URL=$CONVEX_URL
EOF
  echo "✓ Wrote apps/web/.env.local"
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Setup complete!                        ║"
echo "╠══════════════════════════════════════════╣"
echo "║  Convex URL: ${CONVEX_URL:-see .env.local}"
echo "║  Dashboard:  npx convex dashboard        ║"
echo "║  Start app:   npm run dev:web            ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Optional — set R2 deploy env vars in Convex dashboard:"
echo "  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
echo "  R2_SITES_BUCKET=snapbuild-sites"
echo "  SNAPBUILD_DOMAIN=site.sharepad.in"
