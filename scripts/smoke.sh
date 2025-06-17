#!/usr/bin/env bash
# Simple smoke tests for TradeTaper backend.
# Set BACKEND_URL and optional HEALTH_PATH.

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
HEALTH_PATH="${HEALTH_PATH:-/healthz}"

FULL_URL="${BACKEND_URL}${HEALTH_PATH}"

echo "👉 Hitting $FULL_URL ..."
RESPONSE=$(curl -sf "$FULL_URL" || true)

if [[ "$RESPONSE" == *"OK"* ]] || [[ "$RESPONSE" == *"\"status\":\"healthy\""* ]]; then
  echo "✅ Health endpoint healthy"
else
  echo "❌ Health check failed. Response: $RESPONSE" >&2
  exit 1
fi

# Additional endpoints can be added below as the test suite evolves.

echo "🎉 Smoke tests passed" 