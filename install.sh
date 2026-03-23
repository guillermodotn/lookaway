#!/usr/bin/env bash
#
# install.sh - Install the LookAway GNOME Shell extension
#
set -euo pipefail

EXT_UUID="lookaway@gnome-extension"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/${EXT_UUID}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Installing LookAway extension..."

# 1. Create target directory
mkdir -p "${EXT_DIR}"

# 2. Copy extension files
cp "${SCRIPT_DIR}/metadata.json"   "${EXT_DIR}/"
cp "${SCRIPT_DIR}/extension.js"    "${EXT_DIR}/"
cp "${SCRIPT_DIR}/prefs.js"        "${EXT_DIR}/"
cp "${SCRIPT_DIR}/stylesheet.css"  "${EXT_DIR}/"

# 3. Copy and compile GSettings schema
mkdir -p "${EXT_DIR}/schemas"
cp "${SCRIPT_DIR}/schemas/"*.gschema.xml "${EXT_DIR}/schemas/"
glib-compile-schemas "${EXT_DIR}/schemas/"
echo "    Schemas compiled."

# 4. Enable the extension (will take effect on next login or restart)
if command -v gnome-extensions &>/dev/null; then
    gnome-extensions enable "${EXT_UUID}" 2>/dev/null || true
    echo "    Extension enabled via gnome-extensions CLI."
fi

echo ""
echo "==> Installation complete!"
echo ""
echo "To activate the extension now, either:"
echo "  1. Log out and log back in, or"
echo "  2. Press Alt+F2, type 'r', and press Enter (X11 only), or"
echo "  3. Run:  gnome-extensions enable ${EXT_UUID}"
echo ""
echo "To open preferences:"
echo "  gnome-extensions prefs ${EXT_UUID}"
echo ""
