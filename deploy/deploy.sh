#!/usr/bin/env bash
# deploy.sh — runs ON THE VM via GitHub Actions (appleboy/ssh-action).
# Pulls latest main, rebuilds, restarts the daemon, verifies /health.
set -euo pipefail

REPO_DIR="$HOME/bannon"
APP_PORT="${PORT:-8080}"

echo "==> Updating repo"
if [ ! -d "$REPO_DIR/.git" ]; then
  git clone https://github.com/mhvnsnt/Bannon.git "$REPO_DIR"
fi
cd "$REPO_DIR"
git fetch origin main
git reset --hard origin/main

echo "==> Installing + building godmode daemon"
cd "$REPO_DIR/godmode"
npm ci
npm run build

echo "==> Restarting bannon-daemon (pm2, restart-always)"
# Render the ecosystem template with this VM's real home directory
sed "s|/home/ubuntu/bannon|$REPO_DIR|g" "$REPO_DIR/deploy/ecosystem.config.cjs" > /tmp/bannon-ecosystem.config.cjs
pm2 startOrReload /tmp/bannon-ecosystem.config.cjs --env production
pm2 save

echo "==> Health check on :$APP_PORT/health"
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$APP_PORT/health" >/dev/null; then
    echo "HEALTHY"
    pm2 list
    exit 0
  fi
  sleep 2
done
echo "HEALTHCHECK FAILED — recent logs:"
pm2 logs bannon-daemon --lines 50 --nostream || true
exit 1
