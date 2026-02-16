import { useEffect, useRef, useState } from "react";
import { usePositionStream } from "@orderly.network/hooks";
import { useOrderlyConfig } from "@/utils/config";

interface CustomTradingViewProps {
  symbol: string;
}

export function CustomTradingView({ symbol }: CustomTradingViewProps) {
  const config = useOrderlyConfig();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<any>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // Get position data for all symbols
  const [positions] = usePositionStream();

  // Initialize TradingView chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing widget
    if (tvWidgetRef.current) {
      try {
        tvWidgetRef.current.remove();
      } catch (e) {
        console.error('Error removing widget:', e);
      }
      tvWidgetRef.current = null;
    }

    const tvConfig = config.tradingPage.tradingViewConfig;

    // Generate unique container ID
    const containerId = `tv_chart_container_${Math.random().toString(36).substr(2, 9)}`;
    chartContainerRef.current.id = containerId;

    // Load TradingView library if not already loaded
    const initWidget = () => {
      if (!window.TradingView) {
        console.error('TradingView library not loaded');
        return;
      }

      try {
        // Create minimal datafeed
        const datafeed = {
          onReady: (callback: any) => {
            setTimeout(() => callback({
              supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D'],
              supports_marks: false,
              supports_timescale_marks: false,
            }), 0);
          },
          searchSymbols: () => {},
          resolveSymbol: (symbolName: string, onResolve: any) => {
            setTimeout(() => {
              onResolve({
                name: symbolName,
                ticker: symbolName,
                description: symbolName,
                type: 'crypto',
                session: '24x7',
                timezone: 'Etc/UTC',
                exchange: 'Orderly',
                minmov: 1,
                pricescale: 100,
                has_intraday: true,
                has_daily: true,
                supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D'],
                volume_precision: 2,
                data_status: 'streaming',
              });
            }, 0);
          },
          getBars: () => {},
          subscribeBars: () => {},
          unsubscribeBars: () => {},
        };

        const widgetOptions = {
          symbol: symbol.replace('PERP_', '').replace('_USDC', '/USD'),
          datafeed: datafeed,
          interval: '15' as any,
          container: containerId,
          library_path: tvConfig.library_path,
          locale: 'en',
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            'header_compare',
            'header_saveload',
            'header_screenshot',
            'header_undo_redo',
          ],
          enabled_features: ['study_templates'],
          charts_storage_api_version: '1.1',
          client_id: 'orderly',
          user_id: 'public_user',
          fullscreen: false,
          autosize: true,
          theme: 'dark' as any,
          custom_css_url: tvConfig.customCssUrl,
          loading_screen: {
            backgroundColor: '#131722',
          },
        };

        tvWidgetRef.current = new window.TradingView.widget(widgetOptions);

        tvWidgetRef.current.onChartReady(() => {
          setIsChartReady(true);
          console.log('TradingView chart ready for', symbol);
        });
      } catch (error) {
        console.error('Error creating TradingView widget:', error);
      }
    };

    // Check if TradingView is already loaded
    if (window.TradingView) {
      initWidget();
    } else {
      // Load TradingView script
      const script = document.createElement('script');
      script.src = tvConfig.scriptSRC;
      script.async = true;
      script.onload = initWidget;
      script.onerror = () => {
        console.error('Failed to load TradingView library');
      };
      document.head.appendChild(script);
    }

    return () => {
      if (tvWidgetRef.current) {
        try {
          tvWidgetRef.current.remove();
        } catch (e) {
          // Ignore errors during cleanup
        }
        tvWidgetRef.current = null;
      }
    };
  }, [symbol, config]);

  return (
    <div className="custom-trading-view">
      {/* TradingView Chart - Direct Integration */}
      <div className="chart-container">
        <div ref={chartContainerRef} className="tv-chart" />
        {!isChartReady && (
          <div className="chart-loading">Loading chart...</div>
        )}
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
