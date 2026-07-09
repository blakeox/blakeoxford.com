#!/usr/bin/env bash
# Configure GitHub Actions secrets for Cloudflare Workers deploy.
#
# Usage (recommended — create a dedicated API token in Cloudflare dashboard):
#   1. https://dash.cloudflare.com/profile/api-tokens
#   2. Use template "Edit Cloudflare Workers" scoped to account cc3bb24ae3c87cff38c2be85df3dab29
#   3. CLOUDFLARE_API_TOKEN='your-token' ./scripts/setup/github-cloudflare-deploy.sh
#
# Or bootstrap from local wrangler login (short-lived OAuth-derived token):
#   ./scripts/setup/github-cloudflare-deploy.sh --from-wrangler

set -euo pipefail

ACCOUNT_ID="cc3bb24ae3c87cff38c2be85df3dab29"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install: https://cli.github.com/"
  exit 1
fi

cd "$REPO_ROOT"

TOKEN="${CLOUDFLARE_API_TOKEN:-}"

if [[ "${1:-}" == "--from-wrangler" ]]; then
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm is required to read wrangler auth token"
    exit 1
  fi
  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required to parse wrangler auth token output"
    exit 1
  fi
  TOKEN="$(
    pnpm exec wrangler auth token --json 2>/dev/null \
      | python3 -c "import sys, json; raw = json.load(sys.stdin).get('token', ''); lines = [line.strip() for line in raw.splitlines() if line.strip()]; print(lines[-1] if lines else '')" \
      || true
  )"
  if [[ -z "$TOKEN" ]]; then
    echo "No wrangler auth token found. Run: pnpm exec wrangler login"
    exit 1
  fi
  echo "Using wrangler auth token (prefer a dedicated API token for long-lived CI)."
fi

if [[ -z "$TOKEN" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN or pass --from-wrangler"
  exit 1
fi

printf '%s' "$TOKEN" | gh secret set CLOUDFLARE_API_TOKEN
gh variable set CLOUDFLARE_ACCOUNT_ID --body "$ACCOUNT_ID"

echo "Configured GitHub repository:"
echo "  secret  CLOUDFLARE_API_TOKEN"
echo "  variable CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID"
echo ""
echo "Verify with a manual workflow run: gh workflow run deploy-worker.yml"
