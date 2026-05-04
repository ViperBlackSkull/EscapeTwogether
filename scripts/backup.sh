#!/usr/bin/env bash
set -euo pipefail

# EscapeTwogether Backup Script
# Backs up game session data and generated assets from Docker volumes.
# Usage: ./scripts/backup.sh [--restore <file>]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
ASSETS_VOLUME="escapetwogether-assets"
SESSIONS_VOLUME="escapetwogether-sessions"
RETENTION_COUNT="${BACKUP_RETENTION:-7}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
err() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

# --- Restore mode ---
if [[ "${1:-}" == "--restore" && -n "${2:-}" ]]; then
  ARCHIVE="$2"
  if [[ ! -f "$ARCHIVE" ]]; then
    err "Archive not found: $ARCHIVE"
    exit 1
  fi
  log "Restoring from $ARCHIVE..."
  # Create temp containers to extract into volumes
  docker run --rm -v "$ASSETS_VOLUME":/data -v "$(dirname "$ARCHIVE")":/backup alpine \
    sh -c "cd /data && tar xzf /backup/$(basename "$ARCHIVE") assets/ 2>/dev/null || true"
  docker run --rm -v "$SESSIONS_VOLUME":/data -v "$(dirname "$ARCHIVE")":/backup alpine \
    sh -c "cd /data && tar xzf /backup/$(basename "$ARCHIVE") sessions/ 2>/dev/null || true"
  log "Restore complete. Restart the app to pick up restored data."
  exit 0
fi

# --- Backup ---
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
ARCHIVE="$BACKUP_DIR/escapetwogether-backup-${TIMESTAMP}.tar.gz"

log "Starting backup..."

# Verify volumes exist
for vol in "$ASSETS_VOLUME" "$SESSIONS_VOLUME"; do
  if ! docker volume inspect "$vol" &>/dev/null; then
    err "Docker volume '$vol' not found. Is the app deployed?"
    exit 1
  fi
done

# Create archive from both volumes using temp containers
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

docker run --rm -v "$ASSETS_VOLUME":/data -v "$TMPDIR":/backup alpine \
  sh -c "cd /data && tar czf /backup/assets.tar.gz . 2>/dev/null || (mkdir -p /backup && touch /backup/assets.tar.gz)"
docker run --rm -v "$SESSIONS_VOLUME":/data -v "$TMPDIR":/backup alpine \
  sh -c "cd /data && tar czf /backup/sessions.tar.gz . 2>/dev/null || (mkdir -p /backup && touch /backup/sessions.tar.gz)"

# Combine into single archive
tar -C "$TMPDIR" -czf "$ARCHIVE" assets.tar.gz sessions.tar.gz

SIZE=$(du -h "$ARCHIVE" | cut -f1)
log "Backup created: $ARCHIVE ($SIZE)"

# --- Retention cleanup ---
ls -t "$BACKUP_DIR"/escapetwogether-backup-*.tar.gz 2>/dev/null \
  | tail -n +"$((RETENTION_COUNT + 1))" \
  | while read -r old_backup; do
    rm -f "$old_backup"
    log "Removed old backup: $(basename "$old_backup")"
  done

REMAINING=$(ls -1 "$BACKUP_DIR"/escapetwogether-backup-*.tar.gz 2>/dev/null | wc -l)
log "Backup complete. $REMAINING backup(s) retained (retention: $RETENTION_COUNT)."
