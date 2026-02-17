import { useEffect } from "react";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
  onSymbolChange?: (data: any) => void;
}

export function CustomTradingView({ symbol, onSymbolChange }: CustomTradingViewProps) {
  const config = useOrderlyConfig();

  // Strategic sidebar hiding - protect chart at all costs
  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 150; // 15 seconds
    let hiddenElements = new Set<HTMLElement>();

    const hasProtectedContent = (element: HTMLElement): boolean => {
      // Check if element or ANY descendant has chart or positions table
      return !!(
        element.querySelector('iframe') ||
        element.querySelector('canvas') ||
        element.querySelector('[id^="tradingview_"]') ||
        element.querySelector('table tbody') ||
        element.querySelector('[role="tablist"]')
      );
    };

    const forceHide = (element: HTMLElement, reason: string) => {
      if (hiddenElements.has(element)) return;

      // CRITICAL: Double-check for protected content
      if (hasProtectedContent(element)) {
        console.log(`⚠️  Skipped hiding (has protected content): ${reason}`);
        return;
      }

      element.style.setProperty('display', 'none', 'important');
      element.style.setProperty('visibility', 'hidden', 'important');
      element.style.setProperty('width', '0', 'important');
      element.style.setProperty('min-width', '0', 'important');
      element.style.setProperty('opacity', '0', 'important');
      element.style.setProperty('position', 'absolute', 'important');

      hiddenElements.add(element);
      console.log(`✅ Hidden ${reason}:`, element.textContent?.substring(0, 40));
    };

    const hideSidebars = () => {
      attempts++;

      // Strategy 1: Target specific sidebar containers by class/structure
      const wrapper = document.querySelector('.multiscreen-trading-wrapper');
      if (!wrapper) return;

      // Find direct children of trading page layout
      const layoutChildren = wrapper.querySelectorAll('.oui-trading-page > *');

      layoutChildren.forEach((child, index) => {
        const htmlChild = child as HTMLElement;
        const width = parseInt(window.getComputedStyle(htmlChild).width);
        const text = htmlChild.textContent || '';

        // Skip if has protected content
        if (hasProtectedContent(htmlChild)) {
          return;
        }

        // First child is usually Markets sidebar
        if (index === 0 && width < 350 && text.includes('Markets')) {
          forceHide(htmlChild, 'Markets sidebar (first child)');
          return;
        }

        // Last child is usually Order book/Last trades
        if (width < 350 && (text.includes('Order book') || text.includes('Last trades'))) {
          forceHide(htmlChild, 'Order book sidebar (last child)');
          return;
        }
      });

      // Strategy 2: Find elements with Order book/Last trades tabs
      const orderBookTabs = wrapper.querySelectorAll('[role="tab"]');

      orderBookTabs.forEach((tab) => {
        const tabText = tab.textContent || '';

        // Only target Order book/Last trades tabs, not Positions/Pending
        if (tabText.includes('Order book') || tabText.includes('Last trades')) {
          let parent = tab.parentElement;

          // Walk up to find sidebar container
          for (let i = 0; i < 8 && parent; i++) {
            const parentWidth = parseInt(window.getComputedStyle(parent).width);
            const parentText = parent.textContent || '';

            // Found sidebar: narrow width + contains "Order book"
            if (parentWidth > 0 && parentWidth < 400 &&
                (parentText.includes('Order book') || parentText.includes('Last trades')) &&
                !hasProtectedContent(parent)) {
              forceHide(parent, 'Order book container (via tab)');
              break;
            }

            parent = parent.parentElement;
          }
        }
      });

      // Strategy 3: Hide very narrow boxes (< 250px) at edges
      const boxes = wrapper.querySelectorAll('.oui-box');

      boxes.forEach((box) => {
        const htmlBox = box as HTMLElement;
        const width = parseInt(window.getComputedStyle(htmlBox).width);
        const parent = htmlBox.parentElement;

        // Only hide if extremely narrow and at edge
        if (width > 0 && width < 250 &&
            (parent?.firstElementChild === htmlBox || parent?.lastElementChild === htmlBox) &&
            !hasProtectedContent(htmlBox)) {
          forceHide(htmlBox, `Very narrow edge box (${width}px)`);
        }
      });

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        console.log(`🏁 Complete. Hidden ${hiddenElements.size} elements.`);
      }
    };

    // Start after delay
    setTimeout(hideSidebars, 300);

    // Run periodically
    const intervalId = setInterval(hideSidebars, 100);

    // Watch for changes
    const observer = new MutationObserver(() => {
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(hideSidebars, 50);
      }
    });

    const wrapper = document.querySelector('.multiscreen-trading-wrapper');
    if (wrapper) {
      observer.observe(wrapper, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
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
