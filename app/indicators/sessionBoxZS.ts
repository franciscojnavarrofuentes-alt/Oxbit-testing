// ZS Indicador Caja - Aperturas
// Muestra cajas de sesión (apertura NY) con máximos y mínimos del rango.
// Basado en el indicador Pine Script "Sessions ZS"

export const createSessionBoxIndicator = (PineJS: any): any => ({
  name: 'ZS Indicador Caja - Aperturas',
  metainfo: {
    _metainfoVersion: 51,
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

    defaults: {
      styles: {
        session_high: {
          linestyle: 0,
          linewidth: 1,
          plottype: 0,
          trackPrice: false,
          transparency: 0,
          color: '#FFFFFF',
        },
        session_low: {
          linestyle: 0,
          linewidth: 1,
          plottype: 0,
          trackPrice: false,
          transparency: 0,
          color: '#FFFFFF',
        },
      },
      precision: 2,
      inputs: {
        sessionStart: 14,
        sessionStartMin: 30,
        sessionEnd: 16,
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
        defval: 14,
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
        defval: 16,
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

      // Use PineJS Std.hour and Std.minute to get the bar's exchange time
      const barHour = Std.hour(context);
      const barMinute = Std.minute(context);
      const barTotalMin = barHour * 60 + barMinute;

      const curHigh = Std.high(context);
      const curLow = Std.low(context);

      // Check if bar is within session
      const inSession = sessionEndTotalMin > sessionStartTotalMin
        ? barTotalMin >= sessionStartTotalMin && barTotalMin < sessionEndTotalMin
        : barTotalMin >= sessionStartTotalMin || barTotalMin < sessionEndTotalMin;

      // Use new_var to track state across bars
      const highVar = context.new_var(NaN);
      const lowVar = context.new_var(NaN);
      const prevInSessionVar = context.new_var(0);

      const wasInSession = prevInSessionVar.get(0) === 1;
      const sessionJustStarted = inSession && !wasInSession;

      if (sessionJustStarted) {
        // New session: reset high/low to current bar
        highVar.set(curHigh);
        lowVar.set(curLow);
      } else if (inSession) {
        // During session: expand high/low
        const h = highVar.get(0);
        const l = lowVar.get(0);
        highVar.set(isNaN(h) ? curHigh : Math.max(h, curHigh));
        lowVar.set(isNaN(l) ? curLow : Math.min(l, curLow));
      }
      // Outside session: highVar/lowVar keep last session's values (no change)

      prevInSessionVar.set(inSession ? 1 : 0);

      // Always return the current (or last) session levels
      // This avoids NaN gaps that cause diagonal connecting lines
      const h = highVar.get(0);
      const l = lowVar.get(0);
      if (isNaN(h) || isNaN(l)) {
        return [NaN, NaN];
      }
      return [h, l];
    };
  },
});

export default createSessionBoxIndicator;
