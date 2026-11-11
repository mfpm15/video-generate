#!/bin/sh
# Preserve every QA tool exit status; structured results are retained with the final video.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SLUG=${1:?usage: sh system/qa.sh <slug>}
. "$ROOT/system/tools/runtime.sh"
exec "$PY" "$ROOT/system/py/run_qa.py" "$ROOT/films/$SLUG"
