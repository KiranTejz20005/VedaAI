#!/usr/bin/env bash
set -euo pipefail

# Render worker service entrypoint — starts the BullMQ workers only
# Does NOT start the Express HTTP server

echo "[START-WORKER] Starting VedaAI background worker..."
echo "[START-WORKER] Node version: $(node --version)"
echo "[START-WORKER] Mode: worker (BullMQ queue processing only)"

cd "$(dirname "$0")/apps/backend"

exec node dist/app.js
