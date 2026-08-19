#!/usr/bin/env bash
# Sync R2 credentials from SharePad into Convex env for Snapbuild.
# Usage: ./scripts/setup-r2-env.sh [/path/to/sharepad/.env.local]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SHAREPAD_ENV="${1:-$ROOT/../sharepad/.env.local}"

if [[ ! -f "$SHAREPAD_ENV" ]]; then
  echo "SharePad env not found at: $SHAREPAD_ENV"
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" "$SHAREPAD_ENV" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

R2_ACCOUNT_ID="$(read_env R2_ACCOUNT_ID)"
R2_ACCESS_KEY_ID="$(read_env R2_ACCESS_KEY_ID)"
R2_SECRET_ACCESS_KEY="$(read_env R2_SECRET_ACCESS_KEY)"
R2_BUCKET="$(read_env R2_BUCKET)"
R2_PUBLIC_BASE_URL="$(read_env R2_PUBLIC_BASE_URL)"

for var in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET R2_PUBLIC_BASE_URL; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing $var in $SHAREPAD_ENV"
    exit 1
  fi
done

SNAPBUILD_DOMAIN="${SNAPBUILD_DOMAIN:-site.sharepad.in}"

echo "→ Setting Convex R2 env vars from SharePad..."

npx convex env set R2_ACCOUNT_ID "$R2_ACCOUNT_ID"
npx convex env set R2_ACCESS_KEY_ID "$R2_ACCESS_KEY_ID"
npx convex env set R2_SECRET_ACCESS_KEY "$R2_SECRET_ACCESS_KEY"
npx convex env set R2_BUCKET "$R2_BUCKET"
npx convex env set R2_SITES_BUCKET "$R2_BUCKET"
npx convex env set R2_PUBLIC_BASE_URL "$R2_PUBLIC_BASE_URL"
npx convex env set SNAPBUILD_DOMAIN "$SNAPBUILD_DOMAIN"

echo "✓ R2 env configured in Convex"
echo "  Bucket: $R2_BUCKET"
echo "  Public URL base: $R2_PUBLIC_BASE_URL"
echo "  Deploy domain: $SNAPBUILD_DOMAIN"
echo ""
echo "Sites deploy to: sites/{slug}/ in bucket '$R2_BUCKET'"
echo "User images go to: snapbuild-images/{userId}/ in bucket '$R2_BUCKET'"
echo ""
echo "To serve live sites, deploy worker/ with DOMAIN=$SNAPBUILD_DOMAIN and bucket_name=$R2_BUCKET"
