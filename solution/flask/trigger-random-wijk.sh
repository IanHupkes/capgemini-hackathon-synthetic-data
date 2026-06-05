#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-http://localhost:5001}"

echo "Triggering /random-wijk at $HOST..."

RESPONSE=$(curl -s -w "\n__STATUS__%{http_code}" "$HOST/random-wijk")

BODY="${RESPONSE%__STATUS__*}"
STATUS="${RESPONSE##*__STATUS__}"

echo "HTTP $STATUS"

if [ -n "$BODY" ]; then
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "(empty response body)"
fi
