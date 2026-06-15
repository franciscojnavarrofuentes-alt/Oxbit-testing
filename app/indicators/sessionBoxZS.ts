// ZS Indicador Caja - Aperturas
// This indicator acts as a toggle for the session box drawer.
// It renders no plots itself — it only sends a heartbeat signal via
// window.__SESSION_BOX_HEARTBEAT__ so the drawer knows to draw rectangles
// using createMultipointShape (which produces perfect boxes, not staircases).

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
      if (typeof window !== 'undefined') {
        (window as any).__SESSION_BOX_HEARTBEAT__ = Date.now();
      }

      return [];
    };
  },
});

export default createSessionBoxIndicator;
