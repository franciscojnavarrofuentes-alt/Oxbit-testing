// ZS Indicador Caja - Aperturas
// Muestra cajas de sesión (apertura NY) con máximos y mínimos del rango.
// Basado en el indicador Pine Script "Sessions ZS"

export const createSessionBoxIndicator = (PineJS: any): any => ({
  name: 'ZS Indicador Caja - Aperturas',
  metainfo: {
    _metainfoVersion: 53,
    id: 'SessionBoxZS@tv-basicstudies-1',
    name: 'ZS Indicador Caja - Aperturas',
    description: 'ZS Indicador Caja - Aperturas',
    shortDescription: 'Caja Aperturas ZS',

    is_price_study: true,
    isCustomIndicator: true,
    linkedToSeries: true,

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
      },
    ],

    styles: {
      session_high: { title: 'Session High' },
      session_low: { title: 'Session Low' },
    },

    defaults: {
      styles: {
        session_high: {
          linestyle: 0,
          visible: true,
          linewidth: 1,
          plottype: 7,
          trackPrice: false,
          transparency: 0,
          color: '#FFFFFF',
        },
        session_low: {
          linestyle: 0,
          visible: true,
          linewidth: 1,
          plottype: 7,
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
        showSessionBox: true,
        sessionStartHour: 14,
        sessionStartMinute: 30,
        sessionEndHour: 16,
        sessionEndMinute: 0,
      },
    },

    inputs: [
      {
        id: 'showSessionBox',
        name: 'Caja apertura',
        type: 'bool',
        defval: true,
      },
      {
        id: 'sessionStartHour',
        name: 'Start Hour',
        type: 'integer',
        defval: 14,
        min: 0,
        max: 23,
      },
      {
        id: 'sessionStartMinute',
        name: 'Start Minute',
        type: 'integer',
        defval: 30,
        min: 0,
        max: 59,
      },
      {
        id: 'sessionEndHour',
        name: 'End Hour',
        type: 'integer',
        defval: 16,
        min: 0,
        max: 23,
      },
      {
        id: 'sessionEndMinute',
        name: 'End Minute',
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

      const showSessionBox = inputCallback(0);
      const startHour = inputCallback(1);
      const startMinute = inputCallback(2);
      const endHour = inputCallback(3);
      const endMinute = inputCallback(4);

      if (!showSessionBox) return [null, null];

      const sessionStartTotalMin = startHour * 60 + startMinute;
      const sessionEndTotalMin = endHour * 60 + endMinute;

      // Use PineJS Std.hour/minute — returns exchange timezone, not browser
      const barHour = Std.hour(context);
      const barMinute = Std.minute(context);
      const barTotalMin = barHour * 60 + barMinute;

      const curHigh = Std.high(context);
      const curLow = Std.low(context);

      // Handle sessions that cross midnight
      const inSession = sessionEndTotalMin > sessionStartTotalMin
        ? barTotalMin >= sessionStartTotalMin && barTotalMin < sessionEndTotalMin
        : barTotalMin >= sessionStartTotalMin || barTotalMin < sessionEndTotalMin;

      // Persistent state via new_var
      const highVar = context.new_var(NaN);
      const lowVar = context.new_var(NaN);
      const inSessionVar = context.new_var(0);

      const wasInSession = inSessionVar.get(1) === 1;
      const sessionJustStarted = inSession && !wasInSession;

      if (sessionJustStarted) {
        highVar.set(curHigh);
        lowVar.set(curLow);
      } else if (inSession) {
        const prevH = highVar.get(1);
        const prevL = lowVar.get(1);
        highVar.set(isNaN(prevH) ? curHigh : Math.max(prevH, curHigh));
        lowVar.set(isNaN(prevL) ? curLow : Math.min(prevL, curLow));
      } else {
        highVar.set(highVar.get(1));
        lowVar.set(lowVar.get(1));
      }

      inSessionVar.set(inSession ? 1 : 0);

      // Only plot during session — historical boxes remain on chart
      if (inSession) {
        return [highVar.get(0), lowVar.get(0)];
      }

      return [null, null];
    };
  },
});

export default createSessionBoxIndicator;
