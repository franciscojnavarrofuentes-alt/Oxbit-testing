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
    (this as any).init = function (context: any) {
      (this as any)._context = context;
    };

    (this as any).main = function (context: any, inputCallback: any) {
      const Std = PineJS.Std;

      const sessionStartH = inputCallback(0);
      const sessionStartM = inputCallback(1);
      const sessionEndH = inputCallback(2);
      const sessionEndM = inputCallback(3);
      const gmtOffset = inputCallback(4);

      // Session times in minutes from midnight (in session timezone)
      const sessionStartMinutes = sessionStartH * 60 + sessionStartM;
      const sessionEndMinutes = sessionEndH * 60 + sessionEndM;

      // Get bar time and convert to session timezone
      const barTime = Std.time(context);
      const date = new Date(barTime);
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      const localMinutes = ((utcHours + gmtOffset) * 60 + utcMinutes + 1440) % 1440;

      // Check if we're in session
      const inSession = sessionEndMinutes > sessionStartMinutes
        ? localMinutes >= sessionStartMinutes && localMinutes < sessionEndMinutes
        : localMinutes >= sessionStartMinutes || localMinutes < sessionEndMinutes;

      // Track session state
      const highVar = context.new_var(NaN);
      const lowVar = context.new_var(NaN);
      const inSessionVar = context.new_var(false);

      const prevInSession = inSessionVar.get(1);
      const sessionStart = inSession && !prevInSession;

      const curHigh = Std.high(context);
      const curLow = Std.low(context);

      if (sessionStart) {
        highVar.set(curHigh);
        lowVar.set(curLow);
      } else if (inSession) {
        const prevHigh = highVar.get(1);
        const prevLow = lowVar.get(1);
        highVar.set(Math.max(isNaN(prevHigh) ? curHigh : prevHigh, curHigh));
        lowVar.set(Math.min(isNaN(prevLow) ? curLow : prevLow, curLow));
      }

      inSessionVar.set(inSession);

      if (inSession) {
        return [highVar.get(0), lowVar.get(0)];
      }

      return [NaN, NaN];
    };
  },
});

export default createSessionBoxIndicator;
