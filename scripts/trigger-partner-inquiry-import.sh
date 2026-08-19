#!/usr/bin/env bash
# Call the production import route. Gmail app passwords are Vercel Sensitive
# env vars and never appear in `vercel env pull`.
set -euo pipefail

URL="${IMPORT_URL:-https://design-meetup-web.vercel.app/api/contact/import}"
ATTEMPTS="${IMPORT_ATTEMPTS:-8}"
SLEEP_SECONDS="${IMPORT_RETRY_SECONDS:-15}"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "::error::VERCEL_TOKEN is not set. Add it under Settings → Secrets and variables → Actions."
  exit 1
fi

body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT

for attempt in $(seq 1 "$ATTEMPTS"); do
  code="$(
    curl -sS -o "$body_file" -w "%{http_code}" -X POST \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Accept: application/json" \
      "$URL" || true
  )"

  if [ "$code" = "200" ]; then
    python3 - "$body_file" <<'PY'
import json, sys
path = sys.argv[1]
try:
    data = json.load(open(path))
except Exception:
    data = {}
print(
    "Found {found}, inserted {inserted}, skipped {skipped}.".format(
        found=data.get("found", "?"),
        inserted=data.get("inserted", "?"),
        skipped=data.get("skipped", "?"),
    )
)
PY
    exit 0
  fi

  echo "Import attempt ${attempt}/${ATTEMPTS} returned HTTP ${code:-000}"
  if [ "$attempt" -lt "$ATTEMPTS" ]; then
    sleep "$SLEEP_SECONDS"
  fi
done

echo "::error::Partner inquiry import failed after ${ATTEMPTS} attempts."
exit 1
