// ZS Indicador Caja - Aperturas
// Muestra cajas de sesión (apertura NY) con máximos y mínimos del rango.
// Basado en el indicador Pine Script "Sessions ZS"
//
// Uses context.new_sym() to request a higher timeframe bar that covers
// the entire session. For historical data, each lower-timeframe bar within
// the session sees the SAME final high/low → perfectly flat lines.

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
        sessionStart: 13,
        sessionStartMin: 30,
        sessionEnd: 15,
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
        name: 'Session Start Hour',
        type: 'integer',
        defval: 13,
        min: 0,
        max: 23,
      },
      {
        id: 'sessionStartMin',
        name: 'Session Start Minute',
        type: 'integer',
        defval: 30,
        min: 0,
        max: 59,
      },
      {
        id: 'sessionEnd',
        name: 'Session End Hour',
        type: 'integer',
        defval: 15,
        min: 0,
        max: 23,
      },
      {
        id: 'sessionEndMin',
        name: 'Session End Minute',
        type: 'integer',
        defval: 0,
        min: 0,
        max: 59,
      },
    ],
  },

  constructor: function () {
    (this as any).init = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      // Compute session duration in minutes
      const sessionStartH = inputCallback(0);
      const sessionStartM = inputCallback(1);
      const sessionEndH = inputCallback(2);
      const sessionEndM = inputCallback(3);
      const durationMin = (sessionEndH * 60 + sessionEndM) - (sessionStartH * 60 + sessionStartM);

      // Request same symbol at a resolution matching the session duration
      // For 13:30-15:00 = 90 min → a 90-min bar starting at 13:30 covers the entire session
      const symbol = PineJS.Std.ticker(context);
      context.new_sym(symbol, String(durationMin));
    };

    (this as any).main = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      const Std = PineJS.Std;

      const sessionStartH = inputCallback(0);
      const sessionStartM = inputCallback(1);
      const sessionEndH = inputCallback(2);
      const sessionEndM = inputCallback(3);

      const sessionStartTotalMin = sessionStartH * 60 + sessionStartM;
      const sessionEndTotalMin = sessionEndH * 60 + sessionEndM;

      const barHour = Std.hour(context);
      const barMinute = Std.minute(context);
      const barTotalMin = barHour * 60 + barMinute;

      // Check if bar is within session
      const inSession = sessionEndTotalMin > sessionStartTotalMin
        ? barTotalMin >= sessionStartTotalMin && barTotalMin < sessionEndTotalMin
        : barTotalMin >= sessionStartTotalMin || barTotalMin < sessionEndTotalMin;

      // Get the HTF bar's high/low — wrap in new_var to create a proper
      // per-bar series (same pattern as EMA pivotes indicator)
      context.select_sym(1);
      const htfHigh = Std.high(context);
      const htfLow = Std.low(context);
      context.select_sym(0);

      const highSeries = context.new_var(htfHigh);
      const lowSeries = context.new_var(htfLow);

      if (inSession) {
        return [highSeries.get(0), lowSeries.get(0)];
      }

      return [NaN, NaN];
    };
  },
});

export default createSessionBoxIndicator;
