#!/usr/bin/env bash
# Fetches the open-source fonts EMOJI DUST renders with into src/design/fonts/.
# All fonts here are SIL Open Font Licence — free for commercial use including
# embedding into rendered artwork.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/src/design/fonts"
mkdir -p "$DIR"

fetch() {
  local url="$1"
  local out="$DIR/$2"
  if [ -f "$out" ]; then
    echo "  ✓ $2 (already exists)"
    return
  fi
  echo "  → $2"
  curl -sSL -o "$out" "$url"
}

echo "Fetching fonts into $DIR …"

# Fraunces — modern serif with personality (display)
fetch "https://github.com/undercasetype/Fraunces/raw/main/fonts/static/Fraunces/Fraunces-Medium.ttf"        "Fraunces-Medium.ttf"
fetch "https://github.com/undercasetype/Fraunces/raw/main/fonts/static/Fraunces/Fraunces-MediumItalic.ttf"  "Fraunces-MediumItalic.ttf"

# Inter — body / UI
fetch "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.otf" "Inter-Regular.otf.tmp"
fetch "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.otf"  "Inter-Medium.otf.tmp"
# rename otf → ttf for Satori (it accepts both extensions, but our render code looks for ttf)
mv -f "$DIR/Inter-Regular.otf.tmp" "$DIR/Inter-Regular.ttf" 2>/dev/null || true
mv -f "$DIR/Inter-Medium.otf.tmp"  "$DIR/Inter-Medium.ttf"  2>/dev/null || true

# Pacifico — script for the EMOJI DUST signature line
fetch "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf" "Pacifico-Regular.ttf"

echo "Done. Fonts in $DIR:"
ls -lh "$DIR"
