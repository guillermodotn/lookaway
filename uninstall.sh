#!/usr/bin/env bash
#
# uninstall.sh - Remove the LookAway GNOME Shell extension
#
set -euo pipefail

EXT_UUID="lookaway@gnome-extension"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/${EXT_UUID}"

echo "==> Uninstalling LookAway extension..."

# 1. Disable the extension first
if command -v gnome-extensions &>/dev/null; then
    gnome-extensions disable "${EXT_UUID}" 2>/dev/null || true
    echo "    Extension disabled."
fi

# 2. Remove the extension directory
if [ -d "${EXT_DIR}" ]; then
    rm -rf "${EXT_DIR}"
    echo "    Extension files removed."
else
    echo "    Extension directory not found; nothing to remove."
fi

echo ""
echo "==> Uninstall complete. Log out/in or restart GNOME Shell to finish."
echo ""
