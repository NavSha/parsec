#!/bin/bash
# Fetch planet texture maps (Solar System Scope, CC BY 4.0 — NASA-derived)
# and downscale to 1024x512 for canvas sphere-wrapping.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/textures /tmp/tex

BASE="https://www.solarsystemscope.com/textures/download"
MAPS="mercury venus_atmosphere earth_daymap mars jupiter saturn uranus neptune moon"

for m in $MAPS; do
  out="/tmp/tex/$m.jpg"
  echo "— $m"
  curl -fsSL "$BASE/2k_$m.jpg" -o "$out" || { echo "  skip (fetch failed)"; continue; }
  sips -z 512 1024 "$out" --out "assets/textures/$m.jpg" >/dev/null
done
ls -lh assets/textures/
