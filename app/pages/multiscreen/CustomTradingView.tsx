import { usePositionStream } from "@orderly.network/hooks";
import { TradingPage } from "@orderly.network/trading";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
}

export function CustomTradingView({ symbol }: CustomTradingViewProps) {
  const config = useOrderlyConfig();

  // Get position data for all symbols (not filtered by specific symbol)
  const [positions] = usePositionStream();

  return (
    <div className="custom-trading-view">
      {/* TradingView Chart - Using Orderly's built-in component but styled differently */}
      <div className="chart-container">
        <TradingPage
          symbol={symbol}
          tradingViewConfig={config.tradingPage.tradingViewConfig}
          sharePnLConfig={config.tradingPage.sharePnLConfig}
        />
      </div>

      {/* Positions Panel */}
      <div className="positions-panel">
        <div className="positions-header">
          <h3>Positions & PnL</h3>
          {positions.totalUnrealizedROI !== undefined && (
            <div className={`total-pnl ${positions.totalUnrealizedROI >= 0 ? 'positive' : 'negative'}`}>
              Total ROI: {(positions.totalUnrealizedROI * 100).toFixed(2)}%
            </div>
          )}
        </div>
        <div className="positions-content">
          {positions.rows && positions.rows.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Size</th>
                  <th>Entry Price</th>
                  <th>Mark Price</th>
                  <th>Unrealized PnL</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {positions.rows.map((position, index) => {
                  const pnl = parseFloat(position.unrealized_pnl || '0');
                  const roi = parseFloat(position.unrealized_pnl_ROI || '0');

                  return (
                    <tr key={index}>
                      <td className="symbol-cell">
                        {position.symbol?.replace('PERP_', '').replace('_USDC', '')}
                      </td>
                      <td className={parseFloat(position.position_qty) > 0 ? 'long' : 'short'}>
                        {position.position_qty}
                      </td>
                      <td>${parseFloat(position.average_open_price).toFixed(2)}</td>
                      <td>${parseFloat(position.mark_price).toFixed(2)}</td>
                      <td className={pnl >= 0 ? 'positive' : 'negative'}>
                        ${pnl.toFixed(2)}
                      </td>
                      <td className={roi >= 0 ? 'positive' : 'negative'}>
                        {(roi * 100).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="no-positions">No open positions</p>
          )}
        </div>
      </div>
    </div>
  );
}
