import { useCallback } from "react";
import { API } from "@orderly.network/types";
import { useMarkets } from "@orderly.network/hooks";

interface SymbolSelectorProps {
  symbol: string;
  onSymbolChange: (data: API.Symbol) => void;
  label?: string;
}

export default function SymbolSelector({
  symbol,
  onSymbolChange,
  label
}: SymbolSelectorProps) {
  const { data: markets, isLoading } = useMarkets();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedMarket = markets?.find(m => m.symbol === value);
    if (selectedMarket) {
      onSymbolChange(selectedMarket as API.Symbol);
    }
  }, [markets, onSymbolChange]);

  // Always render the selector, even while loading
  return (
    <div className="multiscreen-symbol-selector">
      {label && (
        <label className="multiscreen-symbol-label">{label}</label>
      )}
      <select
        value={symbol}
        onChange={handleChange}
        className="multiscreen-symbol-select"
        disabled={isLoading || !markets || markets.length === 0}
      >
        {isLoading ? (
          <option>Loading markets...</option>
        ) : !markets || markets.length === 0 ? (
          <option>No markets available</option>
        ) : (
          markets.map(market => (
            <option key={market.symbol} value={market.symbol}>
              {market.symbol.replace('PERP_', '').replace('_USDC', '')}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
