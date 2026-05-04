#!/usr/bin/env bash
set -euo pipefail

# EscapeTwogether Development Setup Script
# Checks prerequisites, installs deps, creates .env, and starts dev server.
# Usage: ./scripts/setup-dev.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log() { echo "[*] $*"; }
err() { echo "[!] ERROR: $*" >&2; }

cd "$PROJECT_DIR"

# --- Node.js version check ---
log "Checking Node.js version..."
if ! command -v node &>/dev/null; then
  err "Node.js is not installed. Install Node.js 20+ from https://nodejs.org"
  exit 1
fi

NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if (( NODE_MAJOR < 20 )); then
  err "Node.js 20+ required (found v$(node -v)). Please upgrade."
  exit 1
fi
log "Node.js v$(node -v) OK."

# --- Install dependencies ---
log "Installing dependencies..."
npm ci 2>&1 || npm install 2>&1
log "Dependencies installed."

# --- Create .env from .env.example if missing ---
if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    log "Created .env from .env.example. Review and fill in API keys."
  else
    err ".env.example not found. Create .env manually."
    exit 1
  fi
else
  log ".env already exists, skipping."
fi

# --- Build shared types ---
log "Building shared types..."
if [[ -d shared ]]; then
  npx tsc -p tsconfig.base.json --noEmit 2>/dev/null || true
fi

# --- Pre-generate assets (optional, requires ComfyUI) ---
if [[ "${SKIP_ASSET_GEN:-}" != "true" ]]; then
  log "Attempting asset pre-generation (requires ComfyUI)..."
  if npx tsx server/src/scripts/generateAssets.ts 2>&1; then
    log "Assets generated."
  else
    log "Asset generation skipped (ComfyUI not available). This is fine for dev."
  fi
else
  log "Asset generation skipped (SKIP_ASSET_GEN=true)."
fi

# --- Start dev server ---
log ""
log "Setup complete! Starting dev server..."
log "  Client: http://localhost:5173"
log "  Server: http://localhost:3000"
log ""
npm run dev
