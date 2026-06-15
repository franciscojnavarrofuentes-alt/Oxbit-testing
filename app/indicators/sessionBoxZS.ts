// ZS Indicador Caja - Aperturas
// This indicator acts as a toggle for the session box drawer.
// It renders no plots itself — it only sends a heartbeat signal via
// sessionBoxHeartbeat() so the drawer knows to draw rectangles
// using createMultipointShape (which produces perfect boxes, not staircases).

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

    plots: [],
    styles: {},
    defaults: {
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

      return [];
    };
  },
});

export default createSessionBoxIndicator;
