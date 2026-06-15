// Session Box Drawer
// Draws perfect rectangles for trading sessions using TradingView's
// createMultipointShape API instead of PineJS plots (which produce staircases).
//
// Two strategies:
// 1. Proxy: intercept TradingView.widget constructor (if we patch before it's called)
// 2. Polling: find the widget iframe and access the chart API directly

interface SessionBox {
  startTime: number; // Unix seconds
  endTime: number;
  high: number;
  low: number;
}

// Track drawn shape IDs for cleanup
let drawnShapes: any[] = [];
let currentChart: any = null;

// Session config (UTC hours/minutes)
// 14:30–17:00 Spanish time (CEST/UTC+2) = 12:30–15:00 UTC
const SESSION_START_HOUR = 12;
const SESSION_START_MIN = 30;
const SESSION_END_HOUR = 15;
const SESSION_END_MIN = 0;

const SESSION_START_TOTAL = SESSION_START_HOUR * 60 + SESSION_START_MIN;
const SESSION_END_TOTAL = SESSION_END_HOUR * 60 + SESSION_END_MIN;

function computeSessions(
  data: { schema: any[]; data: any[] }
): SessionBox[] {
  const sessions: SessionBox[] = [];
  let current: SessionBox | null = null;

  // Find column indices
  const timeIdx = data.schema.findIndex(
    (s: any) => s.type === 'time' || s.type === 'userTime'
  );

  let highIdx = -1;
  let lowIdx = -1;
  data.schema.forEach((s: any, i: number) => {
    if (s.type === 'value' && s.sourceType === 'series') {
      if (s.plotTitle === 'high') highIdx = i;
      if (s.plotTitle === 'low') lowIdx = i;
    }
  });

  if (timeIdx === -1 || highIdx === -1 || lowIdx === -1) {
    console.warn('[SessionBoxDrawer] Could not find time/high/low columns in schema:', data.schema);
    return sessions;
  }

  for (const row of data.data) {
    const timestamp = row[timeIdx];
    const high = row[highIdx];
    const low = row[lowIdx];

    if (isNaN(high) || isNaN(low)) continue;

    const date = new Date(timestamp * 1000);
    const utcMin = date.getUTCHours() * 60 + date.getUTCMinutes();

    const inSession =
      SESSION_END_TOTAL > SESSION_START_TOTAL
        ? utcMin >= SESSION_START_TOTAL && utcMin < SESSION_END_TOTAL
        : utcMin >= SESSION_START_TOTAL || utcMin < SESSION_END_TOTAL;

    if (inSession) {
      if (!current) {
        current = { startTime: timestamp, endTime: timestamp, high, low };
      } else {
        current.high = Math.max(current.high, high);
        current.low = Math.min(current.low, low);
        current.endTime = timestamp;
      }
    } else if (current) {
      sessions.push(current);
      current = null;
    }
  }

  if (current) sessions.push(current);
  console.log(`[SessionBoxDrawer] Found ${sessions.length} sessions`);
  return sessions;
}

function clearShapes(chart: any) {
  for (const id of drawnShapes) {
    try {
      chart.removeEntity(id);
    } catch (_) {}
  }
  drawnShapes = [];
}

async function drawSessionBoxes(chart: any) {
  try {
    const data = await chart.exportData({
      includeTime: true,
      includedStudies: [],
    });

    console.log('[SessionBoxDrawer] exportData schema:', data.schema?.map((s: any) => s.plotTitle || s.type));
    console.log('[SessionBoxDrawer] exportData rows:', data.data?.length);

    const sessions = computeSessions(data);

    for (const session of sessions) {
      const id = chart.createMultipointShape(
        [
          { time: session.startTime, price: session.high },
          { time: session.endTime, price: session.low },
        ],
        {
          shape: 'rectangle',
          lock: true,
          disableSelection: true,
          disableSave: true,
          disableUndo: true,
          overrides: {
            backgroundColor: 'rgba(255, 255, 255, 0.10)',
            color: 'rgba(255, 255, 255, 0.40)',
            linewidth: 1,
            fillBackground: true,
            drawBorder: true,
          },
        }
      );
      if (id != null) {
        drawnShapes.push(id);
      } else {
        console.warn('[SessionBoxDrawer] createMultipointShape returned null for session', session);
      }
    }
    console.log(`[SessionBoxDrawer] Drew ${drawnShapes.length} boxes`);
  } catch (e) {
    console.warn('[SessionBoxDrawer] Failed to draw session boxes:', e);
  }
}

async function redraw(chart: any) {
  clearShapes(chart);
  await drawSessionBoxes(chart);
}

function hookIntoChart(chart: any) {
  if (currentChart === chart) return; // Already hooked
  currentChart = chart;

  console.log('[SessionBoxDrawer] Hooked into chart, drawing initial boxes...');

  // Initial draw — wait a bit for data to be ready
  setTimeout(() => redraw(chart), 1000);

  // Redraw on data loaded (scroll/zoom loads more bars)
  try {
    chart.onDataLoaded().subscribe(null, () => redraw(chart));
  } catch (_) {}

  // Redraw on symbol change
  try {
    chart.onSymbolChanged().subscribe(null, () => {
      setTimeout(() => redraw(chart), 1000);
    });
  } catch (_) {}

  // Redraw on interval change
  try {
    chart.onIntervalChanged().subscribe(null, () => {
      setTimeout(() => redraw(chart), 1000);
    });
  } catch (_) {}
}

/**
 * Install the session box drawer.
 * Uses two strategies:
 * 1. Try to Proxy TradingView.widget before it's constructed
 * 2. Poll for an existing widget instance via the iframe
 */
export function installSessionBoxDrawer() {
  if (typeof window === 'undefined') return;
  if ((window as any).__SESSION_BOX_INSTALLED__) return;
  (window as any).__SESSION_BOX_INSTALLED__ = true;

  console.log('[SessionBoxDrawer] Installing...');

  // Strategy 1: Wrap the constructor (works if we patch before it's called)
  const tryWrap = setInterval(() => {
    const TV = (window as any).TradingView;
    if (!TV?.widget || (window as any).__TV_WIDGET_WRAPPED__) return;
    clearInterval(tryWrap);

    console.log('[SessionBoxDrawer] Wrapping TradingView.widget constructor');
    const OrigWidget = TV.widget;
    (window as any).__TV_WIDGET_WRAPPED__ = true;

    // Replace with a wrapper function that calls original via `new`
    const WrappedWidget = function (this: any, ...args: any[]) {
      const instance = new OrigWidget(...args);
      console.log('[SessionBoxDrawer] Widget constructed via wrapper');

      // Store instance globally
      (window as any).__TV_WIDGET_INSTANCE__ = instance;

      instance.onChartReady(() => {
        console.log('[SessionBoxDrawer] Chart ready (via wrapper)');
        hookIntoChart(instance.activeChart());
      });

      return instance;
    } as any;

    // Preserve prototype so instanceof checks work
    WrappedWidget.prototype = OrigWidget.prototype;

    TV.widget = WrappedWidget;
  }, 50);

  // Strategy 2: Poll for widget instance (fallback if Proxy was too late)
  const pollForWidget = setInterval(() => {
    // Check if we already have a chart hooked
    if (currentChart) {
      clearInterval(pollForWidget);
      return;
    }

    // Check for widget instance stored by Proxy
    const instance = (window as any).__TV_WIDGET_INSTANCE__;
    if (instance) {
      try {
        instance.onChartReady(() => {
          console.log('[SessionBoxDrawer] Chart ready (via poll, stored instance)');
          hookIntoChart(instance.activeChart());
        });
        clearInterval(pollForWidget);
        return;
      } catch (_) {}
    }

    // Check for widget via iframe - TradingView creates iframes with specific IDs
    const iframes = document.querySelectorAll('iframe[id^="tradingview"]');
    if (iframes.length > 0) {
      // The widget might be accessible through the iframe's parent element
      const container = iframes[0]?.parentElement;
      if (container && (container as any).__widget) {
        const widget = (container as any).__widget;
        try {
          widget.onChartReady(() => {
            console.log('[SessionBoxDrawer] Chart ready (via iframe)');
            hookIntoChart(widget.activeChart());
          });
          clearInterval(pollForWidget);
        } catch (_) {}
      }
    }
  }, 500);

  // Stop polling after 30s
  setTimeout(() => {
    clearInterval(tryWrap);
    clearInterval(pollForWidget);
    if (!currentChart) {
      console.warn('[SessionBoxDrawer] Could not find TradingView widget after 30s');
    }
  }, 30000);
}
