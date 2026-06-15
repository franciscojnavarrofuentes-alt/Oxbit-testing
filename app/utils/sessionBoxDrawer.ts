// Session Box Drawer
// Draws perfect rectangles for trading sessions using TradingView's
// createMultipointShape API instead of PineJS plots (which produce staircases).
//
// Usage: call installSessionBoxDrawer() before the TradingView widget is created.
// It intercepts the widget constructor and draws session boxes on chart ready.

interface SessionBox {
  startTime: number; // Unix seconds
  endTime: number;
  high: number;
  low: number;
}

// Track drawn shape IDs per chart for cleanup
const drawnShapes: string[] = [];

// Session config (UTC hours/minutes)
const SESSION_START_HOUR = 14;
const SESSION_START_MIN = 30;
const SESSION_END_HOUR = 16;
const SESSION_END_MIN = 0;

const SESSION_START_TOTAL = SESSION_START_HOUR * 60 + SESSION_START_MIN;
const SESSION_END_TOTAL = SESSION_END_HOUR * 60 + SESSION_END_MIN;

function computeSessions(
  data: { schema: any[]; data: any[] },
  useUserTime: boolean
): SessionBox[] {
  const sessions: SessionBox[] = [];
  let current: SessionBox | null = null;

  // Find time column index
  const timeIdx = data.schema.findIndex(
    (s: any) => s.type === 'time' || s.type === 'userTime'
  );
  // Series columns: open, high, low, close (after time)
  const seriesStart = data.schema.findIndex(
    (s: any) => s.type === 'value' && s.sourceType === 'series'
  );

  if (timeIdx === -1 || seriesStart === -1) return sessions;

  // Find high and low column indices
  let highIdx = -1;
  let lowIdx = -1;
  data.schema.forEach((s: any, i: number) => {
    if (s.type === 'value' && s.sourceType === 'series') {
      if (s.plotTitle === 'high') highIdx = i;
      if (s.plotTitle === 'low') lowIdx = i;
    }
  });

  if (highIdx === -1 || lowIdx === -1) return sessions;

  for (const row of data.data) {
    const timestamp = row[timeIdx]; // Unix seconds
    const high = row[highIdx];
    const low = row[lowIdx];

    if (isNaN(high) || isNaN(low)) continue;

    // Convert to UTC date to check session window
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
  return sessions;
}

function clearShapes(chart: any) {
  for (const id of drawnShapes) {
    try {
      chart.removeEntity(id);
    } catch (_) {
      // Shape may already be removed
    }
  }
  drawnShapes.length = 0;
}

async function drawSessionBoxes(chart: any) {
  try {
    const data = await chart.exportData({
      includeTime: true,
      includedStudies: [],
    });

    const sessions = computeSessions(data, false);

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
      if (id != null) drawnShapes.push(id);
    }
  } catch (e) {
    console.warn('[SessionBoxDrawer] Failed to draw session boxes:', e);
  }
}

async function redraw(chart: any) {
  clearShapes(chart);
  await drawSessionBoxes(chart);
}

/**
 * Install the session box drawer.
 * Call this once before the TradingView widget is created.
 * It patches the TradingView.widget constructor to hook into onChartReady.
 */
export function installSessionBoxDrawer() {
  if (typeof window === 'undefined') return;
  if ((window as any).__SESSION_BOX_INSTALLED__) return;

  const waitForTV = setInterval(() => {
    const TV = (window as any).TradingView;
    if (!TV?.widget) return;

    // Only patch once
    if ((window as any).__TV_WIDGET_ORIG__) return;
    clearInterval(waitForTV);

    const OrigWidget = TV.widget;
    (window as any).__TV_WIDGET_ORIG__ = OrigWidget;

    TV.widget = new Proxy(OrigWidget, {
      construct(Target: any, args: any[]) {
        const instance = Reflect.construct(Target, args);

        instance.onChartReady(() => {
          const chart = instance.activeChart();

          // Initial draw
          redraw(chart);

          // Redraw on data loaded (scroll/zoom loads more bars)
          chart.onDataLoaded().subscribe(null, () => redraw(chart));

          // Redraw on symbol change
          chart.onSymbolChanged().subscribe(null, () => {
            setTimeout(() => redraw(chart), 500);
          });

          // Redraw on interval change
          chart.onIntervalChanged().subscribe(null, () => {
            setTimeout(() => redraw(chart), 500);
          });
        });

        return instance;
      },
    });

    (window as any).__SESSION_BOX_INSTALLED__ = true;
  }, 200);
}
