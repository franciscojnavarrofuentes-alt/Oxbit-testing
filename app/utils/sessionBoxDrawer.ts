// Session Box Drawer
// Draws perfect rectangles for trading sessions using TradingView's
// createMultipointShape API instead of PineJS plots (which produce staircases).
//
// Strategies:
// 1. Object.defineProperty trap — intercept TradingView.widget at assignment time
// 2. Polling — find the widget instance via __TV_WIDGET_INSTANCE__ or DOM scanning

interface SessionBox {
  startTime: number; // Unix seconds
  endTime: number;
  high: number;
  low: number;
}

// Track drawn shape IDs for cleanup
let drawnShapes: any[] = [];
let currentChart: any = null;
let boxesDrawn = false;

// Heartbeat — shared via module scope (avoids cross-iframe window issues)
let _heartbeat = 0;
export function sessionBoxHeartbeat() {
  _heartbeat = Date.now();
}

// Session config (UTC hours/minutes)
// 14:30–16:00 Spanish time (CEST/UTC+2) = 12:30–14:00 UTC
const SESSION_START_HOUR = 12;
const SESSION_START_MIN = 30;
const SESSION_END_HOUR = 14;
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
  boxesDrawn = drawnShapes.length > 0;
}

function isHeartbeatActive(): boolean {
  // PineJS main() runs synchronously across all bars, then periodically
  // on new ticks. Use a generous 30s window to avoid false negatives.
  return _heartbeat > 0 && Date.now() - _heartbeat < 30000;
}

function hookIntoChart(chart: any) {
  if (currentChart === chart) return; // Already hooked
  currentChart = chart;

  console.log('[SessionBoxDrawer] Hooked into chart, waiting for indicator heartbeat...');

  // Heartbeat toggle: check every 2s if the indicator is active
  setInterval(() => {
    const active = isHeartbeatActive();
    if (active && !boxesDrawn) {
      console.log('[SessionBoxDrawer] Indicator active, drawing boxes...');
      redraw(chart);
    } else if (!active && boxesDrawn) {
      console.log('[SessionBoxDrawer] Indicator removed, clearing boxes...');
      clearShapes(chart);
      boxesDrawn = false;
    }
  }, 2000);

  // Redraw on data loaded (scroll/zoom loads more bars)
  try {
    chart.onDataLoaded().subscribe(null, () => {
      if (isHeartbeatActive()) redraw(chart);
    });
  } catch (_) {}

  // Redraw on symbol change
  try {
    chart.onSymbolChanged().subscribe(null, () => {
      if (isHeartbeatActive()) setTimeout(() => redraw(chart), 1000);
    });
  } catch (_) {}

  // Redraw on interval change
  try {
    chart.onIntervalChanged().subscribe(null, () => {
      if (isHeartbeatActive()) setTimeout(() => redraw(chart), 1000);
    });
  } catch (_) {}
}

function onWidgetCreated(instance: any) {
  (window as any).__TV_WIDGET_INSTANCE__ = instance;
  console.log('[SessionBoxDrawer] Widget instance captured, polling for chart...');

  // Poll activeChart() — more reliable than onChartReady
  const poll = setInterval(() => {
    if (currentChart) {
      clearInterval(poll);
      return;
    }
    try {
      const chart = instance.activeChart();
      if (chart) {
        console.log('[SessionBoxDrawer] Chart found via activeChart() poll');
        clearInterval(poll);
        hookIntoChart(chart);
      }
    } catch (_) {}
  }, 500);

  // Also try onChartReady as backup
  try {
    instance.onChartReady(() => {
      if (currentChart) return;
      console.log('[SessionBoxDrawer] Chart ready via onChartReady');
      hookIntoChart(instance.activeChart());
    });
  } catch (_) {}

  setTimeout(() => clearInterval(poll), 60000);
}

function wrapWidgetConstructor(OrigWidget: any): any {
  if (OrigWidget.__sessionBoxWrapped__) return OrigWidget;

  const Wrapped = function (this: any, ...args: any[]) {
    const instance = new OrigWidget(...args);
    console.log('[SessionBoxDrawer] Widget constructed via wrapper');
    onWidgetCreated(instance);
    return instance;
  } as any;

  Wrapped.prototype = OrigWidget.prototype;
  Wrapped.__sessionBoxWrapped__ = true;
  return Wrapped;
}

/**
 * Install the session box drawer.
 * Uses Object.defineProperty to intercept TradingView.widget at assignment time,
 * plus polling as fallback to find the widget after creation.
 */
export function installSessionBoxDrawer() {
  if (typeof window === 'undefined') return;
  if ((window as any).__SESSION_BOX_INSTALLED__) return;
  (window as any).__SESSION_BOX_INSTALLED__ = true;

  console.log('[SessionBoxDrawer] Installing...');

  // --- Strategy 1: Object.defineProperty trap ---
  // Intercept TradingView.widget the moment it's assigned, BEFORE any code
  // can capture a reference to the original constructor.

  function trapWidgetProperty(tv: any) {
    if (!tv || tv.__sessionBoxTrapped__) return;
    tv.__sessionBoxTrapped__ = true;

    // If widget already exists, wrap it immediately
    let _widget = tv.widget;
    if (_widget) {
      console.log('[SessionBoxDrawer] TradingView.widget already exists, wrapping immediately');
      _widget = wrapWidgetConstructor(_widget);
    }

    try {
      Object.defineProperty(tv, 'widget', {
        get() {
          return _widget;
        },
        set(val: any) {
          console.log('[SessionBoxDrawer] TradingView.widget assigned, wrapping');
          _widget = wrapWidgetConstructor(val);
        },
        configurable: true,
        enumerable: true,
      });
    } catch (e) {
      // If defineProperty fails, fall back to direct assignment
      console.warn('[SessionBoxDrawer] Could not trap widget property:', e);
      if (_widget) tv.widget = _widget;
    }
  }

  // Trap window.TradingView itself with getter/setter
  const existingTV = (window as any).TradingView;
  let _tv = existingTV;

  if (existingTV) {
    trapWidgetProperty(existingTV);
  }

  try {
    Object.defineProperty(window, 'TradingView', {
      get() {
        return _tv;
      },
      set(val: any) {
        console.log('[SessionBoxDrawer] window.TradingView assigned');
        _tv = val;
        if (val) trapWidgetProperty(val);
      },
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    console.warn('[SessionBoxDrawer] Could not trap window.TradingView:', e);
  }

  // --- Strategy 2: Poll for widget instance ---
  // Fallback if the defineProperty trap didn't catch the constructor
  // (e.g. widget was already created before install was called).
  const pollForWidget = setInterval(() => {
    if (currentChart) {
      clearInterval(pollForWidget);
      return;
    }

    // Check for stored widget instance
    const instance = (window as any).__TV_WIDGET_INSTANCE__;
    if (instance) {
      try {
        const chart = instance.activeChart();
        if (chart) {
          console.log('[SessionBoxDrawer] Chart found via poll (stored instance)');
          clearInterval(pollForWidget);
          hookIntoChart(chart);
          return;
        }
      } catch (_) {}
    }

    // Scan window properties for any object with activeChart method
    try {
      for (const key of Object.getOwnPropertyNames(window)) {
        if (key.startsWith('__') || key === 'self' || key === 'window' || key === 'globalThis') continue;
        try {
          const val = (window as any)[key];
          if (
            val &&
            typeof val === 'object' &&
            typeof val.activeChart === 'function' &&
            typeof val.onChartReady === 'function'
          ) {
            console.log(`[SessionBoxDrawer] Found widget on window.${key}`);
            onWidgetCreated(val);
            clearInterval(pollForWidget);
            return;
          }
        } catch (_) {}
      }
    } catch (_) {}
  }, 2000);

  // Stop polling after 120s
  setTimeout(() => {
    clearInterval(pollForWidget);
    if (!currentChart) {
      console.warn('[SessionBoxDrawer] Could not find TradingView widget after 120s');
    }
  }, 120000);
}
