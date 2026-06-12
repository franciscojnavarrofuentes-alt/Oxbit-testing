// TEST: Minimal EMA-only indicator to isolate crash

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

    format: {
      type: 'price',
      precision: 2,
    },

    plots: [{ id: 'ema', type: 'line' }],

    styles: {
      ema: { title: 'EMA' },
    },

    defaults: {
      styles: {
        ema: {
          linestyle: 0,
          linewidth: 2,
          plottype: 0,
          trackPrice: false,
          transparency: 0,
          color: '#ffffff',
        },
      },
      precision: 2,
      inputs: {},
    },

    inputs: [],
  },

  constructor: function () {
    (this as any).init = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;
    };

    (this as any).main = function (context: any, inputCallback: any) {
      const closeSeries = context.new_var(PineJS.Std.close(context));
      const emaValue = PineJS.Std.ema(closeSeries, 12, context);

      return [emaValue];
    };
  },
});

export default createEmaPivotesIndicator;
