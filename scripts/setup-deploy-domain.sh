#!/usr/bin/env bash
# Configure Snapbuild deploy domain (site.sharepad.in) in Convex + Cloudflare.
# Usage: SNAPBUILD_DOMAIN=site.sharepad.in ./scripts/setup-deploy-domain.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOMAIN="${SNAPBUILD_DOMAIN:-site.sharepad.in}"
ZONE_NAME="${CLOUDFLARE_ZONE_NAME:-sharepad.in}"

echo "╔══════════════════════════════════════════╗"
echo "║   Snapbuild — Deploy Domain Setup        ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Deploy URLs: https://{slug}.${DOMAIN}"
echo ""

echo "→ Setting Convex SNAPBUILD_DOMAIN=${DOMAIN}..."
npx convex env set SNAPBUILD_DOMAIN "$DOMAIN"

echo "→ Deploying Cloudflare Worker (snapbuild-router)..."
cd worker
npx wrangler deploy
cd "$ROOT"

echo ""
echo "→ Wildcard DNS for user subdomains..."
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  ./scripts/setup-wildcard-dns.sh
else
  echo "  Skipped (set CLOUDFLARE_API_TOKEN to create automatically)"
  echo ""
  echo "  REQUIRED — add in Cloudflare → ${ZONE_NAME} → DNS:"
  echo "    Type: AAAA | Name: *.site | Content: 100:: | Proxy: ON (orange cloud)"
  echo ""
  echo "  Dashboard: https://dash.cloudflare.com → ${ZONE_NAME} → DNS → Records"
fi

echo ""
echo "✓ Worker deployed"
echo ""
echo "Verify after wildcard DNS is active:"
echo "  curl -I https://${DOMAIN}"
echo "  curl -I https://demo.${DOMAIN}  (after deploying slug 'demo')"
