// EMA y Pivotes ZS Strategy v5
// Muestra EMA, múltiples niveles de soporte/resistencia por pivotes de HTF,
// y señales BUY/SELL cuando el precio toca un pivote y cruza la EMA.
// Basado en el indicador Pine Script de @ZCoinTV y @ScottFDX

export const createEmaPivotesIndicator = (PineJS: any): any => ({
  name: 'EMA y Pivotes ZS v5',
  metainfo: {
    _metainfoVersion: 51,
    id: 'EmaPivotesZS@tv-basicstudies-1',
    name: 'EMA y Pivotes ZS v5',
    description: 'EMA y Pivotes ZS Strategy v5',
    shortDescription: 'EMA Pivotes ZS',

    is_price_study: true,
    isCustomIndicator: true,

    format: {
      type: 'price',
      precision: 2,
    },

    plots: [
      { id: 'ema_line', type: 'line' },
      { id: 'resistance1', type: 'line' },
      { id: 'resistance2', type: 'line' },
      { id: 'resistance3', type: 'line' },
      { id: 'support1', type: 'line' },
      { id: 'support2', type: 'line' },
      { id: 'support3', type: 'line' },
      { id: 'sell_signal', type: 'shapes' },
      { id: 'buy_signal', type: 'shapes' },
    ],

    defaults: {
      styles: {
        ema_line: {
          linestyle: 0,
          linewidth: 2,
          plottype: 0, // smooth line (curve)
          trackPrice: false,
          transparency: 0,
          color: '#FFFFFF',
        },
        resistance1: {
          linestyle: 0,
          linewidth: 2,
          plottype: 6, // step line
          trackPrice: false,
          transparency: 0,
          color: '#BA160C',
        },
        resistance2: {
          linestyle: 0,
          linewidth: 2,
          plottype: 6,
          trackPrice: false,
          transparency: 30,
          color: '#BA160C',
        },
        resistance3: {
          linestyle: 0,
          linewidth: 1,
          plottype: 6,
          trackPrice: false,
          transparency: 60,
          color: '#BA160C',
        },
        support1: {
          linestyle: 0,
          linewidth: 2,
          plottype: 6, // step line
          trackPrice: false,
          transparency: 0,
          color: '#FFEC00',
        },
        support2: {
          linestyle: 0,
          linewidth: 2,
          plottype: 6,
          trackPrice: false,
          transparency: 30,
          color: '#FFEC00',
        },
        support3: {
          linestyle: 0,
          linewidth: 1,
          plottype: 6,
          trackPrice: false,
          transparency: 60,
          color: '#FFEC00',
        },
        sell_signal: {
          color: '#BA160C',
          plottype: 'shape_diamond',
          location: 'AboveBar',
          size: 'small',
          text: '',
        },
        buy_signal: {
          color: '#FFEC00',
          plottype: 'shape_diamond',
          location: 'BelowBar',
          size: 'small',
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
      resistance1: { title: 'Resistance 1', histogramBase: 0 },
      resistance2: { title: 'Resistance 2', histogramBase: 0 },
      resistance3: { title: 'Resistance 3', histogramBase: 0 },
      support1: { title: 'Support 1', histogramBase: 0 },
      support2: { title: 'Support 2', histogramBase: 0 },
      support3: { title: 'Support 3', histogramBase: 0 },
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
      const htfPeriod = inputCallback(1);
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

      // -- Track previous pivot levels (shift when HTF bar changes) --
      const res1Var = context.new_var(NaN);
      const res2Var = context.new_var(NaN);
      const res3Var = context.new_var(NaN);
      const sup1Var = context.new_var(NaN);
      const sup2Var = context.new_var(NaN);
      const sup3Var = context.new_var(NaN);

      const prevResistance = resistanceSeries.get(1);
      const prevSupport = supportSeries.get(1);

      // Detect when HTF bar changes (new pivot level)
      const resChanged = resistance !== prevResistance && !isNaN(prevResistance);
      const supChanged = supportVal !== prevSupport && !isNaN(prevSupport);

      // Shift resistance levels when a new HTF high appears
      if (resChanged) {
        res3Var.set(res2Var.get(1));
        res2Var.set(res1Var.get(1));
        res1Var.set(resistance);
      } else {
        res1Var.set(isNaN(res1Var.get(1)) ? resistance : res1Var.get(1));
        res2Var.set(res2Var.get(1));
        res3Var.set(res3Var.get(1));
      }

      // Shift support levels when a new HTF low appears
      if (supChanged) {
        sup3Var.set(sup2Var.get(1));
        sup2Var.set(sup1Var.get(1));
        sup1Var.set(supportVal);
      } else {
        sup1Var.set(isNaN(sup1Var.get(1)) ? supportVal : sup1Var.get(1));
        sup2Var.set(sup2Var.get(1));
        sup3Var.set(sup3Var.get(1));
      }

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

      // -- Touch detection (check against ALL resistance/support levels) --
      const r1 = res1Var.get(0);
      const r2 = res2Var.get(0);
      const r3 = res3Var.get(0);
      const s1 = sup1Var.get(0);
      const s2 = sup2Var.get(0);
      const s3 = sup3Var.get(0);

      const touchesRes = (level: number) =>
        !isNaN(level) && curHigh >= level && prevHigh < level;
      const touchesSup = (level: number) =>
        !isNaN(level) && curLow <= level && prevLow > level;

      const touchResistance = touchesRes(r1) || touchesRes(r2) || touchesRes(r3);
      const touchSupport = touchesSup(s1) || touchesSup(s2) || touchesSup(s3);

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
      const touchedRes = barsSinceTouchRes <= cooldownBars;
      const touchedSup = barsSinceTouchSup <= cooldownBars;

      // EMA crossover/crossunder
      const closeBelowEma = curClose < curEma && prevClose >= prevEma;
      const closeAboveEma = curClose > curEma && prevClose <= prevEma;

      // Raw conditions
      const sellConditionRaw = touchedRes && closeBelowEma;
      const buyConditionRaw = touchedSup && closeAboveEma;

      // Cooldown tracking
      const barsSinceSellVar = context.new_var(999);
      const barsSinceBuyVar = context.new_var(999);

      if (sellConditionRaw && barsSinceSellVar.get(0) > cooldownBars) {
        barsSinceSellVar.set(0);
      } else {
        barsSinceSellVar.set((barsSinceSellVar.get(1) || 0) + 1);
      }

      if (buyConditionRaw && barsSinceBuyVar.get(0) > cooldownBars) {
        barsSinceBuyVar.set(0);
      } else {
        barsSinceBuyVar.set((barsSinceBuyVar.get(1) || 0) + 1);
      }

      const sellSignal = barsSinceSellVar.get(0) === 0 ? 1 : NaN;
      const buySignal = barsSinceBuyVar.get(0) === 0 ? 1 : NaN;

      // -- Output --
      return [
        emaValue,
        showPivots ? r1 : NaN,
        showPivots ? r2 : NaN,
        showPivots ? r3 : NaN,
        showPivots ? s1 : NaN,
        showPivots ? s2 : NaN,
        showPivots ? s3 : NaN,
        sellSignal,
        buySignal,
      ];
    };
  },
});

export default createEmaPivotesIndicator;
