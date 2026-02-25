#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MARKER="@PACODEX_CUSTOM"

echo "🔧 PacoDEX Custom Module Injection"
echo "   Project root: $PROJECT_ROOT"

has_marker() { grep -q "$MARKER" "$1" 2>/dev/null; }

# 1. main.tsx
patch_main_tsx() {
  local F="$PROJECT_ROOT/app/main.tsx"
  has_marker "$F" && { echo "   ✅ main.tsx already patched"; return; }
  echo "   📝 Patching main.tsx..."
  python3 "$SCRIPT_DIR/patch_main.py" "$F" "$MARKER"
}

# 2. config.tsx
patch_config_tsx() {
  local F="$PROJECT_ROOT/app/utils/config.tsx"
  has_marker "$F" && { echo "   ✅ config.tsx already patched"; return; }
  echo "   📝 Patching config.tsx..."
  python3 "$SCRIPT_DIR/patch_config.py" "$F" "$MARKER"
}

# 3. index.css
patch_index_css() {
  local F="$PROJECT_ROOT/app/styles/index.css"
  has_marker "$F" && { echo "   ✅ index.css already patched"; return; }
  echo "   📝 Patching index.css..."
  echo "" >> "$F"
  echo "/* $MARKER - Custom styles */" >> "$F"
  echo "@import '../custom/styles/custom.css';" >> "$F"
}

# 4. privyConnector.tsx
patch_privy_connector() {
  local F="$PROJECT_ROOT/app/components/orderlyProvider/privyConnector.tsx"
  has_marker "$F" && { echo "   ✅ privyConnector.tsx already patched"; return; }
  echo "   📝 Patching privyConnector.tsx..."
  python3 "$SCRIPT_DIR/patch_privy.py" "$F" "$MARKER"
}

# 5. swap/Index.tsx
patch_swap_index() {
  local F="$PROJECT_ROOT/app/pages/swap/Index.tsx"
  has_marker "$F" && { echo "   ✅ swap/Index.tsx already patched"; return; }
  echo "   📝 Patching swap/Index.tsx..."
  sed -i "s/generatePageTitle(\"Swap\")/generatePageTitle(\"Spot\") \/\/ $MARKER/" "$F"
}

# 6. locales
patch_locales() {
  echo "   📝 Patching locale files..."
  python3 "$SCRIPT_DIR/patch_locales.py" "$PROJECT_ROOT/public/locales/extend"
  echo "   ✅ Locales patched"
}

echo ""
echo "🚀 Running injections..."
echo ""
patch_main_tsx
patch_config_tsx
patch_index_css
patch_privy_connector
patch_swap_index
patch_locales
echo ""
echo "✅ All custom modules injected successfully!"
