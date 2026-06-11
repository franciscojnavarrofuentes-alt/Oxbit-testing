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

    filledAreas: [
      {
        id: 'session_fill',
        objAId: 'session_high',
        objBId: 'session_low',
        type: 'plot_plot',
        title: 'Session Range',
      },
    ],

    defaults: {
      filledAreasStyle: {
        session_fill: {
          color: '#FFFFFF',
          transparency: 75,
        },
      },
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
    };

    (this as any).main = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      try {
        const Std = PineJS.Std;

        const sessionStartH = inputCallback(0);
        const sessionStartM = inputCallback(1);
        const sessionEndH = inputCallback(2);
        const sessionEndM = inputCallback(3);
        const gmtOffset = inputCallback(4);

        const sessionStartMinutes = sessionStartH * 60 + sessionStartM;
        const sessionEndMinutes = sessionEndH * 60 + sessionEndM;

        // Use bar time from context
        const curHigh = Std.high(context);
        const curLow = Std.low(context);

        // Get bar time in milliseconds and compute local hour/minute
        const barTimeMs = context.symbol.time;
        if (!barTimeMs) return [NaN, NaN];

        const date = new Date(barTimeMs);
        const utcTotalMin = date.getUTCHours() * 60 + date.getUTCMinutes();
        const localMin = ((utcTotalMin + gmtOffset * 60) % 1440 + 1440) % 1440;

        const inSession = sessionEndMinutes > sessionStartMinutes
          ? localMin >= sessionStartMinutes && localMin < sessionEndMinutes
          : localMin >= sessionStartMinutes || localMin < sessionEndMinutes;

        // Track state using new_var (persisted across bars)
        const highVar = context.new_var(NaN);
        const lowVar = context.new_var(NaN);
        const wasInSessionVar = context.new_var(0);

        const wasInSession = wasInSessionVar.get(0) === 1;
        const sessionJustStarted = inSession && !wasInSession;

        if (sessionJustStarted) {
          highVar.set(curHigh);
          lowVar.set(curLow);
        } else if (inSession) {
          const prevH = highVar.get(0);
          const prevL = lowVar.get(0);
          highVar.set(isNaN(prevH) ? curHigh : Math.max(prevH, curHigh));
          lowVar.set(isNaN(prevL) ? curLow : Math.min(prevL, curLow));
        }

        wasInSessionVar.set(inSession ? 1 : 0);

        if (inSession) {
          return [highVar.get(0), lowVar.get(0)];
        }

        return [NaN, NaN];
      } catch {
        return [NaN, NaN];
      }
    };
  },
});

export default createSessionBoxIndicator;
