#!/bin/sh
# Quick look: sh system/tools/stills3d.sh <slug> t1 t2 ...   -> films/<slug>/out/look/sheet.jpg  (9:16 stills tiled; 6 per row)
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd); SLUG=$1; shift; D="$ROOT/films/$SLUG"; LIB=${LIB:-$HOME/lemo-opuscar}
sh "$ROOT/system/tools/sync-lib.sh" "$D"; rm -rf "$D/out/look"; cd "$LIB"
SIZE=$("$LIB/.venv/bin/python" -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('size','1080x1920'))" "$D/film.json")
node core/render/still.mjs "$D" "$@" --size "$SIZE" $STILLQ --out "$D/out/look" --prefix s_ >/dev/null
"$LIB/.venv/bin/python" core/render/sheet.py "$D/out/look/sheet.jpg" $(ls "$D"/out/look/s_*.jpg | sort -t_ -k2 -n) --cols 6 --w 330 >/dev/null; echo "$D/out/look/sheet.jpg"
