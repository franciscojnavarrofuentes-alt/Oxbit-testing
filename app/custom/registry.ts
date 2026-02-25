/**
 * PacoDEX Custom Modules Registry
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all custom modules.
 * It lives inside app/custom/ which Orderly NEVER touches.
 * 
 * The inject-custom-modules.sh script reads this registry and
 * patches the Orderly core files (main.tsx, config.tsx, etc.)
 * after each upstream sync.
 */

// ============================================================
// CUSTOM ROUTES
// Define your custom page modules here.
// Each route needs: path, layoutImport, indexImport
// ============================================================
export const CUSTOM_ROUTES = [
  {
    path: 'aggr',
    layoutImport: './custom/pages/aggr/Layout',
    indexImport: './custom/pages/aggr/Index',
  },
  {
    path: 'tapesurf',
    layoutImport: './custom/pages/tapesurf/Layout',
    indexImport: './custom/pages/tapesurf/Index',
  },
  {
    path: 'multiscreen',
    layoutImport: './custom/pages/multiscreen/Layout',
    indexImport: './custom/pages/multiscreen/Index',
  },
  {
    path: 'staking',
    layoutImport: './custom/pages/staking/Layout',
    indexImport: './custom/pages/staking/Index',
  },
  {
    path: 'calendar',
    layoutImport: './custom/pages/calendar/Layout',
    indexImport: './custom/pages/calendar/Index',
  },
];

// ============================================================
// CUSTOM MENU ITEMS
// These get added to ALL_MENU_ITEMS in config.tsx
// ============================================================
export const CUSTOM_MENU_ITEMS = [
  { name: "Aggr", href: "/aggr", translationKey: "extend.aggr" },
  { name: "TapeSurf", href: "/tapesurf", translationKey: "extend.tapesurf" },
  { name: "Multi-screen", href: "/multiscreen", translationKey: "extend.multiscreen" },
  { name: "Staking", href: "/staking", translationKey: "extend.staking" },
  { name: "Calendar", href: "/calendar", translationKey: "extend.calendar" },
];

// ============================================================
// DEFAULT ENABLED MENUS (replaces Orderly's default)
// ============================================================
export const CUSTOM_DEFAULT_MENUS = [
  "Trading",
  "Spot",       // renamed from "Swap"
  "Portfolio",
  "Markets",
  "Aggr",
  "TapeSurf",
  "Leaderboard",
  "Multi-screen",
  "Calendar",
];

// ============================================================
// EARN SUBMENU ITEMS
// ============================================================
export const EARN_SUBMENU_ITEMS = [
  { name: "Vaults", href: "/vaults", translationKey: "common.vaults" },
  { name: "Staking", href: "/staking", translationKey: "extend.staking" },
  { name: "Points", href: "/points", translationKey: "tradingPoints.points" },
  { name: "Rewards", href: "/rewards", translationKey: "tradingRewards.rewards" },
];

// ============================================================
// CUSTOM TRANSLATION KEYS
// These get merged into public/locales/extend/*.json
// ============================================================
export const CUSTOM_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "extend.swap": "Spot",
    "extend.aggr": "Aggr",
    "extend.tapesurf": "TapeSurf",
    "extend.multiscreen": "Multi-screen",
    "extend.earn": "Earn",
    "extend.calendar": "Calendar",
    "extend.staking": "Staking",
  },
  es: {
    "extend.swap": "Spot",
    "extend.aggr": "Aggr",
    "extend.tapesurf": "TapeSurf",
    "extend.multiscreen": "Multi-pantalla",
    "extend.earn": "Ganar",
    "extend.calendar": "Calendario",
    "extend.staking": "Staking",
  },
};
