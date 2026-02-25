#!/usr/bin/env python3
"""Patch main.tsx to add custom module routes and imports."""
import re
import sys

FILE = sys.argv[1]
MARKER = sys.argv[2]

with open(FILE, "r") as f:
    content = f.read()

# 1) Add lazy imports after PointsIndex
custom_imports = f"""

// {MARKER} - Custom module imports
const AggrLayout = lazy(() => import('./custom/pages/aggr/Layout'));
const AggrIndex = lazy(() => import('./custom/pages/aggr/Index'));
const TapeSurfLayout = lazy(() => import('./custom/pages/tapesurf/Layout'));
const TapeSurfIndex = lazy(() => import('./custom/pages/tapesurf/Index'));
const MultiScreenLayout = lazy(() => import('./custom/pages/multiscreen/Layout'));
const MultiScreenIndex = lazy(() => import('./custom/pages/multiscreen/Index'));
const StakingLayout = lazy(() => import('./custom/pages/staking/Layout'));
const StakingIndex = lazy(() => import('./custom/pages/staking/Index'));
const CalendarLayout = lazy(() => import('./custom/pages/calendar/Layout'));
const CalendarIndex = lazy(() => import('./custom/pages/calendar/Index'));"""

content = content.replace(
    "const PointsIndex = lazy(() => import('./pages/points/Index'));",
    "const PointsIndex = lazy(() => import('./pages/points/Index'));" + custom_imports,
)

# 2) Add custom routes after the points route
custom_routes = f"""
      // {MARKER} - Custom routes
      {{
        path: 'aggr',
        element: <AggrLayout />,
        children: [
          {{ index: true, element: <AggrIndex /> }},
        ],
      }},
      {{
        path: 'tapesurf',
        element: <TapeSurfLayout />,
        children: [
          {{ index: true, element: <TapeSurfIndex /> }},
        ],
      }},
      {{
        path: 'multiscreen',
        element: <MultiScreenLayout />,
        children: [
          {{ index: true, element: <MultiScreenIndex /> }},
        ],
      }},
      {{
        path: 'staking',
        element: <StakingLayout />,
        children: [
          {{ index: true, element: <StakingIndex /> }},
        ],
      }},
      {{
        path: 'calendar',
        element: <CalendarLayout />,
        children: [
          {{ index: true, element: <CalendarIndex /> }},
        ],
      }},"""

# Find the points route block: path: 'points', ... children: [...], },
# The block ends with "      }," (6-space indent closing brace)
points_match = re.search(
    r"(\{\s*path:\s*'points',\s*element:.*?children:\s*\[.*?\],\s*\},)",
    content,
    re.DOTALL,
)
if points_match:
    pos = points_match.end()
    content = content[:pos] + custom_routes + content[pos:]
else:
    print("WARNING: Could not find points route block", file=sys.stderr)
    # Fallback: insert before the closing "],\n  },"
    fallback = re.search(r"(\s*\],\s*\},\s*\],\s*\{[^}]*basename)", content)
    if fallback:
        pos = fallback.start()
        content = content[:pos] + custom_routes + content[pos:]
        print("   Used fallback insertion point")

with open(FILE, "w") as f:
    f.write(content)

print("   main.tsx patched")
