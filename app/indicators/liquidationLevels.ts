// Liquidation Price Indicator for TradingView
// Shows the real liquidation price of the user's open position
// Reads position data from window.__PACODEX_LIQ__ (set by Symbol.tsx)

export const createLiquidationLevelsIndicator = (PineJS: any): any => ({
  name: 'Liq. Price',
  metainfo: {
    _metainfoVersion: 51,
    id: 'LiquidationLevels@tv-basicstudies-1',
    name: 'Liq. Price',
    description: 'Shows liquidation price of your open position',
    shortDescription: 'Liq. Price',

    is_price_study: true,
    isCustomIndicator: true,

    format: {
      type: 'price',
      precision: 2,
    },

    plots: [
      { id: 'liq_price', type: 'line' },
    ],

    defaults: {
      styles: {
        liq_price: {
          linestyle: 2,
          linewidth: 1,
          plottype: 0,
          trackPrice: true,
          transparency: 20,
          color: '#FFD146',
        },
      },
      precision: 2,
      inputs: {},
    },

    styles: {
      liq_price: {
        title: 'Liq. Price',
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

      const liqData = (window as any).__PACODEX_LIQ__;
      if (!liqData || !liqData.est_liq_price) return [NaN];
      return [liqData.est_liq_price];
    };
  },
});

export default createLiquidationLevelsIndicator;
