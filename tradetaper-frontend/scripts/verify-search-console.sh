#!/usr/bin/env bash
set -u

BASE_URL="${1:-https://tradetaper.com}"
BASE_URL="${BASE_URL%/}"

FAILURES=0
WARNINGS=0
CHECK_OPTIONAL_ENGINES="${SEO_CHECK_OPTIONAL_ENGINES:-false}"

pass() {
  printf 'PASS: %s\n' "$1"
}

info() {
  printf 'INFO: %s\n' "$1"
}

warn() {
  printf 'WARN: %s\n' "$1"
  WARNINGS=$((WARNINGS + 1))
}

fail() {
  printf 'FAIL: %s\n' "$1"
  FAILURES=$((FAILURES + 1))
}

fetch() {
  local url="$1"
  curl -fsSL --max-time 20 "$url"
}

is_truthy() {
  local value
  value="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  case "$value" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

printf 'Verifying SEO/Search Console readiness for %s\n' "$BASE_URL"

HOME_HTML=""
if HOME_HTML="$(fetch "$BASE_URL/")"; then
  pass "Homepage responds (200) at $BASE_URL/"
else
  fail "Homepage fetch failed for $BASE_URL/"
fi

if [[ -n "$HOME_HTML" ]]; then
  if printf '%s' "$HOME_HTML" | rg -q 'name="google-site-verification"'; then
    pass "Found google-site-verification meta tag on homepage"
  else
    warn "google-site-verification meta tag not found on homepage"
  fi

  if is_truthy "$CHECK_OPTIONAL_ENGINES"; then
    if printf '%s' "$HOME_HTML" | rg -q 'name="msvalidate\.01"'; then
      pass "Found msvalidate.01 (Bing) meta tag on homepage"
    else
      warn "msvalidate.01 (Bing) meta tag not found on homepage"
    fi

    if printf '%s' "$HOME_HTML" | rg -q 'name="yandex-verification"'; then
      pass "Found yandex-verification meta tag on homepage"
    else
      warn "yandex-verification meta tag not found on homepage"
    fi
  else
    info "Skipping Bing/Yandex meta checks (set SEO_CHECK_OPTIONAL_ENGINES=true to enable)"
  fi
fi

ROBOTS=""
if ROBOTS="$(fetch "$BASE_URL/robots.txt")"; then
  pass "robots.txt is reachable"
else
  fail "robots.txt fetch failed"
fi

if [[ -n "$ROBOTS" ]]; then
  if printf '%s' "$ROBOTS" | rg -qi '^user-agent:\s*\*'; then
    pass "robots.txt contains User-agent: *"
  else
    fail "robots.txt missing User-agent: *"
  fi

  if printf '%s' "$ROBOTS" | rg -qi '^disallow:\s*/api/'; then
    pass "robots.txt disallows /api/"
  else
    fail "robots.txt missing Disallow: /api/"
  fi

  if printf '%s' "$ROBOTS" | rg -qi "^sitemap:\s*${BASE_URL}/sitemap\.xml$"; then
    pass "robots.txt points to ${BASE_URL}/sitemap.xml"
  elif printf '%s' "$ROBOTS" | rg -qi '^sitemap:\s*https?://'; then
    local_sitemap_line="$(printf '%s' "$ROBOTS" | rg -i '^sitemap:\s*https?://' | head -n 1 | tr -d '\r')"
    pass "robots.txt includes sitemap directive"
    warn "robots.txt sitemap host differs from base URL (${local_sitemap_line})"
  else
    fail "robots.txt missing or mismatching sitemap location"
  fi
fi

SITEMAP=""
if SITEMAP="$(fetch "$BASE_URL/sitemap.xml")"; then
  pass "sitemap.xml is reachable"
else
  fail "sitemap.xml fetch failed"
fi

if [[ -n "$SITEMAP" ]]; then
  if printf '%s' "$SITEMAP" | rg -q '<urlset'; then
    pass "sitemap.xml looks like valid urlset"
  else
    fail "sitemap.xml is not a urlset document"
  fi
fi

CANONICAL_BASE_URL="$BASE_URL"
if [[ -n "$SITEMAP" ]]; then
  first_loc="$(printf '%s' "$SITEMAP" | rg -o '<loc>https?://[^<]+' -m 1 | sed -E 's#<loc>(https?://[^/]+).*#\1#')"
  if [[ -n "${first_loc:-}" ]]; then
    CANONICAL_BASE_URL="$first_loc"
  fi
fi

if [[ "$CANONICAL_BASE_URL" == "$BASE_URL" ]]; then
  pass "sitemap canonical host matches base URL (${BASE_URL})"
else
  warn "sitemap canonical host is ${CANONICAL_BASE_URL} (base URL is ${BASE_URL})"
fi

REQUIRED_ROUTES=(
  "/"
  "/pricing"
  "/about"
  "/contact"
  "/support"
  "/demo"
  "/legal"
  "/legal/privacy"
  "/legal/terms"
  "/legal/cancellation-refund"
)

if [[ -n "$SITEMAP" ]]; then
  for route in "${REQUIRED_ROUTES[@]}"; do
    expected="${CANONICAL_BASE_URL}${route}"
    if [[ "$route" == "/" ]]; then
      expected="${CANONICAL_BASE_URL}/"
    fi

    if printf '%s' "$SITEMAP" | rg -Fq "<loc>${expected}</loc>"; then
      pass "sitemap includes ${route}"
    else
      fail "sitemap missing ${route}"
    fi
  done

  LEGACY_ROUTES=("/privacy" "/terms" "/refund")
  for route in "${LEGACY_ROUTES[@]}"; do
    legacy_url="${CANONICAL_BASE_URL}${route}"
    if printf '%s' "$SITEMAP" | rg -Fq "<loc>${legacy_url}</loc>"; then
      fail "legacy route ${route} should not appear in sitemap"
    else
      pass "legacy route ${route} not present in sitemap"
    fi
  done
fi

check_redirect() {
  local from="$1"
  local to="$2"
  local result=""
  result="$(curl -sS -o /dev/null --max-time 20 -L -w '%{url_effective} %{http_code} %{num_redirects}' "${BASE_URL}${from}")" || {
    fail "redirect check failed for ${from}"
    return
  }

  local effective_url=""
  local final_status=""
  local redirect_count=""
  read -r effective_url final_status redirect_count <<< "$result"

  if [[ "${redirect_count:-0}" -ge 1 ]]; then
    pass "${from} performs redirect(s) (${redirect_count})"
  else
    fail "${from} did not redirect"
  fi

  if [[ "$final_status" == "200" ]]; then
    pass "${from} ends with 200 after redirects"
  else
    fail "${from} final status after redirects is ${final_status:-unknown} (expected 200)"
  fi

  local effective_path=""
  effective_path="$(printf '%s' "$effective_url" | sed -E 's#https?://[^/]+##' | sed -E 's#[?#].*$##')"
  if [[ -z "$effective_path" ]]; then
    effective_path="/"
  fi

  if [[ "$effective_path" == "$to" ]]; then
    pass "${from} resolves to expected path ${to}"
  else
    fail "${from} resolves to unexpected path ${effective_path} (expected ${to})"
  fi
}

check_redirect "/privacy" "/legal/privacy"
check_redirect "/terms" "/legal/terms"
check_redirect "/refund" "/legal/cancellation-refund"

printf '\nSummary: %d failure(s), %d warning(s)\n' "$FAILURES" "$WARNINGS"

if [[ "$FAILURES" -gt 0 ]]; then
  exit 1
fi

exit 0
