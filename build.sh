#!/usr/bin/env bash
# Build an installable SMF theme zip with the version stamped in.
# Does not mutate the source tree — stamping happens in the staging directory only.
# Single source of truth for packaging (used by release.yml and ci.yml).
#
# Usage: ./build.sh <version> [dist_dir]
#   Prints the path of the generated zip on the last line.
set -euo pipefail

VERSION="${1:?Usage: build.sh <version> [dist_dir]}"
DIST="${2:-dist}"
THEME_NAME="siduction"

ROOT="$(cd "$(dirname "$0")" && pwd)"
STAGE="${DIST}/${THEME_NAME}"

# Portable in-place replacement (GNU and BSD sed): write to tmp, then mv.
stamp() {  # stamp <file> <sed-expr>
  sed -E "$2" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
}

rm -rf "$DIST"
mkdir -p "$STAGE"

# Mirror theme files into staging.
#   /.*       = strip all hidden top-level entries (VCS, CI, editor/tooling/OS dirs).
#               The '/' anchor only matches the top level, so scripts/.htaccess is kept.
#   .DS_Store = remove from subdirectories too.
rsync -a \
  --exclude='/.*' \
  --exclude='.DS_Store' \
  --exclude='deploy.sh' --exclude='build.sh' --exclude='dist' \
  "${ROOT}/" "$STAGE/"

# Stamp the version (staging only).
stamp "${STAGE}/theme_info.xml"      "s|<version>[^<]*</version>|<version>${VERSION}</version>|"
stamp "${STAGE}/index.template.php"  "s|(@version[[:space:]]+).*|\1${VERSION}|"

# Zip with the enclosing siduction/ directory.
( cd "$DIST" && zip -r -q "${THEME_NAME}-${VERSION}.zip" "$THEME_NAME" )

echo "${DIST}/${THEME_NAME}-${VERSION}.zip"
