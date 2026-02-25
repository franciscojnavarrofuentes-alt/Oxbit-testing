// Service to fetch Orderly Network data for custom indicators
const ORDERLY_API_BASE = 'https://api.orderly.org';

export interface OpenInterestData {
  symbol: string;
  longOI: number;
  shortOI: number;
  timestamp: number;
}

export interface FundingRateData {
  symbol: string;
  fundingRate: number;
  timestamp: number;
}

/**
 * Fetch open interest data for a symbol
 */
export async function fetchOpenInterest(symbol: string): Promise<OpenInterestData | null> {
  try {
    // Convert symbol format (e.g., ETHUSDC -> PERP_ETH_USDC)
    const orderlySymbol = convertToOrderlySymbol(symbol);

    const response = await fetch(`${ORDERLY_API_BASE}/v1/public/futures/${orderlySymbol}`);

    if (!response.ok) {
      console.error('Failed to fetch open interest:', response.statusText);
      return null;
    }

    const data = await response.json();

    return {
      symbol: orderlySymbol,
      longOI: data.data?.open_interest || 0,
      shortOI: data.data?.open_interest || 0, // Note: Orderly may not separate long/short
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching open interest:', error);
    return null;
  }
}

/**
 * Fetch funding rate for a symbol
 */
export async function fetchFundingRate(symbol: string): Promise<FundingRateData | null> {
  try {
    const orderlySymbol = convertToOrderlySymbol(symbol);

    const response = await fetch(`${ORDERLY_API_BASE}/v1/public/funding_rate_history?symbol=${orderlySymbol}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const latest = data.data?.rows?.[0];

    if (!latest) {
      return null;
    }

    return {
      symbol: orderlySymbol,
      fundingRate: latest.funding_rate || 0,
      timestamp: latest.created_time || Date.now(),
    };
  } catch (error) {
    console.error('Error fetching funding rate:', error);
    return null;
  }
}

/**
 * Convert symbol to Orderly format
 * Examples: ETHUSDC -> PERP_ETH_USDC, BTCUSDC -> PERP_BTC_USDC
 */
function convertToOrderlySymbol(symbol: string): string {
  // Remove common suffixes
  symbol = symbol.replace(/USDC$|USDT$|USD$/i, '');

  // Map common symbols
  const symbolMap: Record<string, string> = {
    'ETH': 'PERP_ETH_USDC',
    'BTC': 'PERP_BTC_USDC',
    'SOL': 'PERP_SOL_USDC',
    'MATIC': 'PERP_MATIC_USDC',
    'ARB': 'PERP_ARB_USDC',
  };

  return symbolMap[symbol.toUpperCase()] || `PERP_${symbol.toUpperCase()}_USDC`;
}

/**
 * Calculate liquidation levels based on open interest and current price
 */
export function calculateLiquidationLevels(
  currentPrice: number,
  openInterest: number,
  leverages: number[] = [10, 20, 50, 100]
): { longLiquidations: number[], shortLiquidations: number[] } {
  const longLiquidations: number[] = [];
  const shortLiquidations: number[] = [];

  // For long positions: liquidation happens below current price
  // Liquidation price = Entry Price * (1 - (1 / leverage))
  for (const leverage of leverages) {
    const liquidationPrice = currentPrice * (1 - (1 / leverage) - 0.005); // 0.005 = 0.5% buffer for fees
    longLiquidations.push(liquidationPrice);
  }

  // For short positions: liquidation happens above current price
  // Liquidation price = Entry Price * (1 + (1 / leverage))
  for (const leverage of leverages) {
    const liquidationPrice = currentPrice * (1 + (1 / leverage) + 0.005);
    shortLiquidations.push(liquidationPrice);
  }

  return { longLiquidations, shortLiquidations };
}
