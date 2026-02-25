// Liquidation Levels Custom Indicator for TradingView
// Shows 10x leverage liquidation levels

export const createLiquidationLevelsIndicator = (PineJS: any): any => ({
  name: 'Liquidation Levels',
  metainfo: {
    _metainfoVersion: 51,
    id: 'LiquidationLevels@tv-basicstudies-1',
    name: 'Liquidation Levels',
    description: 'Shows liquidation levels for 10x leverage positions',
    shortDescription: 'Liq Levels',

    is_price_study: true,
    isCustomIndicator: true,

    format: {
      type: 'price',
      precision: 2,
    },

    plots: [
      { id: 'long_liq', type: 'line' },
      { id: 'short_liq', type: 'line' },
    ],

    defaults: {
      styles: {
        long_liq: {
          linestyle: 0,
          linewidth: 2,
          plottype: 2,
          trackPrice: false,
          transparency: 30,
          color: '#FF4444',
        },
        short_liq: {
          linestyle: 0,
          linewidth: 2,
          plottype: 2,
          trackPrice: false,
          transparency: 30,
          color: '#4ECDC4',
        },
      },
      precision: 2,
      inputs: {},
    },

    styles: {
      long_liq: {
        title: 'Long Liq 10x',
        histogramBase: 0,
      },
      short_liq: {
        title: 'Short Liq 10x',
        histogramBase: 0,
      },
    },

    inputs: [],
  },

  constructor: function () {
    (this as any).init = function(context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;
    };

    (this as any).main = function (context: any, inputCallback: any) {
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      // Get close price using PineJS standard library
      const closePrice = PineJS.Std.close((this as any)._context);

      // Calculate liquidation levels for 10x leverage
      // Long liquidation: -10.5% (10% leverage + 0.5% fee)
      // Short liquidation: +10.5% (10% leverage + 0.5% fee)
      const longLiq = closePrice * 0.895;  // -10.5%
      const shortLiq = closePrice * 1.105; // +10.5%

      return [longLiq, shortLiq];
    };
  },
});

export default createLiquidationLevelsIndicator;
