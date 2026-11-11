#!/bin/sh
# Thumbnails only (about 10 s, no re-render).   sh system/thumb.sh <slug> [variant 1|2|3]
# Writes out/thumbs/thumb-1..3.jpg and out/thumbs/sheet.jpg (big + 200 px previews, like a feed) and copies the chosen variant
# (argument, else film.json thumb.variant, else 1) to final/thumbnail.jpg.
# Pick by LOOKING at the sheet: readable at 200 px wide? one focal point? hook text of 5 words or fewer? badge not covering the text?
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); SLUG=${1:?slug}; D="$ROOT/films/$SLUG"; . "$ROOT/system/tools/runtime.sh"
SIZE=$("$PY" -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('size','1920x1080'))" "$D/film.json")
VAR=${2:-$("$PY" -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('thumb',{}).get('variant',1))" "$D/film.json")}
sh "$ROOT/system/tools/sync-lib.sh" "$D"; rm -rf "$D/out/thumbs"; mkdir -p "$D/out/thumbs" "$D/final"; cd "$LIB"
for v in 1 2 3; do
  node core/render/still.mjs "$D" 3 --size "$SIZE" --q "thumb=1&v=$v" --out "$D/out/thumbs/raw$v" --prefix t_ >/dev/null
  cp "$D"/out/thumbs/raw$v/t_*.jpg "$D/out/thumbs/thumb-$v.jpg"
done
"$PY" "$ROOT/system/py/thumb_sheet.py" "$D/out/thumbs"
cp "$D/out/thumbs/thumb-$VAR.jpg" "$D/final/thumbnail.jpg"
echo "thumbnails: $D/out/thumbs/sheet.jpg ; final/thumbnail.jpg = variant $VAR"
