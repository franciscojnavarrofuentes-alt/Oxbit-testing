import { useState, useCallback, useEffect } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, parseUnits, formatUnits, formatEther } from 'viem';
import {
  ARBITRUM_CHAIN_ID,
  USDC_ADDRESS,
  WETH_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  QUOTER_V2_ADDRESS,
  USDC_DECIMALS,
  POOL_FEE,
  SLIPPAGE_BPS,
  ERC20_ABI,
  SWAP_ROUTER_ABI,
  QUOTER_V2_ABI,
} from '../utils/swapConstants';

type Step = 'input' | 'approving' | 'swapping' | 'success' | 'error';

interface ConvertUsdcToEthProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConvertUsdcToEth = ({ isOpen, onClose }: ConvertUsdcToEthProps) => {
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const [usdcAmount, setUsdcAmount] = useState('2');
  const [estimatedEth, setEstimatedEth] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('input');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const embeddedWallet = wallets.find(
    (wallet) => (wallet as any).walletClientType === 'privy'
  );

  // Fetch USDC balance and quote when modal opens or amount changes
  useEffect(() => {
    if (!isOpen || !embeddedWallet) return;

    const fetchData = async () => {
      try {
        const provider = await embeddedWallet.getEthereumProvider();

        // Fetch USDC balance
        const balanceData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [embeddedWallet.address as `0x${string}`],
        });
        const balanceResult = await provider.request({
          method: 'eth_call',
          params: [{ to: USDC_ADDRESS, data: balanceData }, 'latest'],
        });
        const balance = BigInt(balanceResult as string);
        setUsdcBalance(formatUnits(balance, USDC_DECIMALS));

        // Fetch quote
        const parsedAmount = parseUnits(usdcAmount || '0', USDC_DECIMALS);
        if (parsedAmount === 0n) {
          setEstimatedEth(null);
          return;
        }

        const quoteData = encodeFunctionData({
          abi: QUOTER_V2_ABI,
          functionName: 'quoteExactInputSingle',
          args: [{
            tokenIn: USDC_ADDRESS,
            tokenOut: WETH_ADDRESS,
            amountIn: parsedAmount,
            fee: POOL_FEE,
            sqrtPriceLimitX96: 0n,
          }],
        });
        const quoteResult = await provider.request({
          method: 'eth_call',
          params: [{ to: QUOTER_V2_ADDRESS, data: quoteData }, 'latest'],
        });
        // First 32 bytes = amountOut
        const amountOut = BigInt((quoteResult as string).slice(0, 66));
        setEstimatedEth(formatEther(amountOut));
      } catch (err) {
        console.error('Error fetching quote:', err);
        setEstimatedEth(null);
      }
    };

    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, usdcAmount, embeddedWallet]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setErrorMsg('');
      setTxHash('');
    }
  }, [isOpen]);

  const handleConvert = useCallback(async () => {
    if (!embeddedWallet || !estimatedEth) return;

    const walletAddress = embeddedWallet.address as `0x${string}`;
    const amountIn = parseUnits(usdcAmount, USDC_DECIMALS);
    const estimatedOut = parseUnits(estimatedEth, 18);
    const amountOutMinimum = estimatedOut * BigInt(10000 - SLIPPAGE_BPS) / 10000n;

    try {
      // Step 1: Check allowance and approve if needed
      setStep('approving');

      const provider = await embeddedWallet.getEthereumProvider();
      const allowanceData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [walletAddress, SWAP_ROUTER_ADDRESS],
      });
      const allowanceResult = await provider.request({
        method: 'eth_call',
        params: [{ to: USDC_ADDRESS, data: allowanceData }, 'latest'],
      });
      const currentAllowance = BigInt(allowanceResult as string);

      if (currentAllowance < amountIn) {
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [SWAP_ROUTER_ADDRESS, amountIn],
        });

        await sendTransaction(
          {
            to: USDC_ADDRESS,
            data: approveData,
            chainId: ARBITRUM_CHAIN_ID,
          },
          { sponsor: true }
        );
      }

      // Step 2: Execute swap + unwrap WETH to native ETH via multicall
      setStep('swapping');

      // exactInputSingle sends WETH to the router (not the user)
      const swapCalldata = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn: USDC_ADDRESS,
          tokenOut: WETH_ADDRESS,
          fee: POOL_FEE,
          recipient: SWAP_ROUTER_ADDRESS, // router holds WETH temporarily
          amountIn: amountIn,
          amountOutMinimum: amountOutMinimum,
          sqrtPriceLimitX96: 0n,
        }],
      });

      // unwrapWETH9 converts WETH to native ETH and sends to user
      const unwrapCalldata = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: 'unwrapWETH9',
        args: [amountOutMinimum, walletAddress],
      });

      // multicall batches both in a single transaction
      const multicallData = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: 'multicall',
        args: [[swapCalldata, unwrapCalldata]],
      });

      const receipt = await sendTransaction(
        {
          to: SWAP_ROUTER_ADDRESS,
          data: multicallData,
          chainId: ARBITRUM_CHAIN_ID,
        },
        { sponsor: true }
      );

      setTxHash(receipt?.hash || '');
      setStep('success');
    } catch (err: any) {
      console.error('Swap error:', err);
      setErrorMsg(err?.message || 'Transaction failed');
      setStep('error');
    }
  }, [embeddedWallet, usdcAmount, estimatedEth, sendTransaction]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(usdcAmount || '0');
  const parsedBalance = parseFloat(usdcBalance || '0');
  const insufficientBalance = parsedBalance < parsedAmount;
  const canConvert = parsedAmount > 0 && estimatedEth && !insufficientBalance;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step === 'input') onClose();
      }}
    >
      <div
        style={{
          background: '#1e1e2e',
          borderRadius: '12px',
          padding: '24px',
          width: '360px',
          maxWidth: '90vw',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Convert USDC to ETH
          </h3>
          {step === 'input' && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              x
            </button>
          )}
        </div>

        {step === 'input' && (
          <>
            {/* USDC Amount Input */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  USDC Amount
                </label>
                {usdcBalance !== null && (
                  <span
                    style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                    onClick={() => setUsdcAmount(usdcBalance)}
                  >
                    Balance: {parseFloat(usdcBalance).toFixed(2)}
                  </span>
                )}
              </div>
              <input
                type="number"
                value={usdcAmount}
                onChange={(e) => setUsdcAmount(e.target.value)}
                min="0.1"
                step="0.5"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {insufficientBalance && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                  Insufficient USDC balance
                </p>
              )}
            </div>

            {/* Estimated ETH Output */}
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                Estimated ETH received
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                {estimatedEth
                  ? `${parseFloat(estimatedEth).toFixed(6)} ETH`
                  : '—'}
              </div>
            </div>

            {/* Info */}
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 16px',
              lineHeight: '1.4',
            }}>
              Gas fees are sponsored. You only spend the USDC amount shown above.
              Swap executed via Uniswap V3 on Arbitrum.
            </p>

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!canConvert}
              style={{
                width: '100%',
                padding: '12px',
                background: canConvert
                  ? 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: canConvert ? 'white' : 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: canConvert ? 'pointer' : 'not-allowed',
              }}
            >
              Convert
            </button>
          </>
        )}

        {(step === 'approving' || step === 'swapping') && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#7C3AED',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {step === 'approving' ? 'Approving USDC...' : 'Swapping USDC for ETH...'}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '8px 0 0' }}>
              Please confirm in your wallet
            </p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>&#10003;</div>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px' }}>
              Swap completed!
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
              ETH has been added to your wallet
            </p>
            {txHash && (
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: '#7C3AED' }}
              >
                View on Arbiscan
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                display: 'block',
                width: '100%',
                marginTop: '16px',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        )}

        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', color: '#ef4444' }}>!</div>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px' }}>
              Transaction failed
            </p>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 16px',
              wordBreak: 'break-word',
            }}>
              {errorMsg}
            </p>
            <button
              onClick={() => setStep('input')}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
