// EMA y Pivotes ZS Strategy v4
// Muestra EMA (step line), niveles de soporte/resistencia por pivotes de HTF,
// y señales BUY/SELL cuando el precio toca un pivote y cruza la EMA.
// Basado en el indicador Pine Script de @ZCoinTV y @ScottFDX

export const createEmaPivotesIndicator = (PineJS: any): any => ({
  name: 'EMA y Pivotes ZS v4',
  metainfo: {
    _metainfoVersion: 53,
    id: 'EmaPivotesZS@custom-1',
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
    (this as any).init = function (context: any, _inputCallback: any) {
      // TEST 1: No new_sym, no adopt — just EMA
    };

    (this as any).main = function (context: any, _inputCallback: any) {
      context.select_sym(0);

      const closeSeries = context.new_var(PineJS.Std.close(context));
      const emaValue = PineJS.Std.ema(closeSeries, 12, context);

      return [NaN, NaN, emaValue, NaN, NaN];
    };
  },
});

export default createEmaPivotesIndicator;
