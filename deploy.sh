#!/usr/bin/env bash
set -euo pipefail

# ===== CONFIG ====================================================
REPO="siduction/smf-theme-siduction"
THEMES_DIR="/srv/instances/siduction/web/forum.siduction.org/Themes"
THEME_NAME="siduction"
OWNER="siduction"
GROUP="siduction"
BACKUP_DIR="$(dirname "$THEMES_DIR")/.theme-backups"   # outside Themes/ so SMF doesn't scan it as a theme
KEEP_BACKUPS=5
CACHE_FLUSH_SCRIPT="/srv/instances/siduction/web/forum.siduction.org/smf-cache-flush.php"
# =================================================================

# Usage: ./deploy.sh [--force] [tag]
#   ./deploy.sh            -> latest release (only if newer than installed)
#   ./deploy.sh v1.2       -> specific tag (only if different from installed)
#   ./deploy.sh --force    -> re-deploy even if the version matches
FORCE=0
TAG="latest"
for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=1 ;;
    *)          TAG="$arg" ;;
  esac
done

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
err() { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# Read <version> from a theme_info.xml (empty if unreadable or missing).
read_version() {
  grep -o '<version>[^<]*</version>' "$1" 2>/dev/null | sed -E 's|</?version>||g' | head -n1 || true
}

[ "$(id -u)" -eq 0 ] || err "Please run as root (needed for chown ${OWNER}:${GROUP})."
command -v curl  >/dev/null || err "curl is required."
command -v unzip >/dev/null || err "unzip is required."

THEME_DIR="${THEMES_DIR}/${THEME_NAME}"

# Determine currently installed version.
CURRENT_VERSION=""
if [ -f "$THEME_DIR/theme_info.xml" ]; then
  CURRENT_VERSION="$(read_version "$THEME_DIR/theme_info.xml")"
fi

# Fetch release info (asset URL + tag/version).
if [ "$TAG" = "latest" ]; then
  API="https://api.github.com/repos/${REPO}/releases/latest"
else
  API="https://api.github.com/repos/${REPO}/releases/tags/${TAG}"
fi
log "Fetching release info ($TAG)..."
API_JSON="$(curl -fsSL "$API")"
ASSET_URL="$(printf '%s' "$API_JSON" \
  | grep -o '"browser_download_url": *"[^"]*\.zip"' | head -n1 | cut -d'"' -f4)"
RELEASE_TAG="$(printf '%s' "$API_JSON" \
  | grep -o '"tag_name": *"[^"]*"' | head -n1 | cut -d'"' -f4)"
[ -n "$ASSET_URL" ]   || err "No .zip asset found in release '$TAG'."
RELEASE_VERSION="${RELEASE_TAG#v}"   # v1.2 -> 1.2

# Skip deploy if already on this version (unless --force).
if [ "$FORCE" -eq 0 ] && [ -n "$CURRENT_VERSION" ] && [ "$CURRENT_VERSION" = "$RELEASE_VERSION" ]; then
  log "Already on v${RELEASE_VERSION} — nothing to do. (Use --force to re-deploy.)"
  exit 0
fi
log "Installed: v${CURRENT_VERSION:-none}  ->  Release: v${RELEASE_VERSION}"

# From here on we actually deploy.
TMP="$(mktemp -d "${THEMES_DIR}/.deploy.XXXXXX")"   # same partition -> atomic mv + ACL inheritance
trap 'rm -rf "$TMP"' EXIT

log "Downloading $ASSET_URL"
curl -fsSL "$ASSET_URL" -o "$TMP/theme.zip"

# Extract and validate.
unzip -q "$TMP/theme.zip" -d "$TMP/extract"
NEW="$TMP/extract/${THEME_NAME}"
[ -f "$NEW/theme_info.xml" ] || err "Zip does not contain ${THEME_NAME}/theme_info.xml."
VERSION="$(read_version "$NEW/theme_info.xml")"
log "New version: ${VERSION:-unknown}"

# Set owner and permissions (dirs 2750 / files 640).
chown -R "${OWNER}:${GROUP}" "$NEW"
find "$NEW" -type d -exec chmod 2750 {} +
find "$NEW" -type f -exec chmod 640  {} +

# Back up the current theme (backup name = backed-up version).
if [ -d "$THEME_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  if [ -n "$CURRENT_VERSION" ]; then
    BACKUP="${BACKUP_DIR}/${THEME_NAME}-v${CURRENT_VERSION}"
  else
    BACKUP="${BACKUP_DIR}/${THEME_NAME}-unknown"
  fi
  [ -e "$BACKUP" ] && BACKUP="${BACKUP}-$(date +%Y%m%d-%H%M%S)"   # collision -> append timestamp
  log "Backing up current theme (v${CURRENT_VERSION:-unknown}) -> $BACKUP"
  mv "$THEME_DIR" "$BACKUP"
fi

# Move into place (atomic, same partition).
mv "$NEW" "$THEME_DIR"
log "Deployed to $THEME_DIR"

# Prune old backups (keep the newest KEEP_BACKUPS by mtime).
if [ -d "$BACKUP_DIR" ]; then
  # Backup names are controlled (siduction-vX.Y[-timestamp]), so ls is safe here.
  # shellcheck disable=SC2012
  ls -1dt "${BACKUP_DIR}/${THEME_NAME}-"* 2>/dev/null \
    | tail -n +$((KEEP_BACKUPS+1)) | xargs -r rm -rf
fi

# Flush the SMF cache (as ${OWNER} since the script runs as root).
if [ -n "$CACHE_FLUSH_SCRIPT" ] && [ -f "$CACHE_FLUSH_SCRIPT" ]; then
  log "Flushing SMF cache..."
  runuser -u "$OWNER" -- php "$CACHE_FLUSH_SCRIPT" \
    || err "Cache flush failed (deploy succeeded though)."
else
  log "Note: cache flush script not found ($CACHE_FLUSH_SCRIPT) — skipped."
fi

log "Done (v${VERSION})."
