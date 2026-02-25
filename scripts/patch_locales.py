#!/usr/bin/env python3
"""Patch locale JSON files with custom translation keys."""
import json
import sys
import os

LOCALES_DIR = sys.argv[1]

# Default (English) values for all languages
CUSTOM_KEYS = {
    "extend.swap": "Spot",
    "extend.aggr": "Aggr",
    "extend.tapesurf": "TapeSurf",
    "extend.multiscreen": "Multi-screen",
    "extend.earn": "Earn",
    "extend.calendar": "Calendar",
    "extend.staking": "Staking",
}

# Language-specific overrides
LANG_OVERRIDES = {
    "es": {
        "extend.earn": "Ganar",
        "extend.calendar": "Calendario",
    },
}

for filename in os.listdir(LOCALES_DIR):
    if not filename.endswith(".json"):
        continue

    lang = filename.replace(".json", "")
    filepath = os.path.join(LOCALES_DIR, filename)

    with open(filepath, "r") as f:
        data = json.load(f)

    changed = False
    for key, value in CUSTOM_KEYS.items():
        # Use language-specific override if available
        final_value = LANG_OVERRIDES.get(lang, {}).get(key, value)
        if key not in data or key == "extend.swap":
            data[key] = final_value
            changed = True

    if changed:
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

print("   Locales patched")
