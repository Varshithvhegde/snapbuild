#!/usr/bin/env bash
# Create Cloudflare wildcard DNS for Snapbuild user subdomains (*.site.sharepad.in)
# Requires: CLOUDFLARE_API_TOKEN with Zone.DNS Edit on sharepad.in
# Usage: CLOUDFLARE_API_TOKEN=xxx ./scripts/setup-wildcard-dns.sh

set -euo pipefail

ZONE_ID="${CLOUDFLARE_ZONE_ID:-49cb030b40c51472d26048da7573d494}"
ZONE_NAME="${CLOUDFLARE_ZONE_NAME:-sharepad.in}"
RECORD_NAME="*.site"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN."
  echo ""
  echo "Create at: https://dash.cloudflare.com/profile/api-tokens"
  echo "  Use template: Edit zone DNS"
  echo "  Zone Resources: Include → Specific zone → ${ZONE_NAME}"
  echo "  Permissions: Zone → DNS → Edit"
  echo ""
  echo "Or add manually in Cloudflare DNS:"
  echo "  Type: AAAA | Name: *.site | Content: 100:: | Proxy: ON"
  exit 1
fi

verify_token() {
  local url="$1"
  curl -s "$url" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json"
}

echo "→ Verifying API token..."
user_verify=$(verify_token "https://api.cloudflare.com/client/v4/user/tokens/verify")
if echo "$user_verify" | grep -q '"status":"active"'; then
  echo "✓ User API token is active"
elif echo "$user_verify" | grep -q '"success":true'; then
  echo "✓ API token verified"
else
  account_verify=$(verify_token "https://api.cloudflare.com/client/v4/accounts/94dbdc490318b8adc5b08f1f807b01da/tokens/verify")
  if echo "$account_verify" | grep -q '"success":true'; then
    echo "✓ Account API token verified"
  else
    echo "✗ Token verification failed (authentication error)."
    echo ""
    echo "Create a NEW token at: https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    echo "Recommended: click 'Use template' → 'Edit zone DNS', then set:"
    echo "  Permissions:  Zone → DNS → Edit"
    echo "  Zone Resources: Include → Specific zone → ${ZONE_NAME}"
    echo ""
    echo "Do NOT use Wrangler login token or Global API Key here."
    echo "Copy the full token once (starts with cfut_ or legacy 40-char string)."
    echo ""
    echo "Test manually:"
    echo "  curl -s https://api.cloudflare.com/client/v4/user/tokens/verify \\"
    echo "    -H \"Authorization: Bearer YOUR_TOKEN\""
    exit 1
  fi
fi

existing=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=AAAA&name=*.site.${ZONE_NAME}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json")

if echo "$existing" | grep -q '"success":true' && echo "$existing" | grep -q '"result":\[{' ; then
  echo "✓ Wildcard DNS *.site.${ZONE_NAME} already exists"
  exit 0
fi

if echo "$existing" | grep -q '"code":10000'; then
  echo "✗ Token cannot read DNS for ${ZONE_NAME}."
  echo "  Add permission: Zone → DNS → Edit"
  echo "  Scope zone to: ${ZONE_NAME} (zone id ${ZONE_ID})"
  exit 1
fi

echo "→ Creating wildcard DNS *.site.${ZONE_NAME} ..."
response=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type:application/json" \
  --data "{\"type\":\"AAAA\",\"name\":\"${RECORD_NAME}\",\"content\":\"100::\",\"proxied\":true,\"ttl\":1,\"comment\":\"Snapbuild user site subdomains\"}")

if echo "$response" | grep -q '"success":true'; then
  echo "✓ Created wildcard DNS: *.site.${ZONE_NAME} → 100:: (proxied)"
  echo "  Deploy URLs: https://{slug}.site.${ZONE_NAME}"
else
  echo "✗ Failed to create DNS record:"
  echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  exit 1
fi
