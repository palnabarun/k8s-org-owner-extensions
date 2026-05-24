#!/usr/bin/env bash
# Build Chrome and Firefox extension packages from shared/ source.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
SHARED="$ROOT/shared"
BROWSERS=(chrome firefox)
SHARED_FILES=(content.js background.js styles.css)

rm -rf "$DIST"
mkdir -p "$DIST"

for browser in "${BROWSERS[@]}"; do
  dir="$ROOT/$browser"
  if [[ ! -f "$dir/manifest.json" ]]; then
    echo "error: $dir/manifest.json missing" >&2
    exit 1
  fi

  for f in "${SHARED_FILES[@]}"; do
    cp "$SHARED/$f" "$dir/$f"
  done

  files=(manifest.json "${SHARED_FILES[@]}")
  if [[ -d "$ROOT/icons" ]]; then
    rm -rf "$dir/icons"
    cp -R "$ROOT/icons" "$dir/icons"
    files+=(icons)
  fi

  out="$DIST/$browser.zip"
  (cd "$dir" && zip -qr "$out" "${files[@]}")
  echo "built $out"
done

cp "$DIST/firefox.zip" "$DIST/firefox.xpi"
echo "built $DIST/firefox.xpi"

echo
echo "sha256:"
if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$DIST"/*.zip "$DIST"/*.xpi
else
  sha256sum "$DIST"/*.zip "$DIST"/*.xpi
fi
