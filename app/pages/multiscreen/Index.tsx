import { useState, useCallback, useEffect } from "react";
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

  // Hide side panels using JavaScript after component mounts
  useEffect(() => {
    const hideSidePanels = () => {
      // Hide all elements in multiscreen that match sidebar patterns
      const containers = document.querySelectorAll('.multiscreen-trading-wrapper .oui-trading-page');

      containers.forEach(container => {
        const allBoxes = container.querySelectorAll('.oui-box');

        allBoxes.forEach(box => {
          const text = box.textContent || '';
          const hasChart = box.querySelector('iframe') || box.querySelector('[id^="tradingview_"]');
          const hasPositions = box.querySelector('[role="tablist"]') ||
                              text.includes('Positions') ||
                              text.includes('Pending');

          // Hide if contains Markets, Order book, or Last trades
          if (text.includes('Markets') && !hasChart && !hasPositions) {
            (box as HTMLElement).style.display = 'none';
          }
          if (text.includes('Order book') || text.includes('Last trades')) {
            (box as HTMLElement).style.display = 'none';
          }
        });
      });
    };

    // Run immediately and after a short delay to catch dynamic content
    hideSidePanels();
    const timer = setTimeout(hideSidePanels, 500);
    const timer2 = setTimeout(hideSidePanels, 1000);
    const timer3 = setTimeout(hideSidePanels, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [leftSymbol, rightSymbol]);

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
