#!/bin/bash
# encode_profiles.sh — encode preset profiles + benchmark.
# Profiles used by assemble_character_video.py; this script measures them.
# Usage: ./encode_profiles.sh <input.mp4>   (encodes a 10s sample with each profile)
set -u
IN="${1:?usage: encode_profiles.sh <input.mp4>}"
SAMPLE=/tmp/enc_sample.mp4
ffmpeg -hide_banner -loglevel error -y -t 10 -i "$IN" -c copy "$SAMPLE"
for spec in "draft:veryfast:23" "delivery:medium:18" "archive:slow:16"; do
  name="${spec%%:*}"; rest="${spec#*:}"; preset="${rest%%:*}"; crf="${rest##*:}"
  out="/tmp/enc_${name}.mp4"
  t0=$(date +%s.%N)
  ffmpeg -hide_banner -loglevel error -y -i "$SAMPLE" -an -c:v libx264 \
    -preset "$preset" -crf "$crf" -pix_fmt yuv420p "$out"
  t1=$(date +%s.%N)
  size=$(stat -c%s "$out")
  dt=$(python3 -c "print(round($t1 - $t0, 1))")
  echo "$name (preset=$preset crf=$crf): ${dt}s  ${size} bytes"
done
