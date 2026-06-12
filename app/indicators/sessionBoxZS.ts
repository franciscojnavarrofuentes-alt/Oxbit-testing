// ZS Indicador Caja - Aperturas
// Muestra cajas de sesión (apertura NY) con máximos y mínimos del rango.
// Los inputs están en hora de Nueva York (gestiona DST automáticamente).

export const createSessionBoxIndicator = (PineJS: any): any => ({
  name: 'ZS Indicador Caja - Aperturas',
  metainfo: {
    _metainfoVersion: 52,
    id: 'SessionBoxZS@tv-basicstudies-1',
    name: 'ZS Indicador Caja - Aperturas',
    description: 'ZS Indicador Caja - Aperturas',
    shortDescription: 'Caja Aperturas ZS',

    is_price_study: true,
    isCustomIndicator: true,

    format: {
      type: 'price',
      precision: 2,
    },

    plots: [
      { id: 'session_high', type: 'line' },
      { id: 'session_low', type: 'line' },
    ],

    filledAreas: [
      {
        id: 'session_fill',
        objAId: 'session_high',
        objBId: 'session_low',
        type: 'plot_plot',
        title: 'Session Area',
        fillgaps: false,
      },
    ],

    defaults: {
      styles: {
        session_high: {
          linestyle: 0,
          visible: true,
          linewidth: 1,
          plottype: 11, // StepLineWithBreaks
          trackPrice: false,
          transparency: 0,
          color: '#FFFFFF',
        },
        session_low: {
          linestyle: 0,
          visible: true,
          linewidth: 1,
          plottype: 11, // StepLineWithBreaks
          trackPrice: false,
          transparency: 0,
          color: '#FFFFFF',
        },
      },
      filledAreasStyle: {
        session_fill: {
          color: '#FFFFFF',
          visible: true,
          transparency: 75,
        },
      },
      precision: 2,
      inputs: {
        sessionStart: 9,
        sessionStartMin: 30,
        sessionEnd: 11,
        sessionEndMin: 0,
      },
    },

    styles: {
      session_high: { title: 'Session High', histogramBase: 0 },
      session_low: { title: 'Session Low', histogramBase: 0 },
    },

    inputs: [
      {
        id: 'sessionStart',
        name: 'Session Start Hour (NY)',
        type: 'integer',
        defval: 9,
        min: 0,
        max: 23,
      },
      {
        id: 'sessionStartMin',
        name: 'Session Start Minute (NY)',
        type: 'integer',
        defval: 30,
        min: 0,
        max: 59,
      },
      {
        id: 'sessionEnd',
        name: 'Session End Hour (NY)',
        type: 'integer',
        defval: 11,
        min: 0,
        max: 23,
      },
      {
        id: 'sessionEndMin',
        name: 'Session End Minute (NY)',
        type: 'integer',
        defval: 0,
        min: 0,
        max: 59,
      },
    ],
  },

  constructor: function () {
    (this as any).init = function (context: any, inputCallback: any) {
      // Formatter to convert bar timestamp to NY time (handles DST automatically)
      (this as any)._nyTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
    };

    (this as any).main = function (context: any, inputCallback: any) {
      const Std = PineJS.Std;

      // Create state variables ALWAYS, in the same order, before any early return
      const highVar = context.new_var(NaN);
      const lowVar = context.new_var(NaN);
      const inSessionVar = context.new_var(0);

      if (!Std.isintraday(context)) {
        return [NaN, NaN];
      }

      const sessionStartTotalMin = inputCallback(0) * 60 + inputCallback(1);
      const sessionEndTotalMin = inputCallback(2) * 60 + inputCallback(3);

      // Convert bar time to NY timezone
      const barTime = context.symbol.time;
      if (!barTime || isNaN(barTime)) {
        return [NaN, NaN];
      }
      const parts = (this as any)._nyTime.formatToParts(new Date(barTime));
      const h = Number(parts.find((p: any) => p.type === 'hour').value);
      const m = Number(parts.find((p: any) => p.type === 'minute').value);
      const barTotalMin = h * 60 + m;

      const curHigh = Std.high(context);
      const curLow = Std.low(context);

      // Check if bar is within session
      const inSession =
        sessionEndTotalMin > sessionStartTotalMin
          ? barTotalMin >= sessionStartTotalMin && barTotalMin < sessionEndTotalMin
          : barTotalMin >= sessionStartTotalMin || barTotalMin < sessionEndTotalMin;

      // Previous bar's session state
      const wasInSession = inSessionVar.get(1) === 1;
      const sessionJustStarted = inSession && !wasInSession;

      if (sessionJustStarted) {
        // New session: reset to current bar
        highVar.set(curHigh);
        lowVar.set(curLow);
      } else if (inSession) {
        // During session: expand running high/low
        const prevH = highVar.get(1);
        const prevL = lowVar.get(1);
        highVar.set(isNaN(prevH) ? curHigh : Math.max(prevH, curHigh));
        lowVar.set(isNaN(prevL) ? curLow : Math.min(prevL, curLow));
      } else {
        // Outside session: carry forward last values
        highVar.set(highVar.get(1));
        lowVar.set(lowVar.get(1));
      }

      inSessionVar.set(inSession ? 1 : 0);

      // Show during session (marks the correct session hours on the chart)
      if (inSession) {
        return [highVar.get(0), lowVar.get(0)];
      }

      return [NaN, NaN];
    };
  },
});

export default createSessionBoxIndicator;
