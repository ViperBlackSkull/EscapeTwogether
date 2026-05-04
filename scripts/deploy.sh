#!/usr/bin/env bash
set -euo pipefail

# EscapeTwogether Deployment Script
# Usage: ./scripts/deploy.sh [--rollback]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
SERVICE_NAME="escapetwogether"
IMAGE_NAME="escapetwogether"
HEALTH_URL="http://localhost:3000/health"
HEALTH_TIMEOUT=60

cd "$PROJECT_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
err() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

# --- Rollback mode ---
if [[ "${1:-}" == "--rollback" ]]; then
  log "Rolling back to previous image..."
  PREV_TAG=$(docker image ls --format '{{.Tag}}' "$IMAGE_NAME" | grep '^prev-' | sort -r | head -1)
  if [[ -z "$PREV_TAG" ]]; then
    err "No previous image found for rollback."
    exit 1
  fi
  docker tag "$IMAGE_NAME:$PREV_TAG" "$IMAGE_NAME:latest" 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" up -d --force-recreate
  log "Rolled back to $IMAGE_NAME:$PREV_TAG"
  exit 0
fi

# --- Pre-deploy: tag current image as rollback target ---
CURRENT_IMAGE_ID=$(docker images -q "$IMAGE_NAME:latest" 2>/dev/null || true)
if [[ -n "$CURRENT_IMAGE_ID" ]]; then
  ROLLBACK_TAG="prev-$(date '+%Y%m%d%H%M%S')"
  docker tag "$IMAGE_NAME:latest" "$IMAGE_NAME:$ROLLBACK_TAG" 2>/dev/null || true
  log "Tagged current image as $IMAGE_NAME:$ROLLBACK_TAG for rollback"

  # Keep only the 3 most recent rollback tags
  docker image ls --format '{{.Tag}}' "$IMAGE_NAME" \
    | grep '^prev-' | sort -r | tail -n +4 \
    | while read -r old_tag; do
      docker rmi "$IMAGE_NAME:$old_tag" 2>/dev/null || true
    done
fi

# --- Pull latest code (if in a git repo) ---
if git rev-parse --is-inside-work-tree &>/dev/null; then
  log "Pulling latest code..."
  git pull --rebase || { err "git pull failed. Resolve conflicts and re-run."; exit 1; }
fi

# --- Build new image ---
log "Building Docker image..."
docker compose -f "$COMPOSE_FILE" build --no-cache 2>&1 || { err "Build failed."; exit 1; }
log "Build complete."

# --- Start new container alongside old one on a test port ---
# Stop the existing container first, then start the new one
log "Stopping existing container..."
docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

log "Starting new container..."
docker compose -f "$COMPOSE_FILE" up -d 2>&1 || { err "Failed to start container."; exit 1; }

# --- Health check ---
log "Waiting for health check (up to ${HEALTH_TIMEOUT}s)..."
elapsed=0
while (( elapsed < HEALTH_TIMEOUT )); do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    log "Health check passed after ${elapsed}s."
    log "Deployment successful."
    exit 0
  fi
  sleep 2
  (( elapsed += 2 ))
done

# --- Health check failed: rollback ---
err "Health check failed after ${HEALTH_TIMEOUT}s. Rolling back..."
docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

if [[ -n "${CURRENT_IMAGE_ID:-}" ]]; then
  docker tag "$CURRENT_IMAGE_ID" "$IMAGE_NAME:latest" 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" up -d 2>&1 || true
  err "Rolled back to previous image. Check logs with: docker compose logs"
else
  err "No previous image to roll back to."
fi
exit 1
