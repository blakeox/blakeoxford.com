#!/usr/bin/env bash

# Post-deployment SEO smoke checks. This validates the public response contract
# after a Worker release; it does not collect search queries or personal data.

set -euo pipefail

BASE_URL="${EDGE_BASE_URL:-https://blakeoxford.com}"
TIMEOUT_SECONDS="${EDGE_TIMEOUT_SECONDS:-20}"
EXPECTED_COMMIT="${EDGE_EXPECTED_COMMIT:-}"
USER_AGENT="${EDGE_USER_AGENT:-blakeoxford-seo-monitor/1.0 (+https://blakeoxford.com/)}"

if [[ ! "$BASE_URL" =~ ^https://[^/]+$ ]]; then
  echo "EDGE_BASE_URL must be an HTTPS origin without a trailing path" >&2
  exit 2
fi

curl_args=(--silent --show-error --max-time "$TIMEOUT_SECONDS" --user-agent "$USER_AGENT")

header_value() {
  local headers="$1"
  local name="$2"
  awk -v wanted="$name" 'tolower($1) == tolower(wanted) ":" { sub(/^[^:]*:[[:space:]]*/, ""); print; exit }' <<<"$headers" | tr -d '\r'
}

check_redirect() {
  local label="$1"
  local source="$2"
  local expected_location="$3"
  local headers status location

  headers="$(curl "${curl_args[@]}" --dump-header - --output /dev/null "$source")"
  status="$(awk 'NR == 1 { print $2 }' <<<"$headers")"
  location="$(header_value "$headers" 'location')"

  local normalized_location="$location"
  if [[ "$location" == /* ]]; then
    normalized_location="$BASE_URL$location"
  fi

  if [[ "$status" != "308" || "$normalized_location" != "$expected_location" ]]; then
    echo "FAIL $label: expected 308 -> $expected_location, received $status -> ${location:-<none>}" >&2
    return 1
  fi

  echo "PASS $label: 308 -> $location"
}

check_redirect "trailing slash" "$BASE_URL/about" "$BASE_URL/about/"

if [[ "$BASE_URL" == "https://blakeoxford.com" ]]; then
  check_redirect "http apex canonicalization" "http://blakeoxford.com/about" "$BASE_URL/about/"
  check_redirect "http www canonicalization" "http://www.blakeoxford.com/about" "$BASE_URL/about/"
  check_redirect "www apex canonicalization" "https://www.blakeoxford.com/about" "$BASE_URL/about/"
fi

check_absent() {
  local label="$1"
  local url="$2"
  local headers status

  headers="$(curl "${curl_args[@]}" --dump-header - --output /dev/null "$url")"
  status="$(awk 'NR == 1 { print $2 }' <<<"$headers")"

  if [[ "$status" != "404" && "$status" != "410" ]]; then
    echo "FAIL $label: expected 404 or 410, received $status" >&2
    return 1
  fi

  echo "PASS $label: $status"
}

check_absent "sitemap index alternate" "$BASE_URL/sitemap-index.xml"
for shard in {0..9}; do
  check_absent "sitemap shard alternate $shard" "$BASE_URL/sitemap-$shard.xml"
done

robots="$(curl "${curl_args[@]}" --fail "$BASE_URL/robots.txt")"
robots_sitemaps="$(grep -E '^Sitemap:' <<<"$robots" || true)"
if [[ "$(wc -l <<<"$robots_sitemaps" | tr -d ' ')" != "1" ]] ||
  ! grep -q '^Sitemap: https://blakeoxford\.com/sitemap\.xml$' <<<"$robots_sitemaps"; then
  echo 'FAIL robots: expected exactly one canonical sitemap directive' >&2
  exit 1
fi
echo 'PASS robots: one canonical sitemap directive'

sitemap="$(curl "${curl_args[@]}" --fail "$BASE_URL/sitemap.xml")"
if ! grep -q '<urlset ' <<<"$sitemap"; then
  echo 'FAIL sitemap: expected a single urlset document' >&2
  exit 1
fi
if grep -qE 'sitemap-index|sitemap-[0-9]+\.xml' <<<"$sitemap"; then
  echo 'FAIL sitemap: nested sitemap reference found' >&2
  exit 1
fi
if grep -qE '<(changefreq|priority)>' <<<"$sitemap"; then
  echo 'FAIL sitemap: unsupported changefreq/priority signals found' >&2
  exit 1
fi
if [[ "$(grep -o '<lastmod>' <<<"$sitemap" | wc -l | tr -d ' ')" -lt 1 ]]; then
  echo 'FAIL sitemap: expected content-backed lastmod values' >&2
  exit 1
fi
if grep -qE '/(accessibility|components|design|docs)/' <<<"$sitemap"; then
  echo 'FAIL sitemap: noindex route present' >&2
  exit 1
fi
echo 'PASS sitemap: canonical, fresh, indexable-only URL set'

sitemap_urls="$(grep -o '<loc>[^<]*</loc>' <<<"$sitemap" | sed 's#<loc>##; s#</loc>##')"
if [[ -z "$sitemap_urls" ]]; then
  echo 'FAIL sitemap: no canonical URLs found' >&2
  exit 1
fi

sitemap_url_count=0
while IFS= read -r sitemap_url; do
  [[ -z "$sitemap_url" ]] && continue
  url_headers="$(curl "${curl_args[@]}" --max-redirs 0 --dump-header - --output /dev/null "$sitemap_url")"
  url_status="$(awk 'NR == 1 { print $2 }' <<<"$url_headers")"
  if [[ "$url_status" != "200" ]]; then
    echo "FAIL sitemap URL: expected direct 200 for $sitemap_url, received $url_status" >&2
    exit 1
  fi
  ((sitemap_url_count += 1))
done <<<"$sitemap_urls"
echo "PASS sitemap URLs: $sitemap_url_count canonical URLs returned direct 200"

project_html="$(curl "${curl_args[@]}" --fail "$BASE_URL/projects/adp-workforcenow/")"
if ! grep -q '<meta name="description" content="[^"].*"' <<<"$project_html"; then
  echo 'FAIL project metadata: description is missing or empty' >&2
  exit 1
fi
if ! grep -q '"@type":"CreativeWork"' <<<"$project_html" || ! grep -q '"@type":"BreadcrumbList"' <<<"$project_html"; then
  echo 'FAIL project metadata: expected CreativeWork and BreadcrumbList JSON-LD' >&2
  exit 1
fi
echo 'PASS project metadata: description and structured data present'

article_html="$(curl "${curl_args[@]}" --fail "$BASE_URL/blog/ai-statistics-future-decision-making/")"
if ! grep -q '<meta property="og:type" content="article"' <<<"$article_html"; then
  echo 'FAIL article metadata: expected og:type=article' >&2
  exit 1
fi
if ! grep -q '"@type":"Article"' <<<"$article_html" || ! grep -q '"@type":"BreadcrumbList"' <<<"$article_html"; then
  echo 'FAIL article metadata: expected Article and BreadcrumbList JSON-LD' >&2
  exit 1
fi
echo 'PASS article metadata: article social type and structured data present'

utility_headers="$(curl "${curl_args[@]}" --dump-header - --output /dev/null --fail "$BASE_URL/design/tokens/")"
utility_html="$(curl "${curl_args[@]}" --fail "$BASE_URL/design/tokens/")"
if ! grep -q 'noindex' <<<"$utility_html" || [[ -z "$(header_value "$utility_headers" 'content-type')" ]]; then
  echo 'FAIL utility metadata: expected a rendered noindex HTML response' >&2
  exit 1
fi
echo 'PASS utility metadata: noindex policy present'

if [[ -n "$EXPECTED_COMMIT" ]]; then
  version="$(curl "${curl_args[@]}" --fail "$BASE_URL/__version")"
  if [[ "$version" != *"$EXPECTED_COMMIT"* ]]; then
    echo "FAIL provenance: expected $EXPECTED_COMMIT, received $version" >&2
    exit 1
  fi
  echo "PASS provenance: $EXPECTED_COMMIT"
fi
