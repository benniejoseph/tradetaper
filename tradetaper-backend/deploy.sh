#!/bin/bash
set -euo pipefail

# Safe source deployment for production:
# - clones env from latest READY revision
# - blocks deploy if placeholder values are detected
# - refreshes DB_PASSWORD and GEMINI_API_KEY from Secret Manager

PROJECT_ID="${PROJECT_ID:-trade-taper}"
SERVICE_NAME="${SERVICE_NAME:-tradetaper-backend}"
REGION="${REGION:-us-central1}"
TMP_ENV_FILE="$(mktemp "/tmp/${SERVICE_NAME}-env-XXXXXX.yaml")"
TMP_PLACEHOLDER_FILE="$(mktemp "/tmp/${SERVICE_NAME}-placeholders-XXXXXX.txt")"

cleanup() {
  rm -f "${TMP_ENV_FILE}" "${TMP_PLACEHOLDER_FILE}"
}
trap cleanup EXIT

echo "Deploying to Cloud Run (safe source deployment)"
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required for deploy.sh"
  exit 1
fi

LATEST_READY_REVISION="$(gcloud run services describe "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format='value(status.latestReadyRevisionName)')"

if [[ -z "${LATEST_READY_REVISION}" ]]; then
  echo "Error: could not resolve latest ready revision for ${SERVICE_NAME}"
  exit 1
fi

echo "Using env snapshot from revision: ${LATEST_READY_REVISION}"

gcloud run revisions describe "${LATEST_READY_REVISION}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format='json(spec.containers[0].env)' \
  | jq -r '.spec.containers[0].env[] | "\(.name): \(.value // "" | @json)"' \
  > "${TMP_ENV_FILE}"

if rg -n '(<REPLACE_WITH_|REPLACE_WITH_|YOUR_OANDA_API_KEY_HERE)' "${TMP_ENV_FILE}" > "${TMP_PLACEHOLDER_FILE}"; then
  echo "Error: refusing deploy because placeholder env values were found in latest ready revision env:"
  cat "${TMP_PLACEHOLDER_FILE}"
  echo "Fix service env first, then redeploy."
  exit 1
fi

gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --env-vars-file "${TMP_ENV_FILE}" \
  --update-secrets=DB_PASSWORD=TRADETAPER_DB_PASSWORD:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest

echo "Deployment finished!"
