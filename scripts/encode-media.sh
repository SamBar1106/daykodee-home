#!/usr/bin/env bash
# Re-encode Daykodee hero and lifestyle clips:
# libx264 CRF 18, 1-second keyframes at 24 fps, no audio, faststart.
set -euo pipefail
SRC="${1:-/home/ubuntu/.cursor/projects/workspace/uploads}"
OUT="${2:-public/media}"
mkdir -p "$OUT"

encode() {
  ffmpeg -y -i "$1" -map 0:v:0 -map_metadata -1 -an \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
    -g 24 -keyint_min 24 -sc_threshold 0 \
    -movflags +faststart "$2"
}

encode "$SRC/H1-bottles-logo_3c0f.mp4" "$OUT/h1-bottles.mp4"
encode "$SRC/H2-caps-logo_42d7.mp4" "$OUT/h2-caps.mp4"
encode "$SRC/H3-bags-logo_a085.mp4" "$OUT/h3-bags.mp4"
encode "$SRC/H4-tees-logo_39b1.mp4" "$OUT/h4-tees.mp4"
encode "$SRC/L1b-classroom-multiracial_39ed.mp4" "$OUT/l1-classroom.mp4"
