import { useEffect } from "react";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
  onSymbolChange?: (data: any) => void;
}

export function CustomTradingView({ symbol, onSymbolChange }: CustomTradingViewProps) {
  const config = useOrderlyConfig();

  // Hide sidebars (Markets left, Order book/Last trades right) - Simplified approach
  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 100; // 10 seconds (100 * 100ms)

    const hideSidebars = () => {
      attempts++;

      // Find all oui-box elements within this wrapper
      const boxes = document.querySelectorAll('.multiscreen-trading-wrapper .oui-box');

      boxes.forEach((box) => {
        const htmlBox = box as HTMLElement;
        const text = htmlBox.textContent || '';
        const computedStyle = window.getComputedStyle(htmlBox);
        const width = parseInt(computedStyle.width);

        // Protect chart (has iframe or canvas)
        const hasChart = htmlBox.querySelector('iframe') ||
                        htmlBox.querySelector('canvas') ||
                        htmlBox.querySelector('[id^="tradingview_"]');

        // Protect positions/orders panel (has table or tabs)
        const hasPositionsPanel = htmlBox.querySelector('[role="tablist"]') ||
                                 htmlBox.querySelector('table') ||
                                 text.includes('Positions') ||
                                 text.includes('Orders') ||
                                 text.includes('TP/SL');

        if (hasChart || hasPositionsPanel) {
          return; // Don't hide these
        }

        // Detect left sidebar (Markets)
        const isLeftSidebar = text.includes('Markets') ||
                             text.includes('Search market') ||
                             htmlBox.querySelector('input[placeholder*="Search"]');

        // Detect right sidebar (Order book, Last trades)
        const isRightSidebar = text.includes('Order book') ||
                              text.includes('Last trades') ||
                              (text.includes('Price') && text.includes('Amount'));

        // Also hide very narrow boxes at edges (likely sidebars)
        const isNarrowEdgeBox = width > 0 && width < 400 &&
                               (htmlBox.parentElement?.firstElementChild === htmlBox ||
                                htmlBox.parentElement?.lastElementChild === htmlBox);

        // Hide if it's a sidebar
        if (isLeftSidebar || isRightSidebar || isNarrowEdgeBox) {
          htmlBox.style.setProperty('display', 'none', 'important');
          htmlBox.style.setProperty('width', '0', 'important');
          htmlBox.style.setProperty('min-width', '0', 'important');
          htmlBox.style.setProperty('overflow', 'hidden', 'important');
          htmlBox.style.setProperty('position', 'absolute', 'important');
        }
      });

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
      }
    };

    // Initial run
    setTimeout(hideSidebars, 100);

    // Run periodically for 10 seconds
    const intervalId = setInterval(hideSidebars, 100);

    return () => clearInterval(intervalId);
  }, [symbol]);

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
