#!/usr/bin/env bash
# Baut das installierbare SMF-Theme-Zip mit eingebrannter Version.
# Mutiert den Quellbaum NICHT — gestempelt wird nur im Staging-Verzeichnis.
# Einzige Quelle der Wahrheit fürs Packaging (von release.yml UND ci.yml genutzt).
#
# Usage: ./build.sh <version> [dist_dir]
#   Gibt auf der letzten Zeile den Pfad zum erzeugten Zip aus.
set -euo pipefail

VERSION="${1:?Usage: build.sh <version> [dist_dir]}"
DIST="${2:-dist}"
THEME_NAME="siduction"

ROOT="$(cd "$(dirname "$0")" && pwd)"
STAGE="${DIST}/${THEME_NAME}"

# Portable In-Place-Ersetzung (GNU- und BSD-sed): in Temp schreiben, dann mv.
stamp() {  # stamp <datei> <sed-expr>
  sed -E "$2" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
}

rm -rf "$DIST"
mkdir -p "$STAGE"

# Theme-Dateien ins Staging spiegeln.
#   /.*       = alle versteckten Top-Level-Einträge raus (VCS, CI, Editor-/Tooling-/OS-Verzeichnisse).
#               Anker '/' trifft nur die oberste Ebene, scripts/.htaccess bleibt also erhalten.
#   .DS_Store = auch in Unterordnern raus
rsync -a \
  --exclude='/.*' \
  --exclude='.DS_Store' \
  --exclude='deploy.sh' --exclude='build.sh' --exclude='dist' \
  "${ROOT}/" "$STAGE/"

# Version einbrennen (nur im Staging)
stamp "${STAGE}/theme_info.xml"      "s|<version>[^<]*</version>|<version>${VERSION}</version>|"
stamp "${STAGE}/index.template.php"  "s|(@version[[:space:]]+).*|\1${VERSION}|"

# Zip mit umschließendem siduction/-Ordner
( cd "$DIST" && zip -r -q "${THEME_NAME}-${VERSION}.zip" "$THEME_NAME" )

echo "${DIST}/${THEME_NAME}-${VERSION}.zip"
