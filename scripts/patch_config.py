#!/usr/bin/env python3
"""Patch config.tsx with custom menus, Earn submenu, FundWallet, indicators."""
import sys

FILE = sys.argv[1]
MARKER = sys.argv[2]

with open(FILE, "r") as f:
    content = f.read()

# 1. Add imports
content = content.replace(
    'import CustomLeftNav from "@/components/CustomLeftNav";',
    f'''import CustomLeftNav from "@/components/CustomLeftNav";
// {MARKER} - Custom imports
import {{ FundWalletButton }} from "@/custom/components/FundWalletButton";
import {{ createLiquidationLevelsIndicator }} from "@/custom/indicators/liquidationLevels";'''
)

# 2. Add children? to MainNavItem
content = content.replace(
    "  target?: string;\n}",
    f"  target?: string;\n  children?: Array<{{ name: string; href: string; description?: string; target?: string; }}>;  // {MARKER}\n}}"
)

# 3. Rename Swap to Spot in ALL_MENU_ITEMS
content = content.replace(
    '{ name: "Swap", href: "/swap", translationKey: "extend.swap" },',
    f'{{ name: "Spot", href: "/swap", translationKey: "extend.swap" }},  // {MARKER} renamed'
)

# 4. Add custom menu items and EARN_SUBMENU_ITEMS
old_end = '  { name: "Points", href: "/points", translationKey: "tradingPoints.points" },\n];\n\nconst DEFAULT_ENABLED_MENUS'
new_end = f'''  {{ name: "Points", href: "/points", translationKey: "tradingPoints.points" }},
  // {MARKER} - Custom menu items
  {{ name: "Aggr", href: "/aggr", translationKey: "extend.aggr" }},
  {{ name: "TapeSurf", href: "/tapesurf", translationKey: "extend.tapesurf" }},
  {{ name: "Staking", href: "/staking", translationKey: "extend.staking" }},
  {{ name: "Multi-screen", href: "/multiscreen", translationKey: "extend.multiscreen" }},
  {{ name: "Calendar", href: "/calendar", translationKey: "extend.calendar" }},
];

// {MARKER} - Earn submenu
const EARN_SUBMENU_ITEMS = [
  {{ name: "Vaults", href: "/vaults", translationKey: "common.vaults" }},
  {{ name: "Staking", href: "/staking", translationKey: "extend.staking" }},
  {{ name: "Points", href: "/points", translationKey: "tradingPoints.points" }},
  {{ name: "Rewards", href: "/rewards", translationKey: "tradingRewards.rewards" }},
];

const DEFAULT_ENABLED_MENUS'''
content = content.replace(old_end, new_end)

# 5. Update DEFAULT_ENABLED_MENUS
old_defaults = '''const DEFAULT_ENABLED_MENUS = [
  { name: "Trading", href: "/", translationKey: "common.trading" },
  { name: "Portfolio", href: "/portfolio", translationKey: "common.portfolio" },
  { name: "Markets", href: "/markets", translationKey: "common.markets" },
  { name: "Swap", href: "/swap", translationKey: "extend.swap" },
  {
    name: "Leaderboard",
    href: "/leaderboard",
    translationKey: "tradingLeaderboard.leaderboard",
  },
];'''

new_defaults = f'''const DEFAULT_ENABLED_MENUS = [
  // {MARKER} - Custom default menus
  {{ name: "Trading", href: "/", translationKey: "common.trading" }},
  {{ name: "Spot", href: "/swap", translationKey: "extend.swap" }},
  {{ name: "Portfolio", href: "/portfolio", translationKey: "common.portfolio" }},
  {{ name: "Markets", href: "/markets", translationKey: "common.markets" }},
  {{ name: "Aggr", href: "/aggr", translationKey: "extend.aggr" }},
  {{ name: "TapeSurf", href: "/tapesurf", translationKey: "extend.tapesurf" }},
  {{
    name: "Leaderboard",
    href: "/leaderboard",
    translationKey: "tradingLeaderboard.leaderboard",
  }},
  {{ name: "Multi-screen", href: "/multiscreen", translationKey: "extend.multiscreen" }},
  {{ name: "Calendar", href: "/calendar", translationKey: "extend.calendar" }},
];'''
content = content.replace(old_defaults, new_defaults)

# 6. Add Earn submenu integration
content = content.replace(
    "const allMenuItems = [...translatedEnabledMenus, ...customMenus];",
    f"""// {MARKER} - Earn submenu integration
    const earnMenu: MainNavItem = {{
      name: "Earn",
      href: "#",
      children: EARN_SUBMENU_ITEMS.map((item) => ({{
        name: t(item.translationKey),
        href: item.href,
        description: t(item.translationKey),
      }})),
    }};
    const menusWithEarn = [
      ...translatedEnabledMenus.slice(0, 4),
      earnMenu,
      ...translatedEnabledMenus.slice(4),
    ];
    const allMenuItems = [...menusWithEarn, ...customMenus];"""
)

# 7. Add FundWalletButton
content = content.replace(
    "{components.accountSummary}",
    f"{{components.accountSummary}}\n            <FundWalletButton />  {{/* {MARKER} */}}"
)

# 8. Add custom indicator
content = content.replace(
    "colorConfig: getColorConfig(),",
    f"colorConfig: getColorConfig(),\n          customIndicatorsGetter: (PineJS: any) => Promise.resolve([createLiquidationLevelsIndicator(PineJS)]),  // {MARKER}"
)

with open(FILE, "w") as f:
    f.write(content)

print("   config.tsx patched")
