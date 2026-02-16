export const DEFAULT_SYMBOL = "PERP_ETH_USDC";
export const ORDERLY_SYMBOL_KEY = "orderly-current-symbol";

export function getSymbol() {
  return localStorage.getItem(ORDERLY_SYMBOL_KEY) || DEFAULT_SYMBOL;
}

export function updateSymbol(symbol: string) {
  localStorage.setItem(ORDERLY_SYMBOL_KEY, symbol || DEFAULT_SYMBOL);
}

// Multi-screen symbol storage
export const MULTISCREEN_LEFT_SYMBOL_KEY = "orderly-multiscreen-left-symbol";
export const MULTISCREEN_RIGHT_SYMBOL_KEY = "orderly-multiscreen-right-symbol";

export function getMultiScreenSymbol(position: 'left' | 'right'): string {
  const key = position === 'left'
    ? MULTISCREEN_LEFT_SYMBOL_KEY
    : MULTISCREEN_RIGHT_SYMBOL_KEY;
  const stored = localStorage.getItem(key);

  // Default to different symbols for better UX
  return stored || (position === 'left' ? "PERP_BTC_USDC" : DEFAULT_SYMBOL);
}

export function updateMultiScreenSymbol(position: 'left' | 'right', symbol: string) {
  const key = position === 'left'
    ? MULTISCREEN_LEFT_SYMBOL_KEY
    : MULTISCREEN_RIGHT_SYMBOL_KEY;
  localStorage.setItem(key, symbol || DEFAULT_SYMBOL);
}
