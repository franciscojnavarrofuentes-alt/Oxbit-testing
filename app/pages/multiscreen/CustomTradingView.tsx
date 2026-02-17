import { useEffect } from "react";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
  onSymbolChange?: (data: any) => void;
}

export function CustomTradingView({ symbol, onSymbolChange }: CustomTradingViewProps) {
  const config = useOrderlyConfig();

  // Ultra-aggressive sidebar hiding with debugging
  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 200; // 20 seconds (200 * 100ms)
    let hiddenElements = new Set<HTMLElement>();

    const forceHide = (element: HTMLElement, reason: string) => {
      if (hiddenElements.has(element)) return; // Already hidden

      element.style.setProperty('display', 'none', 'important');
      element.style.setProperty('visibility', 'hidden', 'important');
      element.style.setProperty('width', '0', 'important');
      element.style.setProperty('min-width', '0', 'important');
      element.style.setProperty('max-width', '0', 'important');
      element.style.setProperty('opacity', '0', 'important');
      element.style.setProperty('pointer-events', 'none', 'important');
      element.style.setProperty('position', 'absolute', 'important');
      element.style.setProperty('overflow', 'hidden', 'important');

      hiddenElements.add(element);
      console.log(`✅ Hidden ${reason}:`, element.textContent?.substring(0, 50));
    };

    const hideSidebars = () => {
      attempts++;

      // Strategy 1: Find all elements with "Order book" or "Last trades" text
      const allElements = document.querySelectorAll('.multiscreen-trading-wrapper *');

      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const text = htmlEl.textContent || '';
        const innerText = htmlEl.innerText || '';

        // Skip if this element has chart or positions table
        if (htmlEl.querySelector('iframe') ||
            htmlEl.querySelector('canvas') ||
            htmlEl.querySelector('table tbody')) {
          return;
        }

        // Check if this is Order book tab/header
        if ((text.includes('Order book') || innerText.includes('Order book')) &&
            !text.includes('Positions') && !text.includes('Pending')) {
          // Find the parent container
          let parent = htmlEl.parentElement;
          let foundSidebar = false;

          // Walk up the tree to find the sidebar container
          for (let i = 0; i < 10 && parent; i++) {
            const parentText = parent.textContent || '';
            const parentWidth = parseInt(window.getComputedStyle(parent).width);

            // If parent contains "Order book" AND is narrow, it's the sidebar
            if (parentText.includes('Order book') && parentWidth > 0 && parentWidth < 500) {
              forceHide(parent, 'Order book sidebar (parent)');
              foundSidebar = true;
              break;
            }
            parent = parent.parentElement;
          }

          if (!foundSidebar) {
            forceHide(htmlEl, 'Order book element');
          }
        }

        // Check if this is Last trades
        if ((text.includes('Last trades') || innerText.includes('Last trades')) &&
            !text.includes('Positions') && !text.includes('Pending')) {
          let parent = htmlEl.parentElement;

          for (let i = 0; i < 10 && parent; i++) {
            const parentText = parent.textContent || '';
            const parentWidth = parseInt(window.getComputedStyle(parent).width);

            if (parentText.includes('Last trades') && parentWidth > 0 && parentWidth < 500) {
              forceHide(parent, 'Last trades sidebar (parent)');
              break;
            }
            parent = parent.parentElement;
          }
        }

        // Check if this is Markets sidebar
        if ((text.includes('Markets') && text.includes('Search market')) ||
            htmlEl.querySelector('input[placeholder*="Search market"]')) {
          let parent = htmlEl.parentElement;

          for (let i = 0; i < 10 && parent; i++) {
            const parentText = parent.textContent || '';
            const parentWidth = parseInt(window.getComputedStyle(parent).width);

            if (parentText.includes('Markets') && parentWidth > 0 && parentWidth < 500) {
              forceHide(parent, 'Markets sidebar (parent)');
              break;
            }
            parent = parent.parentElement;
          }
        }
      });

      // Strategy 2: Hide narrow boxes at edges
      const boxes = document.querySelectorAll('.multiscreen-trading-wrapper .oui-box');

      boxes.forEach((box) => {
        const htmlBox = box as HTMLElement;
        const width = parseInt(window.getComputedStyle(htmlBox).width);
        const parent = htmlBox.parentElement;

        // Skip if has chart or table
        if (htmlBox.querySelector('iframe') ||
            htmlBox.querySelector('canvas') ||
            htmlBox.querySelector('table tbody')) {
          return;
        }

        // Hide narrow boxes at edges
        if (width > 0 && width < 400 &&
            (parent?.firstElementChild === htmlBox || parent?.lastElementChild === htmlBox)) {
          forceHide(htmlBox, `Narrow edge box (${width}px)`);
        }
      });

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        console.log(`🏁 Sidebar hiding complete after ${attempts} attempts. Hidden ${hiddenElements.size} elements.`);
      }
    };

    // Initial run after short delay
    setTimeout(hideSidebars, 200);

    // Run periodically for 20 seconds
    const intervalId = setInterval(hideSidebars, 100);

    // Also use MutationObserver to catch dynamic changes
    const observer = new MutationObserver(() => {
      if (attempts < MAX_ATTEMPTS) {
        hideSidebars();
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
