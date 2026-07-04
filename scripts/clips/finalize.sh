#!/bin/bash
# Encode approved clips for the web and extract poster frames.
# Usage: scripts/clips/finalize.sh <source-dir>   (e.g. media-drafts or media-finals)
set -euo pipefail
SRC=${1:?usage: finalize.sh <source-dir>}
cd "$(dirname "$0")/../.."
mkdir -p media

for f in "$SRC"/*.mp4; do
  id=$(basename "$f" .mp4)
  echo "— $id"
  # H.264 high profile, capped bitrate, faststart for scrubbing over HTTP
  ffmpeg -loglevel error -y -i "$f" \
    -c:v libx264 -profile:v high -crf 23 -maxrate 3M -bufsize 6M \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
    -pix_fmt yuv420p -movflags +faststart -an \
    "media/$id.mp4"
  # poster: first frame
  ffmpeg -loglevel error -y -i "media/$id.mp4" -vframes 1 -q:v 3 "media/$id.jpg"
done
ls -lh media/
