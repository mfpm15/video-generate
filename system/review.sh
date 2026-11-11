#!/bin/sh
# Render clean review sheets and a separate danger-zone mask sheet.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SLUG=${1:?usage: sh system/review.sh <slug>}
. "$ROOT/system/tools/runtime.sh"
sh "$ROOT/system/tools/sync-lib.sh" "$ROOT/films/$SLUG"
exec "$PY" "$ROOT/system/py/review.py" "$ROOT/films/$SLUG"
