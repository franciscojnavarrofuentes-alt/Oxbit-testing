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
        gmtOffset: 2,
      },
    },

    styles: {
      session_high: { title: 'Session High', histogramBase: 0 },
      session_low: { title: 'Session Low', histogramBase: 0 },
    },

    inputs: [
      {
        id: 'sessionStart',
        name: 'Session Start Hour (GMT+offset)',
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
        name: 'Session End Hour (GMT+offset)',
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
      {
        id: 'gmtOffset',
        name: 'GMT Offset',
        type: 'integer',
        defval: 2,
        min: -12,
        max: 14,
      },
    ],
  },

  constructor: function () {
    (this as any).init = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      // Persistent state
      (this as any)._sessionHigh = NaN;
      (this as any)._sessionLow = NaN;
      (this as any)._wasInSession = false;
    };

    (this as any).main = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      const Std = PineJS.Std;

      const sessionStartH = inputCallback(0);
      const sessionStartM = inputCallback(1);
      const sessionEndH = inputCallback(2);
      const sessionEndM = inputCallback(3);
      const gmtOffset = inputCallback(4);

      const sessionStartMin = sessionStartH * 60 + sessionStartM;
      const sessionEndMin = sessionEndH * 60 + sessionEndM;

      const curHigh = Std.high(context);
      const curLow = Std.low(context);

      // Compute local time from bar timestamp
      let localMin = 0;
      try {
        const t = context.symbol.time;
        if (t) {
          const d = new Date(t);
          localMin = ((d.getUTCHours() + gmtOffset) * 60 + d.getUTCMinutes() + 1440) % 1440;
        }
      } catch (_e) {
        return [NaN, NaN];
      }

      const inSession = sessionEndMin > sessionStartMin
        ? localMin >= sessionStartMin && localMin < sessionEndMin
        : localMin >= sessionStartMin || localMin < sessionEndMin;

      const sessionJustStarted = inSession && !(this as any)._wasInSession;

      if (sessionJustStarted) {
        (this as any)._sessionHigh = curHigh;
        (this as any)._sessionLow = curLow;
      } else if (inSession) {
        (this as any)._sessionHigh = Math.max((this as any)._sessionHigh, curHigh);
        (this as any)._sessionLow = Math.min((this as any)._sessionLow, curLow);
      }

      (this as any)._wasInSession = inSession;

      if (inSession) {
        return [(this as any)._sessionHigh, (this as any)._sessionLow];
      }

      return [NaN, NaN];
    };
  },
});

export default createSessionBoxIndicator;
