#!/bin/sh
# Build one film end to end.   sh system/build.sh <slug>          (SKIP_VOICE=1 = reuse voice/*.wav, offline)
# voice (edge-tts, online) -> ASR check -> timeline -> events -> readcheck -> render -> mix -> mux (-14 LUFS) -> poster -> QA
# A film may override a step by having its own file: make_timeline.py, mix.py (custom films). Otherwise the shared ones run.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); SLUG=${1:?usage: sh system/build.sh <slug>}; D="$ROOT/films/$SLUG"
[ -f "$D/film.json" ] || { echo "no films/$SLUG/film.json (create with: sh system/new-film.sh \"Judul\")"; exit 1; }
LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder (sh setup.sh prints it)"; exit 1; }
PY="$LIB/.venv/bin/python"
# RAM guard: 3D rendering needs several GB. Pick the number of render workers from the free memory (set WORKERS=n to override).
if [ -z "$WORKERS" ]; then
  FREEMB=$(powershell.exe -NoProfile -Command "[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)" 2>/dev/null | tr -d '')
  case "$FREEMB" in ''|*[!0-9]*) WORKERS=2;; *) if [ "$FREEMB" -lt 3500 ]; then WORKERS=1; elif [ "$FREEMB" -lt 5500 ]; then WORKERS=2; else WORKERS=3; fi; echo "RAM guard: ${FREEMB} MB free -> $WORKERS render worker(s) (close other apps for a faster render)";; esac
fi
J() { "$PY" -c "import json,sys;d=json.load(open(sys.argv[1],encoding='utf-8'));print(d.get(sys.argv[2],sys.argv[3]))" "$D/film.json" "$1" "$2"; }
SIZE=$(J size 1920x1080); FPS=$(J fps 30); VOICE=$(J voice id-ID-ArdiNeural); RATE=$(J rate +6%); ASRLANG=$(J asr_lang id); ASRMODEL=$(J asr_model small)
mkdir -p "$D/out" "$D/final"
say() { echo "==> $*"; }
say "shared code + fonts -> $SLUG/_lib, fonts"; sh "$ROOT/system/tools/sync-lib.sh" "$D"; sh "$ROOT/system/tools/fonts.sh"; sh "$ROOT/system/tools/sync-lib.sh" "$D"
if [ -z "$SKIP_VOICE" ]; then
  say "voice ($VOICE $RATE)"; TRY=1; until "$PY" "$LIB/core/tts/tts_zh.py" "$D/lines.json" "$D/voice" --voice "$VOICE" --rate "$RATE"; do [ $TRY -ge 5 ] && { echo "TTS failed 5 times (Edge-TTS online service). Try again later."; exit 1; }; echo "TTS hiccup, retry $TRY/5"; TRY=$((TRY+1)); sleep $((TRY*3)); done
  say "ASR check per line"; "$PY" "$LIB/core/tts/asr_check.py" "$D/lines.json" "$D/voice" --lang "$ASRLANG" --model "$ASRMODEL" || echo "WARNING: some voice lines differ from the script in Whisper (see above). Continuing; listen to those lines. Add an \"asr\" or \"say\" field in lines.json to fix a genuine mispronunciation." 
fi
say "timeline"; if [ -f "$D/make_timeline.py" ]; then "$PY" "$D/make_timeline.py"; else "$PY" "$ROOT/system/py/make_timeline.py" "$D"; fi
say "script lint (retention checklist)"; "$PY" "$ROOT/system/py/lint_script.py" "$D" || true
cd "$LIB"
say "events";    node core/render/events.mjs "$D" --size "$SIZE"
say "readcheck"; PADARG=""; [ "$(J engine 2d)" = "3d" ] && PADARG="--pad 1.0"; node core/render/readcheck.mjs "$D" --size "$SIZE" $PADARG
say "render ${SIZE}@${FPS}"; node core/render/video.mjs "$D" --fps "$FPS" --workers "$WORKERS" --size "$SIZE" --out "$D/out/video.mp4"
say "mix";       if [ -f "$D/mix.py" ]; then "$PY" "$D/mix.py"; else "$PY" "$ROOT/system/audio/mixlib.py" "$D"; fi
say "mux";       LEMO_COLOR=bt709 sh core/render/mux.sh "$D/out/video.mp4" "$D/out/mix.wav" "$D/final/$SLUG.mp4" "$FPS" 0
DUR=$("$PY" -c "import json,sys;print(json.load(open(sys.argv[1]))['dur']*0.42)" "$D/timeline.json")
say "thumbnail"; T=3.0; node core/render/still.mjs "$D" "$T" --size "$SIZE" --q thumb=1 --out "$D/out/thumb" --prefix p_ >/dev/null && cp "$D/out/thumb/"p_*.jpg "$D/final/thumbnail.jpg"
say "QA";        sh "$ROOT/system/qa.sh" "$SLUG"
say "report";    "$PY" "$ROOT/system/py/make_report.py" "$D"
[ -f "$D/post.json" ] && "$PY" "$ROOT/system/py/make_post.py" "$D/post.json" "$D/final/POST.md" "$D/film.json"
say "deliverables"; "$PY" "$ROOT/system/py/check_deliverables.py" "$D" || echo "!! NOT COMPLETE: write films/$SLUG/post.json and re-run (SKIP_VOICE=1 sh system/build.sh $SLUG) or run system/py/make_post.py"
echo; echo "DONE: $D/final/$SLUG.mp4   (thumbnail.jpg, QA-REPORT.md, CREDITS; QA log: out/qa-run.log)"
