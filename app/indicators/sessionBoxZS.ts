// ZS Indicador Caja - Aperturas
// This indicator acts as a toggle for the session box drawer.
// It needs at least one plot so TradingView keeps calling main().
// The plot is invisible (transparency 100) — the actual rectangles
// are drawn by sessionBoxDrawer via createMultipointShape.

import { sessionBoxHeartbeat } from '@/utils/sessionBoxDrawer';

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
      { id: 'dummy', type: 'line' },
    ],

    styles: {
      dummy: { title: 'Session Box' },
    },

    defaults: {
      styles: {
        dummy: {
          linestyle: 0,
          visible: false,
          linewidth: 0,
          plottype: 0,
          trackPrice: false,
          transparency: 100,
          color: '#000000',
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
      (this as any)._context = context;
      (this as any)._input = inputCallback;

      // Signal to sessionBoxDrawer that this indicator is active
      sessionBoxHeartbeat();

      return [null];
    };
  },
});

export default createSessionBoxIndicator;
