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
          plottype: 11, // StepLineWithBreaks: flat horizontal + breaks on NaN
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

      // Track state across bars
      const highVar = context.new_var(NaN);
      const lowVar = context.new_var(NaN);
      const finalHighVar = context.new_var(NaN);
      const finalLowVar = context.new_var(NaN);
      const prevInSessionVar = context.new_var(0);

      const wasInSession = prevInSessionVar.get(0) === 1;
      const sessionJustStarted = inSession && !wasInSession;
      const sessionJustEnded = !inSession && wasInSession;

      if (sessionJustStarted) {
        // New session: reset running high/low
        highVar.set(curHigh);
        lowVar.set(curLow);
        // Clear final values (new session starting)
        finalHighVar.set(NaN);
        finalLowVar.set(NaN);
      } else if (inSession) {
        // During session: expand running high/low
        const h = highVar.get(0);
        const l = lowVar.get(0);
        highVar.set(isNaN(h) ? curHigh : Math.max(h, curHigh));
        lowVar.set(isNaN(l) ? curLow : Math.min(l, curLow));
      }

      if (sessionJustEnded) {
        // Session just ended: lock in the final values
        finalHighVar.set(highVar.get(0));
        finalLowVar.set(lowVar.get(0));
      }

      prevInSessionVar.set(inSession ? 1 : 0);

      // Don't draw during the session (avoids step lines at each new high/low)
      // Show the final session high/low only after the session ends
      if (!inSession) {
        const fh = finalHighVar.get(0);
        const fl = finalLowVar.get(0);
        if (!isNaN(fh) && !isNaN(fl)) {
          return [fh, fl];
        }
      }

      return [NaN, NaN];
    };
  },
});

export default createSessionBoxIndicator;
