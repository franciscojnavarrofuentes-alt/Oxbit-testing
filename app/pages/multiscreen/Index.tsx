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

  // Hide side panels using MutationObserver for dynamic content
  useEffect(() => {
    const hideSidePanels = () => {
      const containers = document.querySelectorAll('.multiscreen-trading-wrapper');

      containers.forEach(container => {
        // More aggressive selector - find any element with specific text
        const allElements = container.querySelectorAll('*');

        allElements.forEach(element => {
          const text = (element as HTMLElement).innerText || '';
          const htmlElement = element as HTMLElement;

          // Check if this element or parent should be hidden
          if (
            text.startsWith('Markets') ||
            text.startsWith('Order book') ||
            text.startsWith('Last trades') ||
            htmlElement.classList.contains('orderbook') ||
            htmlElement.getAttribute('data-testid')?.includes('orderbook') ||
            htmlElement.getAttribute('data-testid')?.includes('market-selector')
          ) {
            // Find the closest parent oui-box
            let parent = htmlElement.closest('.oui-box');
            if (parent) {
              // Don't hide if it contains the chart or positions
              const hasChart = parent.querySelector('iframe') || parent.querySelector('[id^="tradingview_"]');
              const hasPositions = parent.querySelector('[role="tablist"]');

              if (!hasChart && !hasPositions) {
                (parent as HTMLElement).style.display = 'none';
                console.log('Hiding panel:', text.substring(0, 30));
              }
            }
          }
        });
      });
    };

    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
      hideSidePanels();
    });

    // Start observing
    const containers = document.querySelectorAll('.multiscreen-trading-wrapper');
    containers.forEach(container => {
      observer.observe(container, {
        childList: true,
        subtree: true,
      });
    });

    // Initial run with delays
    hideSidePanels();
    const timer1 = setTimeout(hideSidePanels, 500);
    const timer2 = setTimeout(hideSidePanels, 1500);
    const timer3 = setTimeout(hideSidePanels, 3000);
    const timer4 = setTimeout(hideSidePanels, 5000);

    return () => {
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
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
