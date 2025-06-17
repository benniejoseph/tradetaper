#!/usr/bin/env bash
# Simple smoke tests for TradeTaper backend running at $BACKEND_URL (default http://localhost:8080)
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"

echo "👉 Hitting $BACKEND_URL/healthz ..."
if curl -sf "$BACKEND_URL/healthz" | grep -q 'OK'; then
  echo "✅ Health endpoint responded OK"
else
  echo "❌ Health check failed" >&2
  exit 1
fi

# Additional endpoints can be added below as the test suite evolves.

echo "🎉 Smoke tests passed" 