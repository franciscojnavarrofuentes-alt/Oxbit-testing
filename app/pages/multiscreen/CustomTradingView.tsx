import { useEffect } from "react";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
}

export function CustomTradingView({ symbol }: CustomTradingViewProps) {
  const config = useOrderlyConfig();

  // ULTRA AGGRESSIVE: Hide sidebars with continuous monitoring + MutationObserver
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let observer: MutationObserver | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 300; // Run for 30 seconds (300 * 100ms)

    const forceHideElement = (htmlBox: HTMLElement, reason: string) => {
      htmlBox.style.setProperty('display', 'none', 'important');
      htmlBox.style.setProperty('visibility', 'hidden', 'important');
      htmlBox.style.setProperty('width', '0', 'important');
      htmlBox.style.setProperty('min-width', '0', 'important');
      htmlBox.style.setProperty('max-width', '0', 'important');
      htmlBox.style.setProperty('opacity', '0', 'important');
      htmlBox.style.setProperty('pointer-events', 'none', 'important');
      htmlBox.style.setProperty('position', 'absolute', 'important');
      htmlBox.style.setProperty('overflow', 'hidden', 'important');
      console.log('🚫 Hidden sidebar:', reason, htmlBox.textContent?.substring(0, 30));
    };

    const hideSidebars = () => {
      attempts++;

      // Strategy 1: Find all oui-box elements
      const boxes = document.querySelectorAll('.multiscreen-trading-wrapper .oui-box');

      boxes.forEach((box) => {
        const htmlBox = box as HTMLElement;
        const text = htmlBox.textContent || '';
        const computedStyle = window.getComputedStyle(htmlBox);
        const width = parseInt(computedStyle.width);

        // Check if it contains chart (should NOT hide)
        const hasChart = htmlBox.querySelector('iframe') ||
                        htmlBox.querySelector('[id^="tradingview_"]') ||
                        htmlBox.querySelector('canvas') ||
                        htmlBox.querySelector('.tv-lightweight-charts');

        // Check if it contains positions panel (should NOT hide)
        const hasPositions = htmlBox.querySelector('[role="tablist"]') ||
                            text.includes('Positions') ||
                            text.includes('Orders') ||
                            text.includes('TP/SL') ||
                            text.includes('Close all') ||
                            text.includes('Unrealized PnL');

        if (hasChart || hasPositions) {
          return; // Don't hide chart or positions
        }

        // AGGRESSIVE DETECTION - Use OR logic, not AND

        // Left sidebar detection (Markets)
        const isLeftSidebar =
          text.includes('Markets') ||
          text.includes('Search market') ||
          (text.includes('All') && text.includes('New listings')) ||
          htmlBox.querySelector('input[placeholder*="Search"]') !== null;

        // Right sidebar detection (Order book, Last trades)
        const isRightSidebar =
          text.includes('Order book') ||
          text.includes('Last trades') ||
          text.includes('Orderbook') ||
          text.includes('Bid') ||
          text.includes('Ask') ||
          (text.includes('Price') && text.includes('Amount'));

        // Positional detection
        const parent = htmlBox.parentElement;
        const isFirstChild = parent?.firstElementChild === htmlBox;
        const isLastChild = parent?.lastElementChild === htmlBox;

        // Width-based detection (sidebars are typically narrow)
        const isNarrowBox = width > 0 && width < 450;

        // HIDE if matches ANY sidebar criteria
        if (isLeftSidebar) {
          forceHideElement(htmlBox, 'Left sidebar (Markets)');
        } else if (isRightSidebar) {
          forceHideElement(htmlBox, 'Right sidebar (Order book/Last trades)');
        } else if (isNarrowBox && (isFirstChild || isLastChild)) {
          forceHideElement(htmlBox, `Narrow ${isFirstChild ? 'first' : 'last'} child (${width}px)`);
        }
      });

      // Strategy 2: Direct class-based hiding for known sidebar classes
      const knownSidebarSelectors = [
        '.multiscreen-trading-wrapper [class*="sidebar"]',
        '.multiscreen-trading-wrapper [class*="Sidebar"]',
        '.multiscreen-trading-wrapper [class*="markets"]',
        '.multiscreen-trading-wrapper [class*="Markets"]',
        '.multiscreen-trading-wrapper [class*="orderbook"]',
        '.multiscreen-trading-wrapper [class*="Orderbook"]',
      ];

      knownSidebarSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const htmlEl = el as HTMLElement;
          if (!htmlEl.querySelector('iframe') && !htmlEl.querySelector('[role="tablist"]')) {
            forceHideElement(htmlEl, `Class-based: ${selector}`);
          }
        });
      });

      // Stop after MAX_ATTEMPTS
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        console.log('✅ Sidebar hiding complete after', attempts, 'attempts');
      }
    };

    // Run immediately
    hideSidebars();

    // Run continuously every 100ms for 30 seconds
    intervalId = setInterval(hideSidebars, 100);

    // Also use MutationObserver to catch dynamically added elements
    observer = new MutationObserver(() => {
      hideSidebars();
    });

    const wrapper = document.querySelector('.multiscreen-trading-wrapper');
    if (wrapper) {
      observer.observe(wrapper, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (observer) {
        observer.disconnect();
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
