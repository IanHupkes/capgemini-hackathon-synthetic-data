#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-http://localhost:5000}"
WIJK_CODE="${2:-BU0363}"

echo "Triggering synthesizer pipeline for wijk_code='$WIJK_CODE' at $HOST..."

curl -s -X POST "$HOST/get-synth" \
  -H "Content-Type: application/json" \
  -d "{\"wijk_code\": \"$WIJK_CODE\"}" | python3 -m json.tool
