import { useState, useCallback } from "react";
import { API } from "@orderly.network/types";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";
import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import { getMultiScreenSymbol, updateMultiScreenSymbol } from "@/utils/storage";
import SymbolSelector from "./SymbolSelector";

export default function MultiScreenIndex() {
  const config = useOrderlyConfig();
  const [leftSymbol, setLeftSymbol] = useState(getMultiScreenSymbol('left'));
  const [rightSymbol, setRightSymbol] = useState(getMultiScreenSymbol('right'));

  const onLeftSymbolChange = useCallback((data: API.Symbol) => {
    setLeftSymbol(data.symbol);
    updateMultiScreenSymbol('left', data.symbol);
  }, []);

  const onRightSymbolChange = useCallback((data: API.Symbol) => {
    setRightSymbol(data.symbol);
    updateMultiScreenSymbol('right', data.symbol);
  }, []);

  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Multi-screen");

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="multiscreen-container">
        <div className="multiscreen-chart-panel">
          <SymbolSelector
            symbol={leftSymbol}
            onSymbolChange={onLeftSymbolChange}
            label="Left Chart"
          />
          <div className="multiscreen-trading-wrapper">
            <TradingPage
              symbol={leftSymbol}
              onSymbolChange={onLeftSymbolChange}
              tradingViewConfig={config.tradingPage.tradingViewConfig}
              sharePnLConfig={config.tradingPage.sharePnLConfig}
            />
          </div>
        </div>

        <div className="multiscreen-chart-panel">
          <SymbolSelector
            symbol={rightSymbol}
            onSymbolChange={onRightSymbolChange}
            label="Right Chart"
          />
          <div className="multiscreen-trading-wrapper">
            <TradingPage
              symbol={rightSymbol}
              onSymbolChange={onRightSymbolChange}
              tradingViewConfig={config.tradingPage.tradingViewConfig}
              sharePnLConfig={config.tradingPage.sharePnLConfig}
            />
          </div>
        </div>
      </div>
    </>
  );
}
