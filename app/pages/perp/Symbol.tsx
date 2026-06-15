import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API } from "@orderly.network/types";
import { TradingPage } from "@orderly.network/trading";
import { usePositionStream } from "@orderly.network/hooks";
import { updateSymbol } from "@/utils/storage";
import { formatSymbol, generatePageTitle } from "@/utils/utils";
import { useOrderlyConfig } from "@/utils/config";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import { installSessionBoxDrawer } from "@/utils/sessionBoxDrawer";

export default function PerpSymbol() {
  const params = useParams();
  const [symbol, setSymbol] = useState(params.symbol!);
  const config = useOrderlyConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [{ rows }] = usePositionStream(symbol);

  useEffect(() => {
    installSessionBoxDrawer();
  }, []);

  useEffect(() => {
    updateSymbol(symbol);
  }, [symbol]);

  // Feed position liquidation price to TradingView indicator via window global
  useEffect(() => {
    const map = ((window as any).__PACODEX_LIQ_MAP__ ??= {});
    const position = rows?.[0];
    if (position && position.est_liq_price) {
      const data = {
        est_liq_price: position.est_liq_price,
        position_qty: position.position_qty,
        symbol: position.symbol,
      };
      (window as any).__PACODEX_LIQ__ = data;
      map[symbol] = data;
    } else {
      (window as any).__PACODEX_LIQ__ = null;
      delete map[symbol];
    }
    return () => {
      (window as any).__PACODEX_LIQ__ = null;
      delete map[symbol];
    };
  }, [rows, symbol]);

  const onSymbolChange = useCallback(
    (data: API.Symbol) => {
      const symbol = data.symbol;
      setSymbol(symbol);
      
      const searchParamsString = searchParams.toString();
      const queryString = searchParamsString ? `?${searchParamsString}` : '';
      
      navigate(`/perp/${symbol}${queryString}`);
    },
    [navigate, searchParams]
  );

  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle(formatSymbol(params.symbol!));

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <TradingPage
          symbol={symbol}
          onSymbolChange={onSymbolChange}
          tradingViewConfig={config.tradingPage.tradingViewConfig}
          sharePnLConfig={config.tradingPage.sharePnLConfig}
        />
      </div>
    </>
  );
}

