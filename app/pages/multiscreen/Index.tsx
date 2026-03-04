import { useState, useCallback, useEffect } from "react";
import { API } from "@orderly.network/types";
import { usePositionStream } from "@orderly.network/hooks";
import { generatePageTitle } from "@/utils/utils";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import { getMultiScreenSymbol, updateMultiScreenSymbol } from "@/utils/storage";
import { CustomTradingView } from "./CustomTradingView";

function useLiqData(symbol: string) {
  const [{ rows }] = usePositionStream(symbol);

  useEffect(() => {
    const map = ((window as any).__PACODEX_LIQ_MAP__ ??= {});
    const position = rows?.[0];
    if (position && position.est_liq_price) {
      map[symbol] = {
        est_liq_price: position.est_liq_price,
        position_qty: position.position_qty,
        symbol: position.symbol,
      };
    } else {
      delete map[symbol];
    }
    return () => {
      delete map[symbol];
    };
  }, [rows, symbol]);
}

export default function MultiScreenIndex() {
  const [leftSymbol, setLeftSymbol] = useState(getMultiScreenSymbol('left'));
  const [rightSymbol, setRightSymbol] = useState(getMultiScreenSymbol('right'));

  useLiqData(leftSymbol);
  useLiqData(rightSymbol);

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
          <CustomTradingView symbol={leftSymbol} onSymbolChange={onLeftSymbolChange} />
        </div>

        <div className="multiscreen-chart-panel">
          <CustomTradingView symbol={rightSymbol} onSymbolChange={onRightSymbolChange} />
        </div>
      </div>
    </>
  );
}
