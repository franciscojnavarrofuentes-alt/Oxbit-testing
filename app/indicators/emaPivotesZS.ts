// EMA y Pivotes ZS Strategy v4
// Muestra EMA (step line), niveles de soporte/resistencia por pivotes de HTF,
// y señales BUY/SELL cuando el precio toca un pivote y cruza la EMA.
// Basado en el indicador Pine Script de @ZCoinTV y @ScottFDX

export const createEmaPivotesIndicator = (PineJS: any): any => ({
  name: 'EMA y Pivotes ZS v4',
  metainfo: {
    _metainfoVersion: 51,
    id: 'EmaPivotesZS@tv-basicstudies-1',
    name: 'EMA y Pivotes ZS v4',
    description: 'EMA y Pivotes ZS Strategy v4',
    shortDescription: 'EMA Pivotes ZS',

    is_price_study: true,
    isCustomIndicator: true,

    format: {
      type: 'price',
      precision: 2,
    },

    plots: [
      { id: 'ema_line', type: 'line' },
      { id: 'resistance', type: 'line' },
      { id: 'support', type: 'line' },
      { id: 'sell_signal', type: 'shapes' },
      { id: 'buy_signal', type: 'shapes' },
    ],

    defaults: {
      styles: {
        ema_line: {
          linestyle: 0,
          linewidth: 2,
          plottype: 6, // step line (original: plot.style_stepline)
          trackPrice: false,
          transparency: 0,
          color: '#FFFFFF',
        },
        resistance: {
          linestyle: 0,
          linewidth: 2,
          plottype: 7, // LineWithBreaks (breaks on NaN to create separate segments)
          trackPrice: false,
          transparency: 0,
          color: '#BA160C',
        },
        support: {
          linestyle: 0,
          linewidth: 2,
          plottype: 7, // LineWithBreaks
          trackPrice: false,
          transparency: 0,
          color: '#FFEC00',
        },
        sell_signal: {
          color: '#BA160C',
          plottype: 'shape_label_down',
          location: 'AboveBar',
          size: 'normal',
          text: '',
        },
        buy_signal: {
          color: '#FFEC00',
          plottype: 'shape_label_up',
          location: 'BelowBar',
          size: 'normal',
          text: '',
        },
      },
      precision: 2,
      inputs: {
        emaPeriods: 12,
        htfPeriod: '400',
        cooldownBars: 12,
        showPivots: true,
      },
    },

    styles: {
      ema_line: { title: 'EMA', histogramBase: 0 },
      resistance: { title: 'Resistance', histogramBase: 0 },
      support: { title: 'Support', histogramBase: 0 },
      sell_signal: { title: 'SELL Signal' },
      buy_signal: { title: 'BUY Signal' },
    },

    inputs: [
      {
        id: 'emaPeriods',
        name: 'EMA Period',
        type: 'integer',
        defval: 12,
        min: 1,
        max: 200,
      },
      {
        id: 'htfPeriod',
        name: 'Pivot Timeframe',
        type: 'text',
        defval: '400',
      },
      {
        id: 'cooldownBars',
        name: 'Signal Cooldown (bars)',
        type: 'integer',
        defval: 12,
        min: 1,
        max: 100,
      },
      {
        id: 'showPivots',
        name: 'Show Pivots',
        type: 'bool',
        defval: true,
      },
    ],
  },

  constructor: function () {
    (this as any).init = function (context: any, inputCallback: any) {
      // No secondary symbol — HTF levels computed manually on main series
    };

    (this as any).main = function (context: any, inputCallback: any) {
      // Read inputs
      const emaPeriods = inputCallback(0);
      const htfPeriodStr = inputCallback(1); // e.g. "400" (minutes)
      const cooldownBars = inputCallback(2);
      const showPivots = inputCallback(3);

      const Std = PineJS.Std;
      const htfMinutes = parseInt(htfPeriodStr, 10) || 400;
      const htfMs = htfMinutes * 60 * 1000;

      // -- EMA calculation on main series --
      // new_var #1
      const closeSeries = context.new_var(Std.close(context));
      const emaValue = Std.ema(closeSeries, emaPeriods, context);

      // -- Manual HTF bar detection --
      // Group main bars into HTF periods by timestamp
      const barTime = Std.time(context);
      const curHigh = Std.high(context);
      const curLow = Std.low(context);
      const htfBarId = Math.floor(barTime / htfMs);

      // new_var #2: track which HTF bar we're in
      const htfBarIdVar = context.new_var(htfBarId);
      const prevHtfBarId = htfBarIdVar.get(1);
      const newHtfBar = !isNaN(prevHtfBarId) && htfBarId !== prevHtfBarId;

      // new_var #3, #4: running high/low within current HTF bar
      const runHighVar = context.new_var(curHigh);
      const runLowVar = context.new_var(curLow);

      // new_var #5, #6: resistance/support = previous completed HTF bar's high/low
      const resVar = context.new_var(NaN);
      const supVar = context.new_var(NaN);

      if (newHtfBar) {
        // HTF bar boundary: save previous HTF bar's final high/low as levels
        resVar.set(runHighVar.get(1));
        supVar.set(runLowVar.get(1));
        // Reset running high/low for new HTF bar
        runHighVar.set(curHigh);
        runLowVar.set(curLow);
      } else {
        // Within same HTF bar: expand running high/low, carry levels forward
        const prevRunH = runHighVar.get(1);
        const prevRunL = runLowVar.get(1);
        runHighVar.set(isNaN(prevRunH) ? curHigh : Math.max(prevRunH, curHigh));
        runLowVar.set(isNaN(prevRunL) ? curLow : Math.min(prevRunL, curLow));
        resVar.set(resVar.get(1));
        supVar.set(supVar.get(1));
      }

      const resistance = resVar.get(0);
      const supportVal = supVar.get(0);
      const prevResistance = resVar.get(1);
      const prevSupport = supVar.get(1);

      // Break line when level changes (NaN gap with plottype 7 LineWithBreaks)
      const resChanged = !isNaN(prevResistance) && resistance !== prevResistance;
      const supChanged = !isNaN(prevSupport) && supportVal !== prevSupport;

      // -- Track close and EMA for crossover detection --
      // new_var #7, #8, #9, #10
      const closeVar = context.new_var(Std.close(context));
      const emaVar = context.new_var(emaValue);
      const highVar = context.new_var(curHigh);
      const lowVar = context.new_var(curLow);

      const curClose = closeVar.get(0);
      const prevClose = closeVar.get(1);
      const curEma = emaVar.get(0);
      const prevEma = emaVar.get(1);
      const prevHigh = highVar.get(1);
      const prevLow = lowVar.get(1);

      // -- Touch detection --
      const touchResistance =
        (curHigh >= resistance && prevHigh < resistance) ||
        (curHigh >= resistance && prevHigh < prevResistance);
      const touchSupport =
        (curLow <= supportVal && prevLow > supportVal) ||
        (curLow <= supportVal && prevLow > prevSupport);

      // -- Track bars since touch --
      // new_var #11, #12
      const touchResVar = context.new_var(0);
      const touchSupVar = context.new_var(0);

      if (touchResistance) {
        touchResVar.set(0);
      } else {
        touchResVar.set((touchResVar.get(1) || 0) + 1);
      }

      if (touchSupport) {
        touchSupVar.set(0);
      } else {
        touchSupVar.set((touchSupVar.get(1) || 0) + 1);
      }

      const barsSinceTouchRes = touchResVar.get(0);
      const barsSinceTouchSup = touchSupVar.get(0);

      const touchedRes = barsSinceTouchRes >= 1 && barsSinceTouchRes <= cooldownBars + 1;
      const touchedSup = barsSinceTouchSup >= 1 && barsSinceTouchSup <= cooldownBars + 1;

      // EMA crossover/crossunder
      const closeBelowEma = curClose < curEma && prevClose >= prevEma;
      const closeAboveEma = curClose > curEma && prevClose <= prevEma;

      const sellConditionRaw = touchedRes && closeBelowEma;
      const buyConditionRaw = touchedSup && closeAboveEma;

      // Cooldown tracking
      // new_var #13, #14
      const barsSinceSellVar = context.new_var(999);
      const barsSinceBuyVar = context.new_var(999);

      if (sellConditionRaw && barsSinceSellVar.get(1) > cooldownBars) {
        barsSinceSellVar.set(0);
      } else {
        barsSinceSellVar.set((barsSinceSellVar.get(1) || 0) + 1);
      }

      if (buyConditionRaw && barsSinceBuyVar.get(1) > cooldownBars) {
        barsSinceBuyVar.set(0);
      } else {
        barsSinceBuyVar.set((barsSinceBuyVar.get(1) || 0) + 1);
      }

      const sellSignal = barsSinceSellVar.get(0) === 0 ? 1 : NaN;
      const buySignal = barsSinceBuyVar.get(0) === 0 ? 1 : NaN;

      // -- Output --
      const resPlot = showPivots ? (resChanged ? NaN : resistance) : NaN;
      const supPlot = showPivots ? (supChanged ? NaN : supportVal) : NaN;

      return [emaValue, resPlot, supPlot, sellSignal, buySignal];
    };
  },
});

export default createEmaPivotesIndicator;
