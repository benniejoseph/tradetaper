#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-production}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

TOKENS=(
  "GOOGLE_SITE_VERIFICATION:${GOOGLE_SITE_VERIFICATION:-}"
  "BING_SITE_VERIFICATION:${BING_SITE_VERIFICATION:-}"
  "YANDEX_SITE_VERIFICATION:${YANDEX_SITE_VERIFICATION:-}"
)

UPDATED=0
SKIPPED=0

echo "Applying search verification env vars to Vercel environment: ${TARGET_ENV}"

for entry in "${TOKENS[@]}"; do
  name="${entry%%:*}"
  value="${entry#*:}"

  if [[ -z "$value" ]]; then
    echo "SKIP: ${name} is not set in local shell."
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  vercel env rm "$name" "$TARGET_ENV" --yes >/dev/null 2>&1 || true
  printf '%s\n' "$value" | vercel env add "$name" "$TARGET_ENV" >/dev/null
  echo "OK: ${name} updated in ${TARGET_ENV}."
  UPDATED=$((UPDATED + 1))
done

echo "Done. Updated=${UPDATED}, Skipped=${SKIPPED}"

if [[ "$UPDATED" -eq 0 ]]; then
  echo "No verification tokens were provided."
  echo "Export GOOGLE_SITE_VERIFICATION (required) and optionally BING_SITE_VERIFICATION / YANDEX_SITE_VERIFICATION, then rerun."
  exit 1
fi
