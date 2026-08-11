#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/vercel-safe-deploy.sh --check
  scripts/vercel-safe-deploy.sh --deploy

Requires:
  VERCEL_TOKEN in the environment
  .vercel/project.json with projectId and orgId
EOF
}

mode="${1:-}"
if [[ "$mode" != "--check" && "$mode" != "--deploy" ]]; then
  usage
  exit 2
fi

if [[ ! -f package.json ]]; then
  echo "ERROR: run from the project root. package.json not found." >&2
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "ERROR: .vercel/project.json not found. Refusing to use global Vercel login." >&2
  exit 1
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: VERCEL_TOKEN is missing. Refusing to use global Vercel login." >&2
  exit 1
fi

node <<'NODE'
const fs = require('fs');
const path = '.vercel/project.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const missing = ['projectId', 'orgId'].filter((key) => !data[key]);
if (missing.length) {
  console.error(`ERROR: ${path} is missing ${missing.join(', ')}.`);
  process.exit(1);
}
console.log(`Project: ${data.projectName || data.projectId}`);
console.log(`Org: ${data.orgId}`);
NODE

npx --yes vercel@latest whoami --token "$VERCEL_TOKEN" >/dev/null

echo "Vercel token: OK"

if [[ "$mode" == "--check" ]]; then
  npm run build
  echo "Check complete."
  exit 0
fi

npm run build
npx --yes vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"
