import { useCallback, useMemo } from "react";
import { API } from "@orderly.network/types";
import { useMarkets } from "@orderly.network/hooks";

// Fallback list of common symbols
const COMMON_SYMBOLS = [
  'PERP_BTC_USDC',
  'PERP_ETH_USDC',
  'PERP_SOL_USDC',
  'PERP_DOGE_USDC',
  'PERP_WIF_USDC',
  'PERP_PEPE_USDC',
  'PERP_BONK_USDC',
  'PERP_ARB_USDC',
  'PERP_AVAX_USDC',
  'PERP_MATIC_USDC',
  'PERP_OP_USDC',
  'PERP_LINK_USDC',
  'PERP_UNI_USDC',
  'PERP_AAVE_USDC',
  'PERP_SUI_USDC',
  'PERP_APT_USDC',
  'PERP_INJ_USDC',
  'PERP_TIA_USDC',
  'PERP_SEI_USDC',
  'PERP_NEAR_USDC',
];

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

  // Use markets if available, otherwise use common symbols as fallback
  const availableSymbols = useMemo(() => {
    if (markets && markets.length > 0) {
      return markets.map(m => m.symbol);
    }
    return COMMON_SYMBOLS;
  }, [markets]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    // If we have market data, use it
    if (markets && markets.length > 0) {
      const selectedMarket = markets.find(m => m.symbol === value);
      if (selectedMarket) {
        onSymbolChange(selectedMarket as API.Symbol);
      }
    } else {
      // Fallback: create a minimal symbol object
      onSymbolChange({ symbol: value } as API.Symbol);
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
        disabled={isLoading}
      >
        {isLoading ? (
          <option>Loading markets...</option>
        ) : (
          availableSymbols.map(symbolValue => (
            <option key={symbolValue} value={symbolValue}>
              {symbolValue.replace('PERP_', '').replace('_USDC', '')}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
