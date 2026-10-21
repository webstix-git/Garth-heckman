#!/usr/bin/env bash
# Apply Phase A migrations to the linked Supabase project via Management API.
# Requires: SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${SUPABASE_PROJECT_REF:-cnsmezewkpgqkhuvwfts}"
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN"
  echo "Create one at https://supabase.com/dashboard/account/tokens (database write scope)"
  echo "Then: export SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 1
fi

MIG_DIR="$ROOT/migrations"
FILES=(
  20260823100000_extensions.sql
  20260823100100_tenancy.sql
  20260823100200_catalog.sql
  20260823100300_media_settings.sql
  20260823100400_customers_cart.sql
  20260823100500_orders_payments.sql
  20260823100600_rls.sql
  20260823100700_seed_garth.sql
)

for f in "${FILES[@]}"; do
  path="$MIG_DIR/$f"
  echo "→ Applying $f"
  # Build JSON payload without dumping SQL to the terminal
  payload="$(python3 - "$path" <<'PY'
import json, sys
sql = open(sys.argv[1], encoding="utf-8").read()
print(json.dumps({"query": sql}))
PY
)"
  code="$(curl -sS -o /tmp/supabase-apply-out.json -w "%{http_code}" \
    "https://api.supabase.com/v1/projects/${REF}/database/query" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    --data-binary "$payload")"
  if [[ "$code" != "201" && "$code" != "200" ]]; then
    echo "Failed ($code) on $f:"
    head -c 2000 /tmp/supabase-apply-out.json; echo
    exit 1
  fi
  echo "  OK ($code)"
done

echo "All Phase A migrations applied to project $REF"
