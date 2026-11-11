#!/bin/sh
# Free disk space after a film is DONE.   sh system/clean.sh <slug>
# Removes only generated, re-creatable files: out/ (render, mix, stems, stills), _lib/, fonts/ and events.json.
# Keeps: final/ (mp4, poster, QA-REPORT, CREDITS), voice/ (so a rebuild can run offline), lines.json, film.json, timeline.json, TREATMENT*, hand-written sources.
# Rebuild any time:  SKIP_VOICE=1 sh system/build.sh <slug>
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); SLUG=${1:?slug}; D="$ROOT/films/$SLUG"
[ -f "$D/film.json" ] && [ -d "$D/final" ] || { echo "films/$SLUG is not a film folder with final/ (nothing removed)"; exit 1; }
[ -f "$D/final/$SLUG.mp4" ] || { echo "films/$SLUG/final/$SLUG.mp4 is missing: refusing to clean an unfinished film"; exit 1; }
BEFORE=$(du -sm "$D" | cut -f1)
rm -rf "$D/out" "$D/_lib" "$D/fonts"; rm -f "$D/events.json"
AFTER=$(du -sm "$D" | cut -f1); echo "cleaned films/$SLUG: ${BEFORE} MB -> ${AFTER} MB (final/ and voice/ kept)"
