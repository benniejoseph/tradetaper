#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS_DIR="${ROOT_DIR}/.claude/agents"
INVENTORY_FILE="${AGENTS_DIR}/.voltagent-installed-files.txt"
REPO_URL="${1:-https://github.com/VoltAgent/awesome-claude-code-subagents}"
REF="${2:-main}"

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

git clone --depth 1 --branch "${REF}" "${REPO_URL}" "${TMP_DIR}/repo"

if [[ ! -d "${TMP_DIR}/repo/categories" ]]; then
  echo "Expected categories directory missing in ${REPO_URL}@${REF}" >&2
  exit 1
fi

mkdir -p "${AGENTS_DIR}"

if [[ -f "${INVENTORY_FILE}" ]]; then
  while IFS= read -r filename; do
    [[ -n "${filename}" ]] || continue
    rm -f "${AGENTS_DIR}/${filename}"
  done < "${INVENTORY_FILE}"
fi

SOURCE_LIST_FILE="${TMP_DIR}/source-files.txt"
find "${TMP_DIR}/repo/categories" -type f -name '*.md' ! -name 'README.md' | sort > "${SOURCE_LIST_FILE}"

: > "${INVENTORY_FILE}"
file_count=0
while IFS= read -r src; do
  [[ -n "${src}" ]] || continue
  base="$(basename "${src}")"
  cp "${src}" "${AGENTS_DIR}/${base}"
  echo "${base}" >> "${INVENTORY_FILE}"
  file_count=$((file_count + 1))
done < "${SOURCE_LIST_FILE}"

commit_sha="$(git -C "${TMP_DIR}/repo" rev-parse HEAD)"
installed_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cat > "${AGENTS_DIR}/VOLTAGENT_SOURCE.md" <<META
# VoltAgent Claude Subagents Source

- Source: ${REPO_URL}
- Ref: ${REF}
- Commit: ${commit_sha}
- Installed at (UTC): ${installed_at}
- Agent file count: ${file_count}

Synced via:
- scripts/sync-voltagent-subagents.sh
META

echo "Synced ${file_count} agents into ${AGENTS_DIR}"
echo "Source commit: ${commit_sha}"
