import { useEffect } from "react";
import { TradingPage } from "@orderly.network/trading";
import { usePositionStream } from "@orderly.network/hooks";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
  onSymbolChange?: (data: any) => void;
}

export function CustomTradingView({ symbol, onSymbolChange }: CustomTradingViewProps) {
  const config = useOrderlyConfig();
  const [{ rows }] = usePositionStream(symbol);

  // Feed position liquidation price to TradingView indicator via window global
  useEffect(() => {
    const map = ((window as any).__PACODEX_LIQ_MAP__ ??= {});
    const position = rows?.[0];
    if (position && position.est_liq_price) {
      map[symbol] = {
        est_liq_price: position.est_liq_price,
        position_qty: position.position_qty,
        symbol: position.symbol,
      };
    } else {
      delete map[symbol];
    }
    return () => {
      delete map[symbol];
    };
  }, [rows, symbol]);

  return (
    <div className="custom-trading-view-wrapper">
      <TradingPage
        symbol={symbol}
        onSymbolChange={onSymbolChange}
        tradingViewConfig={config.tradingPage.tradingViewConfig}
        sharePnLConfig={config.tradingPage.sharePnLConfig}
      />
    </div>
  );
}
