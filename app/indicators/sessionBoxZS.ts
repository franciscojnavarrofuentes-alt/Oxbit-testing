// ZS Indicador Caja - Aperturas
// Muestra cajas de sesión (apertura NY) con máximos y mínimos del rango.
// Basado en el indicador Pine Script "Sessions ZS"

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
      // Request 30-min resolution of the same symbol (same pattern as EMA Pivotes).
      const symbol = PineJS.Std.ticker(context);
      context.new_sym(symbol, '30');
    };

    (this as any).main = function (context: any, inputCallback: any) {
      const Std = PineJS.Std;

      const sessionStartH = inputCallback(0);
      const sessionStartM = inputCallback(1);
      const sessionEndH = inputCallback(2);
      const sessionEndM = inputCallback(3);

      const sessionStartTotalMin = sessionStartH * 60 + sessionStartM;
      const sessionEndTotalMin = sessionEndH * 60 + sessionEndM;

      // Read base-resolution bar time and OHLC BEFORE switching context
      const barHour = Std.hour(context);
      const barMinute = Std.minute(context);
      const barTotalMin = barHour * 60 + barMinute;
      const curHigh = Std.high(context);
      const curLow = Std.low(context);

      // Read 30-min HTF bar values
      context.select_sym(1);
      const htfHighRaw = Std.high(context);
      const htfLowRaw = Std.low(context);
      context.select_sym(0);

      // Wrap HTF values in new_var to materialise as base-resolution series
      // (same pattern as EMA Pivotes: resistanceSeries = context.new_var(htfHigh))
      const htfHighSeries = context.new_var(htfHighRaw);
      const htfLowSeries = context.new_var(htfLowRaw);

      // Use HTF values if valid, otherwise fall back to base-resolution
      const htfHigh = htfHighSeries.get(0);
      const htfLow = htfLowSeries.get(0);
      const useHigh = isNaN(htfHigh) || htfHigh <= 0 ? curHigh : htfHigh;
      const useLow = isNaN(htfLow) || htfLow <= 0 ? curLow : htfLow;

      // Check if bar is within session
      const inSession = sessionEndTotalMin > sessionStartTotalMin
        ? barTotalMin >= sessionStartTotalMin && barTotalMin < sessionEndTotalMin
        : barTotalMin >= sessionStartTotalMin || barTotalMin < sessionEndTotalMin;

      // State variables — use get(1) to read previous bar's .set() value
      const highVar = context.new_var(NaN);
      const lowVar = context.new_var(NaN);
      const inSessionVar = context.new_var(0);

      const wasInSession = inSessionVar.get(1) === 1;
      const sessionJustStarted = inSession && !wasInSession;

      if (sessionJustStarted) {
        highVar.set(useHigh);
        lowVar.set(useLow);
      } else if (inSession) {
        const prevH = highVar.get(1);
        const prevL = lowVar.get(1);
        highVar.set(isNaN(prevH) ? useHigh : Math.max(prevH, useHigh));
        lowVar.set(isNaN(prevL) ? useLow : Math.min(prevL, useLow));
      } else {
        highVar.set(highVar.get(1));
        lowVar.set(lowVar.get(1));
      }

      inSessionVar.set(inSession ? 1 : 0);

      if (inSession) {
        return [highVar.get(0), lowVar.get(0)];
      }

      return [NaN, NaN];
    };
  },
});

export default createSessionBoxIndicator;
