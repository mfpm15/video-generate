#!/bin/sh
# QA on the FINAL file.   sh system/qa.sh <slug>   -> films/<slug>/out/qa-run.log  (never claims anything it did not run)
ROOT=$(cd "$(dirname "$0")/.." && pwd); SLUG=${1:?slug}; D="$ROOT/films/$SLUG"; LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
PY="$LIB/.venv/bin/python"; F="$D/final/$SLUG.mp4"; L="$D/out/qa-run.log"; : > "$L"
SIZE=$("$PY" -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('size','1920x1080'))" "$D/film.json")
say() { echo "$@" | tee -a "$L"; }
say "== ffprobe"; ffprobe -v error -show_entries stream=codec_type,codec_name,profile,width,height,r_frame_rate,pix_fmt,color_range,sample_rate,channels,duration -of csv=p=0 "$F" | tee -a "$L"
say "== blackdetect (d>=0.05s)"; ffmpeg -hide_banner -nostats -i "$F" -vf blackdetect=d=0.05:pic_th=0.98 -an -f null - 2>&1 | grep black_start | tee -a "$L"
say "== ebur128"; ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -vn -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | tee -a "$L"
say "== silencedetect (-55 dB, 0.3 s)"; ffmpeg -hide_banner -nostats -i "$F" -af silencedetect=n=-55dB:d=0.3 -vn -f null - 2>&1 | grep silence_ | tee -a "$L"
say "== clipping"; ffmpeg -hide_banner -nostats -i "$F" -af astats=metadata=1:reset=0 -vn -f null - 2>&1 | grep -E "Peak level dB|Flat factor|Peak count" | tail -3 | tee -a "$L"
say "== readcheck"; ENG=$("$PY" -c "import json,sys;print(json.load(open(sys.argv[1],encoding='utf-8')).get('engine','2d'))" "$D/film.json"); PADARG=""; [ "$ENG" = "3d" ] && PADARG="--pad 1.0"; (cd "$LIB" && node core/render/readcheck.mjs "$D" --size "$SIZE" $PADARG 2>&1 | grep -vE "passing \(pass: true\)") | tee -a "$L"
say "== captions: safe zone / overlap / clipping"; node "$ROOT/system/tools/qa-captions.mjs" "$D" 2>&1 | head -12 | tee -a "$L"
say "== ASR on final audio"; "$PY" "$ROOT/system/py/qa_asr.py" "$D" 2>&1 | grep -v HF_TOKEN | tee -a "$L"
say "== NOT DONE by this script: listening to the mix and watching at full speed (needs a human)."
