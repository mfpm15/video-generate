#!/bin/sh
set -eu
D=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LIB=${LIB:-${LEMO_OPUSCAR_HOME:-$HOME/lemo-opuscar}}
ROOT=$(CDPATH= cd -- "$D/../.." && pwd)
if [ ! -s "$D/fonts/Inter.ttf" ] || [ ! -s "$D/fonts/InterTight-var.woff2" ]; then
  sh "$ROOT/system/tools/fonts.sh"
  mkdir -p "$D/fonts"
  cp "$ROOT/system/fonts/"* "$D/fonts/"
fi
if [ "${SKIP_RENDER:-0}" != 1 ]; then
  node "$LIB/core/render/video.mjs" "$D" --fps 24 --workers "${WORKERS:-2}" --size 1080x1920 --out "$D/out/video.mp4"
fi
ffmpeg -y -v error -i "$D/out/video.mp4" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  -map 0:v:0 -map 1:a:0 -vf 'scale=iw:ih:in_color_matrix=bt601:out_color_matrix=bt709:in_range=tv:out_range=tv,format=yuv420p,setsar=1' \
  -c:v libx264 -crf 14 -preset slow -profile:v high -level:v 4.1 -maxrate 18M -bufsize 36M -c:a aac -b:a 128k -t 12 \
  -bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0:sample_aspect_ratio=1/1:level=4.1 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -movflags +faststart "$D/final/ai-agent-opuscar-v2.mp4"
ffmpeg -y -v error -ss 7.5 -i "$D/final/ai-agent-opuscar-v2.mp4" -frames:v 1 "$D/final/poster.jpg"
ffmpeg -y -v error -i "$D/final/ai-agent-opuscar-v2.mp4" -vf 'fps=0.5,scale=360:-2,tile=3x2:padding=4' -frames:v 1 "$D/final/review.jpg"
