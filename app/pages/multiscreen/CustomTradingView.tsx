import { useEffect } from "react";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
  onSymbolChange?: (data: any) => void;
}

export function CustomTradingView({ symbol, onSymbolChange }: CustomTradingViewProps) {
  const config = useOrderlyConfig();

  // Strategic sidebar hiding with extensive debugging
  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 150;
    let hiddenElements = new Set<HTMLElement>();

    const hasProtectedContent = (element: HTMLElement): boolean => {
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

      if (hasProtectedContent(element)) {
        console.log(`⚠️  Skipped (has protected content): ${reason}`);
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

      const wrapper = document.querySelector('.multiscreen-trading-wrapper');
      if (!wrapper) return;

      // Debug: Log wrapper width
      if (attempts === 1) {
        const wrapperWidth = parseInt(window.getComputedStyle(wrapper).width);
        console.log(`📐 Wrapper width: ${wrapperWidth}px`);
      }

      // Strategy 1: Find direct children of trading page
      const layoutChildren = wrapper.querySelectorAll('.oui-trading-page > *');

      console.log(`🔍 Found ${layoutChildren.length} layout children`);

      layoutChildren.forEach((child, index) => {
        const htmlChild = child as HTMLElement;
        const width = parseInt(window.getComputedStyle(htmlChild).width);
        const text = htmlChild.textContent || '';
        const hasProtected = hasProtectedContent(htmlChild);

        // Debug log for each child
        if (attempts <= 5) {
          console.log(`  [${index}] width=${width}px, protected=${hasProtected}, text=${text.substring(0, 30)}...`);
        }

        if (hasProtected) return;

        // Detect Markets sidebar (usually first child)
        const isMarketsSidebar = text.includes('Markets') && text.includes('Search market');

        // Detect Order book sidebar (usually last child or second to last)
        const isOrderBookSidebar = text.includes('Order book') || text.includes('Last trades');

        // Hide if it's a sidebar and reasonably narrow (< 600px)
        if (width < 600 && isMarketsSidebar) {
          forceHide(htmlChild, `Markets sidebar (${width}px, index ${index})`);
        } else if (width < 600 && isOrderBookSidebar) {
          forceHide(htmlChild, `Order book sidebar (${width}px, index ${index})`);
        }
      });

      // Strategy 2: Find all oui-box elements and hide narrow ones at edges
      const allBoxes = wrapper.querySelectorAll('.oui-box');

      allBoxes.forEach((box) => {
        const htmlBox = box as HTMLElement;
        const width = parseInt(window.getComputedStyle(htmlBox).width);
        const parent = htmlBox.parentElement;
        const text = htmlBox.textContent || '';

        if (hasProtectedContent(htmlBox)) return;

        const isEdgeBox = parent?.firstElementChild === htmlBox || parent?.lastElementChild === htmlBox;
        const hasMarkets = text.includes('Markets') && text.includes('Search');
        const hasOrderBook = text.includes('Order book') || text.includes('Last trades');

        // Hide if narrow and contains sidebar content
        if (width > 0 && width < 500 && isEdgeBox && (hasMarkets || hasOrderBook)) {
          forceHide(htmlBox, `Narrow sidebar box (${width}px)`);
        }
      });

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        console.log(`🏁 Complete. Hidden ${hiddenElements.size} elements.`);
      }
    };

    setTimeout(hideSidebars, 300);
    const intervalId = setInterval(hideSidebars, 100);

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
