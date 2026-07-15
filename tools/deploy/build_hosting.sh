#!/bin/bash
# Build the static playable site for Firebase Hosting (or any static host: Netlify/Cloudflare/Render).
# The game HTML is tiny; the 80MB models are NOT bundled — the engine streams them from the GitHub
# raw CDN (window.MODEL_CDN_BASE default = raw.githubusercontent/mhvnsnt/Bannon/main/), so hosting
# stays free and small. Models must be on `main` for the CDN to serve them.
#   bash tools/deploy/build_hosting.sh && firebase deploy --only hosting
set -e
cd "$(dirname "$0")/../.."
mkdir -p hosting_public
cp BANNON_v150.html hosting_public/index.html
printf 'User-agent: *\nAllow: /\n' > hosting_public/robots.txt
echo "built hosting_public/ (index.html $(du -h hosting_public/index.html | cut -f1)). Models stream from the repo CDN on main."
