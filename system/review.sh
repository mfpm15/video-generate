#!/bin/sh
# Visual review sheets: one frame per scene (+ thumbnail).  sh system/review.sh <slug>  -> films/<slug>/out/review/sheet-1.jpg, sheet-2.jpg ... (6 frames each)
# Look at them (Read tool) for: text overflow, overlaps, empty areas, clipped shapes, unreadable labels. Fix, rebuild, review again.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); SLUG=${1:?slug}; D="$ROOT/films/$SLUG"; LIB=${LIB:-$HOME/lemo-opuscar}; PY="$LIB/.venv/bin/python"
SIZE=$("$PY" -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('size','1920x1080'))" "$D/film.json")
sh "$ROOT/system/tools/sync-lib.sh" "$D"; rm -rf "$D/out/review"; mkdir -p "$D/out/review"
TS=$("$PY" -c "import json,sys;T=json.load(open(sys.argv[1]));print(' '.join(str(round(min(s['t0']+2.4,s['t1']-0.3),2)) for s in T['scenes']))" "$D/timeline.json")
cd "$LIB"; node core/render/still.mjs "$D" $TS --size "$SIZE" --out "$D/out/review" --prefix f_ >/dev/null
node core/render/still.mjs "$D" 3 --size "$SIZE" --q thumb=1 --out "$D/out/review" --prefix z_thumb_ >/dev/null
FILES=$(ls "$D"/out/review/f_*.jpg | sort -t_ -k2 -n); N=0; BATCH=""; K=0
for f in $FILES; do BATCH="$BATCH $f"; K=$((K+1)); if [ $K -eq 6 ]; then N=$((N+1)); "$PY" core/render/sheet.py "$D/out/review/sheet-$N.jpg" $BATCH --cols 2 --w 800 >/dev/null; BATCH=""; K=0; fi; done
[ -n "$BATCH" ] && { N=$((N+1)); "$PY" core/render/sheet.py "$D/out/review/sheet-$N.jpg" $BATCH --cols 2 --w 800 >/dev/null; }
echo "review sheets: $D/out/review/sheet-1..$N.jpg (+ thumbnail)"
