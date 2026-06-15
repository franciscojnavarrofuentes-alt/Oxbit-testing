import { useEffect } from "react";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";
import { installSessionBoxDrawer } from "@/utils/sessionBoxDrawer";

interface CustomTradingViewProps {
  symbol: string;
  onSymbolChange?: (data: any) => void;
}

export function CustomTradingView({ symbol, onSymbolChange }: CustomTradingViewProps) {
  const config = useOrderlyConfig();

  useEffect(() => {
    installSessionBoxDrawer();
  }, []);

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
