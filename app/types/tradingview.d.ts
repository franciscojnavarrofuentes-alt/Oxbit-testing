declare global {
  interface Window {
    TradingView?: {
      widget: new (config: any) => {
        onChartReady: (callback: () => void) => void;
        remove: () => void;
        [key: string]: any;
      };
      [key: string]: any;
    };
  }
}

export {};
