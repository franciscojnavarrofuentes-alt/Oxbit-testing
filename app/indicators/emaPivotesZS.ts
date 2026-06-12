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
      const symbol = PineJS.Std.ticker(context);
      const htfPeriod = inputCallback(1);
      // Request HTF data for resistance/support
      context.new_sym(symbol, htfPeriod);
    };

    (this as any).main = function (context: any, inputCallback: any) {
      // Read inputs
      const emaPeriods = inputCallback(0);
      // inputCallback(1) = htfPeriod, already used in init
      const cooldownBars = inputCallback(2);
      const showPivots = inputCallback(3);

      const Std = PineJS.Std;

      // -- EMA calculation on main series --
      const closeSeries = context.new_var(Std.close(context));
      const emaValue = Std.ema(closeSeries, emaPeriods, context);

      // -- HTF Resistance/Support (request.security equivalent) --
      context.select_sym(1); // switch to HTF context
      const htfHigh = Std.high(context);
      const htfLow = Std.low(context);
      context.select_sym(0); // switch back to main context

      const resistanceSeries = context.new_var(htfHigh);
      const supportSeries = context.new_var(htfLow);

      const resistance = resistanceSeries.get(0);
      const supportVal = supportSeries.get(0);
      const prevResistance = resistanceSeries.get(1);
      const prevSupport = supportSeries.get(1);

      // -- Break line when pivot changes (original: color = Resistencia != Resistencia[1] ? na : color) --
      // Return NaN on the bar where the level changes to create visual break
      const resChanged = resistance !== prevResistance;
      const supChanged = supportVal !== prevSupport;

      // -- Track close and EMA for crossover detection --
      const closeVar = context.new_var(Std.close(context));
      const emaVar = context.new_var(emaValue);
      const highVar = context.new_var(Std.high(context));
      const lowVar = context.new_var(Std.low(context));

      const curClose = closeVar.get(0);
      const prevClose = closeVar.get(1);
      const curEma = emaVar.get(0);
      const prevEma = emaVar.get(1);
      const curHigh = highVar.get(0);
      const prevHigh = highVar.get(1);
      const curLow = lowVar.get(0);
      const prevLow = lowVar.get(1);

      // -- Touch detection --
      // Original: ta.crossover(high, Resistencia) or (high >= Resistencia and high[1] < Resistencia[1])
      const touchResistance =
        (curHigh >= resistance && prevHigh < resistance) ||
        (curHigh >= resistance && prevHigh < prevResistance);
      // Original: ta.crossunder(low, Soporte) or (low <= Soporte and low[1] > Soporte[1])
      const touchSupport =
        (curLow <= supportVal && prevLow > supportVal) ||
        (curLow <= supportVal && prevLow > prevSupport);

      // -- Track bars since touch --
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

      // Recently touched pivot (within cooldown bars)?
      // Original uses touched_res[1] — check PREVIOUS bar's touch state
      const touchedRes = barsSinceTouchRes >= 1 && barsSinceTouchRes <= cooldownBars + 1;
      const touchedSup = barsSinceTouchSup >= 1 && barsSinceTouchSup <= cooldownBars + 1;

      // EMA crossover/crossunder
      const closeBelowEma = curClose < curEma && prevClose >= prevEma;
      const closeAboveEma = curClose > curEma && prevClose <= prevEma;

      // Raw conditions (original: sell_condition = touched_res[1] and close_below_ema)
      const sellConditionRaw = touchedRes && closeBelowEma;
      const buyConditionRaw = touchedSup && closeAboveEma;

      // Cooldown tracking
      // Original: bars_since_sell = ta.barssince(sell_condition[1])
      //           can_sell = bars_since_sell > 12 or na(bars_since_sell)
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
      // Break the line on pivot change (NaN creates gap with plottype 7 LineWithBreaks)
      const resPlot = showPivots ? (resChanged ? NaN : resistance) : NaN;
      const supPlot = showPivots ? (supChanged ? NaN : supportVal) : NaN;

      return [emaValue, resPlot, supPlot, sellSignal, buySignal];
    };
  },
});

export default createEmaPivotesIndicator;
