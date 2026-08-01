#!/usr/bin/env bash

# Production edge smoke checks. This intentionally uses only curl and the
# public contract of the site; it never reads or emits secrets or user data.

set -euo pipefail

BASE_URL="${EDGE_BASE_URL:-https://blakeoxford.com}"
TIMEOUT_SECONDS="${EDGE_TIMEOUT_SECONDS:-20}"
RETRY_ATTEMPTS="${EDGE_RETRY_ATTEMPTS:-3}"
USER_AGENT="${EDGE_USER_AGENT:-blakeoxford-edge-monitor/1.0 (+https://blakeoxford.com/)}"

if [[ ! "$BASE_URL" =~ ^https://[^/]+$ ]]; then
  echo "EDGE_BASE_URL must be an HTTPS origin without a trailing path" >&2
  exit 2
fi

request_status() {
  local label="$1"
  local expected="$2"
  shift 2

  local actual
  actual="$(curl --silent --show-error --location --max-time "$TIMEOUT_SECONDS" \
    --retry "$RETRY_ATTEMPTS" --retry-all-errors --retry-delay 2 \
    --user-agent "$USER_AGENT" --output /dev/null --write-out '%{http_code}' "$@")"

  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL $label: expected HTTP $expected, received HTTP $actual" >&2
    echo "Response metadata:" >&2
    curl --silent --show-error --location --max-time "$TIMEOUT_SECONDS" \
      --retry 1 --retry-delay 1 --user-agent "$USER_AGENT" \
      --dump-header - --output /dev/null "$@" \
      | awk -F': ' 'tolower($1) ~ /^(cf-ray|cf-cache-status|content-type|location|retry-after|server|x-request-id)$/ { print }' >&2 || true
    return 1
  fi

  echo "PASS $label: HTTP $actual"
}

request_headers() {
  curl --silent --show-error --location --max-time "$TIMEOUT_SECONDS" \
    --retry "$RETRY_ATTEMPTS" --retry-all-errors --retry-delay 2 \
    --user-agent "$USER_AGENT" --dump-header - --output /dev/null "$BASE_URL/"
}

request_status "homepage" 200 "$BASE_URL/"
request_status "health" 204 "$BASE_URL/_healthz"
request_status "debug route blocked" 404 "$BASE_URL/debug/edge-sentry-test"
request_status "untrusted API preflight blocked" 403 \
  --request OPTIONS \
  --header 'Origin: https://edge-monitor.invalid' \
  --header 'Access-Control-Request-Method: POST' \
  "$BASE_URL/api/ai-feedback"
request_status "first-party API preflight allowed" 204 \
  --request OPTIONS \
  --header "Origin: $BASE_URL" \
  --header 'Access-Control-Request-Method: POST' \
  "$BASE_URL/api/ai-feedback"

headers="$(request_headers)"
for header in \
  'strict-transport-security:' \
  'content-security-policy:' \
  'x-content-type-options:' \
  'x-frame-options:' \
  'referrer-policy:' \
  'permissions-policy:'; do
  if ! grep -qi "^$header" <<<"$headers"; then
    echo "FAIL homepage security header missing: $header" >&2
    exit 1
  fi
done

echo "PASS homepage security headers present"
