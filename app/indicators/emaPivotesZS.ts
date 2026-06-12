// EMA y Pivotes ZS Strategy v4
// Muestra EMA (step line), niveles de soporte/resistencia por pivotes de HTF,
// y señales BUY/SELL cuando el precio toca un pivote y cruza la EMA.
// Basado en el indicador Pine Script de @ZCoinTV y @ScottFDX

export const createEmaPivotesIndicator = (PineJS: any): any => ({
  name: 'EMA y Pivotes ZS v4',
  metainfo: {
    _metainfoVersion: 53,
    id: 'EmaPivotesZS@tv-basicstudies-1',
    name: 'EMA y Pivotes ZS v4',
    description: 'EMA y Pivotes ZS Strategy v4',
    shortDescription: 'EMA Pivotes ZS',

    is_price_study: true,
    isCustomIndicator: true,
    linkedToSeries: true,

    format: {
      type: 'price',
      precision: 2,
    },

    plots: [
      { id: 'resistencia', type: 'line' },
      { id: 'soporte', type: 'line' },
      { id: 'ema', type: 'line' },
      { id: 'sellSignal', type: 'shapes' },
      { id: 'buySignal', type: 'shapes' },
    ],

    styles: {
      resistencia: { title: 'Resistencia' },
      soporte: { title: 'Soporte' },
      ema: { title: 'EMA' },
      sellSignal: { title: 'SELL Signal' },
      buySignal: { title: 'BUY Signal' },
    },

    defaults: {
      styles: {
        resistencia: {
          linestyle: 0,
          linewidth: 2,
          plottype: 0,
          trackPrice: false,
          transparency: 0,
          color: '#ba160c',
        },
        soporte: {
          linestyle: 0,
          linewidth: 2,
          plottype: 0,
          trackPrice: false,
          transparency: 0,
          color: '#ffec00',
        },
        ema: {
          linestyle: 0,
          linewidth: 2,
          plottype: 0,
          trackPrice: false,
          transparency: 0,
          color: '#ffffff',
        },
        sellSignal: {
          color: '#ba160c',
          textColor: '#ffffff',
          plottype: 'shape_label_down',
          transparency: 0,
          visible: true,
          location: 'AboveBar',
          size: 'normal',
        },
        buySignal: {
          color: '#ffec00',
          textColor: '#000000',
          plottype: 'shape_label_up',
          transparency: 0,
          visible: true,
          location: 'BelowBar',
          size: 'normal',
        },
      },
      precision: 2,
      inputs: {
        emaPeriods: 12,
        showPivots: true,
        pivotResolution: '480',
      },
    },

    inputs: [
      {
        id: 'emaPeriods',
        name: 'EMA Periods',
        type: 'integer',
        defval: 12,
        min: 1,
        max: 200,
      },
      {
        id: 'showPivots',
        name: 'Mostrar Pivotes',
        type: 'bool',
        defval: true,
      },
      {
        id: 'pivotResolution',
        name: 'Periodos',
        type: 'text',
        defval: '480',
      },
    ],
  },

  constructor: function () {
    (this as any).init = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      const pivotResolution = (this as any)._input(2);
      const symbol = PineJS.Std.tickerid((this as any)._context);

      // request.security(syminfo.tickerid, Periodos, ...)
      (this as any)._context.new_sym(symbol, pivotResolution);

      (this as any)._lastResValue = NaN;
      (this as any)._lastSupValue = NaN;
      (this as any)._lastTouchRes = undefined;
      (this as any)._lastTouchSup = undefined;
      (this as any)._barsSinceSell = undefined;
      (this as any)._barsSinceBuy = undefined;
      (this as any)._prevTouchedRes = false;
      (this as any)._prevTouchedSup = false;
      (this as any)._prevSellCondition = false;
      (this as any)._prevBuyCondition = false;
    };

    (this as any).main = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      const emaPeriods = (this as any)._input(0);
      const showPivots = (this as any)._input(1);

      // Main symbol / chart timeframe
      (this as any)._context.select_sym(0);

      const mainTime = (this as any)._context.new_var(
        (this as any)._context.symbol.time
      );

      const closeSeries = (this as any)._context.new_var(
        PineJS.Std.close((this as any)._context)
      );
      const highSeries = (this as any)._context.new_var(
        PineJS.Std.high((this as any)._context)
      );
      const lowSeries = (this as any)._context.new_var(
        PineJS.Std.low((this as any)._context)
      );

      const close = closeSeries.get(0);
      const high = highSeries.get(0);
      const low = lowSeries.get(0);

      const closePrev = closeSeries.get(1);
      const highPrev = highSeries.get(1);
      const lowPrev = lowSeries.get(1);

      const emaValue = PineJS.Std.ema(
        closeSeries,
        emaPeriods,
        (this as any)._context
      );

      const emaSeries = (this as any)._context.new_var(emaValue);
      const emaPrev = emaSeries.get(1);

      // Secondary symbol / 400m timeframe
      (this as any)._context.select_sym(1);

      const pivotTime = (this as any)._context.new_var(
        (this as any)._context.symbol.time
      );

      const pivotHighSeries = (this as any)._context.new_var(
        PineJS.Std.high((this as any)._context)
      );
      const pivotLowSeries = (this as any)._context.new_var(
        PineJS.Std.low((this as any)._context)
      );

      // lookahead_on: adopt(secondaryTime, mainTime, 1)
      const rawRes = pivotHighSeries.adopt(pivotTime, mainTime, 1);
      const rawSup = pivotLowSeries.adopt(pivotTime, mainTime, 1);

      // Carry-forward: adopt mode 1 only returns values on HTF boundary bars.
      // On all other bars it returns NaN, so we persist the last known level.
      if (!isNaN(rawRes)) (this as any)._lastResValue = rawRes;
      if (!isNaN(rawSup)) (this as any)._lastSupValue = rawSup;

      const resistencia = (this as any)._lastResValue;
      const soporte = (this as any)._lastSupValue;

      // Back to main symbol
      (this as any)._context.select_sym(0);

      const resistenciaSeries = (this as any)._context.new_var(resistencia);
      const soporteSeries = (this as any)._context.new_var(soporte);

      const resistenciaPrev = resistenciaSeries.get(1);
      const soportePrev = soporteSeries.get(1);

      // Detectar toques de pivotes
      const touchResistencia =
        (high > resistencia && highPrev <= resistenciaPrev) ||
        (high >= resistencia && highPrev < resistenciaPrev);

      const touchSoporte =
        (low < soporte && lowPrev >= soportePrev) ||
        (low <= soporte && lowPrev > soportePrev);

      // barssince(touch_resistencia)
      if (touchResistencia) {
        (this as any)._lastTouchRes = 0;
      } else if ((this as any)._lastTouchRes !== undefined) {
        (this as any)._lastTouchRes += 1;
      }

      // barssince(touch_soporte)
      if (touchSoporte) {
        (this as any)._lastTouchSup = 0;
      } else if ((this as any)._lastTouchSup !== undefined) {
        (this as any)._lastTouchSup += 1;
      }

      const touchedRes =
        (this as any)._lastTouchRes !== undefined &&
        (this as any)._lastTouchRes >= 0 &&
        (this as any)._lastTouchRes <= 12;

      const touchedSup =
        (this as any)._lastTouchSup !== undefined &&
        (this as any)._lastTouchSup >= 0 &&
        (this as any)._lastTouchSup <= 12;

      const closeBelowEma = close < emaValue && closePrev >= emaPrev;
      const closeAboveEma = close > emaValue && closePrev <= emaPrev;

      // sell_condition = touched_res[1] and close_below_ema
      // buy_condition = touched_sup[1] and close_above_ema
      const sellCondition = (this as any)._prevTouchedRes && closeBelowEma;
      const buyCondition = (this as any)._prevTouchedSup && closeAboveEma;

      // bars_since_sell = ta.barssince(sell_condition[1])
      // bars_since_buy = ta.barssince(buy_condition[1])
      if ((this as any)._prevSellCondition) {
        (this as any)._barsSinceSell = 0;
      } else if ((this as any)._barsSinceSell !== undefined) {
        (this as any)._barsSinceSell += 1;
      }

      if ((this as any)._prevBuyCondition) {
        (this as any)._barsSinceBuy = 0;
      } else if ((this as any)._barsSinceBuy !== undefined) {
        (this as any)._barsSinceBuy += 1;
      }

      const canSell =
        (this as any)._barsSinceSell === undefined ||
        (this as any)._barsSinceSell > 12;

      const canBuy =
        (this as any)._barsSinceBuy === undefined ||
        (this as any)._barsSinceBuy > 12;

      const sellSignal = sellCondition && canSell;
      const buySignal = buyCondition && canBuy;

      // Guardar estados para la siguiente vela
      (this as any)._prevTouchedRes = touchedRes;
      (this as any)._prevTouchedSup = touchedSup;
      (this as any)._prevSellCondition = sellCondition;
      (this as any)._prevBuyCondition = buyCondition;

      // Break line when level changes (equivalent to Pine's color=na on change)
      const resChanged = !isNaN(resistenciaPrev) && resistencia !== resistenciaPrev;
      const supChanged = !isNaN(soportePrev) && soporte !== soportePrev;

      return [
        showPivots ? (resChanged ? null : resistencia) : null,
        showPivots ? (supChanged ? null : soporte) : null,
        emaValue,
        sellSignal ? resistencia : null,
        buySignal ? soporte : null,
      ];
    };
  },
});

export default createEmaPivotesIndicator;
