#!/usr/bin/env bash
set -euo pipefail

# Render web service entrypoint — starts the Express API + Socket.IO server
# Does NOT start BullMQ workers (the worker service handles those)

echo "[START-WEB] Starting VedaAI API server..."
echo "[START-WEB] Node version: $(node --version)"
echo "[START-WEB] Mode: web (API + Socket.IO only)"

cd "$(dirname "$0")/apps/backend"

exec node dist/app.js
