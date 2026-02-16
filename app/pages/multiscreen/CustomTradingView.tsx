import { useEffect } from "react";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
}

export function CustomTradingView({ symbol }: CustomTradingViewProps) {
  const config = useOrderlyConfig();

  // ULTRA AGGRESSIVE: Hide sidebars with continuous monitoring
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let attempts = 0;
    const MAX_ATTEMPTS = 200; // Run for 20 seconds (200 * 100ms)

    const hideSidebars = () => {
      attempts++;

      // Find all oui-box elements in multiscreen
      const boxes = document.querySelectorAll('.multiscreen-trading-wrapper .oui-box');

      boxes.forEach((box) => {
        const htmlBox = box as HTMLElement;
        const text = htmlBox.textContent || '';
        const computedStyle = window.getComputedStyle(htmlBox);
        const width = parseInt(computedStyle.width);

        // Criteria to identify sidebars:
        // 1. Contains "Markets" text (left sidebar)
        // 2. Contains "Order book" or "Last trades" (right sidebar)
        // 3. Has fixed width less than 400px (typical sidebar width)
        // 4. Is first or last child (structural position)
        // 5. Contains specific right sidebar indicators

        const isMarketsList = text.includes('Markets') && text.includes('RWA') && text.includes('New');

        // More aggressive right sidebar detection
        const isOrderBook = text.includes('Order book') ||
                           text.includes('Last trades') ||
                           text.includes('Orderbook') ||
                           text.includes('Price') && text.includes('Amount') && text.includes('Total') ||
                           text.includes('Bid') || text.includes('Ask');

        // Wider threshold for narrow boxes
        const isNarrowBox = width > 0 && width < 400;
        const parent = htmlBox.parentElement;
        const isFirstChild = parent?.firstElementChild === htmlBox;
        const isLastChild = parent?.lastElementChild === htmlBox;

        // Check if it contains chart (should NOT hide)
        const hasChart = htmlBox.querySelector('iframe') ||
                        htmlBox.querySelector('[id^="tradingview_"]') ||
                        htmlBox.querySelector('canvas');

        // Check if it contains positions panel (should NOT hide)
        const hasPositions = htmlBox.querySelector('[role="tablist"]') ||
                            text.includes('Positions (') ||
                            text.includes('Orders (') ||
                            text.includes('TP/SL') ||
                            text.includes('Close all');

        // HIDE if it matches sidebar criteria and doesn't contain chart/positions
        if (!hasChart && !hasPositions) {
          // Main detection: Markets, Order book, or narrow last child
          if (isMarketsList || isOrderBook || (isNarrowBox && isLastChild)) {
            htmlBox.style.setProperty('display', 'none', 'important');
            htmlBox.style.setProperty('visibility', 'hidden', 'important');
            htmlBox.style.setProperty('width', '0', 'important');
            htmlBox.style.setProperty('min-width', '0', 'important');
            htmlBox.style.setProperty('max-width', '0', 'important');
            htmlBox.style.setProperty('opacity', '0', 'important');
            htmlBox.style.setProperty('pointer-events', 'none', 'important');
            console.log('🚫 Hidden sidebar:', {
              preview: text.substring(0, 50),
              width,
              isLast: isLastChild,
              isOrderBook,
              isMarkets: isMarketsList
            });
          }
        }
      });

      // Stop after MAX_ATTEMPTS
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        console.log('✅ Sidebar hiding complete after', attempts, 'attempts');
      }
    };

    // Run immediately
    hideSidebars();

    // Run continuously every 100ms for 20 seconds
    intervalId = setInterval(hideSidebars, 100);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [symbol]);

  return (
    <div className="custom-trading-view-wrapper">
      <TradingPage
        symbol={symbol}
        tradingViewConfig={config.tradingPage.tradingViewConfig}
        sharePnLConfig={config.tradingPage.sharePnLConfig}
      />
    </div>
  );
}
