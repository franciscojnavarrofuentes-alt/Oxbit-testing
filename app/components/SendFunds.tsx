import { useState, useCallback, useEffect } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, parseUnits, formatUnits, parseEther, formatEther } from 'viem';

type Step = 'input' | 'sending' | 'success' | 'error';

interface ChainConfig {
  id: number;
  name: string;
  nativeToken: string;
  explorerUrl: string;
  tokens: { address: `0x${string}`; symbol: string; decimals: number }[];
}

const CHAINS: ChainConfig[] = [
  {
    id: 42161,
    name: 'Arbitrum',
    nativeToken: 'ETH',
    explorerUrl: 'https://arbiscan.io/tx/',
    tokens: [
      { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
      { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', decimals: 6 },
      { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
      { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', decimals: 8 },
      { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', decimals: 18 },
      { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', decimals: 18 },
      { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC.e', decimals: 6 },
    ],
  },
  {
    id: 1,
    name: 'Ethereum',
    nativeToken: 'ETH',
    explorerUrl: 'https://etherscan.io/tx/',
    tokens: [
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8 },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18 },
      { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', decimals: 18 },
    ],
  },
  {
    id: 56,
    name: 'BNB Chain',
    nativeToken: 'BNB',
    explorerUrl: 'https://bscscan.com/tx/',
    tokens: [
      { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18 },
      { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18 },
      { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'WETH', decimals: 18 },
      { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', decimals: 18 },
      { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', symbol: 'DAI', decimals: 18 },
    ],
  },
  {
    id: 8453,
    name: 'Base',
    nativeToken: 'ETH',
    explorerUrl: 'https://basescan.org/tx/',
    tokens: [
      { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
      { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
      { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', symbol: 'DAI', decimals: 18 },
    ],
  },
  {
    id: 10,
    name: 'Optimism',
    nativeToken: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io/tx/',
    tokens: [
      { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', decimals: 6 },
      { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', decimals: 6 },
      { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', decimals: 18 },
      { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', decimals: 18 },
      { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', decimals: 18 },
    ],
  },
];

const BALANCE_OF_ABI = [{
  name: 'balanceOf',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: 'account', type: 'address' }],
  outputs: [{ name: '', type: 'uint256' }],
}] as const;

const TRANSFER_ABI = [{
  name: 'transfer',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'to', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

interface TokenBalance {
  address: string; // 'native' or contract address
  symbol: string;
  decimals: number;
  balance: string;
  balanceRaw: bigint;
}

interface SendFundsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendFunds = ({ isOpen, onClose }: SendFundsProps) => {
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const [chain, setChain] = useState<ChainConfig>(CHAINS[0]);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const embeddedWallet = wallets.find(
    (wallet) => (wallet as any).walletClientType === 'privy'
  );

  // Fetch all token balances when chain changes or modal opens
  useEffect(() => {
    if (!isOpen || !embeddedWallet) return;

    const fetchAllBalances = async () => {
      setIsLoadingBalances(true);
      const balances: TokenBalance[] = [];

      try {
        const provider = await embeddedWallet.getEthereumProvider();
        const walletAddress = embeddedWallet.address;

        // Fetch native balance
        const nativeResult = await provider.request({
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
        });
        const nativeBal = BigInt(nativeResult as string);
        if (nativeBal > 0n) {
          balances.push({
            address: 'native',
            symbol: chain.nativeToken,
            decimals: 18,
            balance: formatEther(nativeBal),
            balanceRaw: nativeBal,
          });
        }

        // Fetch ERC-20 balances in parallel
        const balanceData = encodeFunctionData({
          abi: BALANCE_OF_ABI,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`],
        });

        const results = await Promise.allSettled(
          chain.tokens.map(async (token) => {
            const result = await provider.request({
              method: 'eth_call',
              params: [{ to: token.address, data: balanceData }, 'latest'],
            });
            const bal = BigInt(result as string);
            return { token, bal };
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.bal > 0n) {
            const { token, bal } = result.value;
            balances.push({
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              balance: formatUnits(bal, token.decimals),
              balanceRaw: bal,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching balances:', err);
      }

      setTokenBalances(balances);
      setSelectedToken(balances[0] || null);
      setIsLoadingBalances(false);
    };

    fetchAllBalances();
  }, [isOpen, chain, embeddedWallet]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setErrorMsg('');
      setTxHash('');
      setAmount('');
      setRecipient('');
      setChain(CHAINS[0]);
    }
  }, [isOpen]);

  const isValidAddress = recipient.match(/^0x[a-fA-F0-9]{40}$/);
  const parsedAmount = parseFloat(amount || '0');
  const parsedBalance = parseFloat(selectedToken?.balance || '0');
  const insufficientBalance = parsedBalance < parsedAmount;
  const canSend = parsedAmount > 0 && isValidAddress && !insufficientBalance && selectedToken && !isLoadingBalances;

  const handleSend = useCallback(async () => {
    if (!embeddedWallet || !canSend || !selectedToken) return;

    try {
      setStep('sending');

      let receipt;

      if (selectedToken.address === 'native') {
        const value = `0x${parseEther(amount).toString(16)}`;
        receipt = await sendTransaction({
          to: recipient as `0x${string}`,
          value,
          chainId: chain.id,
        });
      } else {
        const transferData = encodeFunctionData({
          abi: TRANSFER_ABI,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, parseUnits(amount, selectedToken.decimals)],
        });

        receipt = await sendTransaction({
          to: selectedToken.address as `0x${string}`,
          data: transferData,
          chainId: chain.id,
        });
      }

      setTxHash(receipt?.hash || '');
      setStep('success');
    } catch (err: any) {
      console.error('Send error:', err);
      setErrorMsg(err?.message || 'Transaction failed');
      setStep('error');
    }
  }, [embeddedWallet, selectedToken, amount, recipient, chain, canSend, sendTransaction]);

  if (!isOpen) return null;

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
          width: '400px',
          maxWidth: '90vw',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Send Funds
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
            {/* Chain selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' }}>
                Network
              </label>
              <select
                value={chain.id}
                onChange={(e) => {
                  const selected = CHAINS.find(c => c.id === Number(e.target.value));
                  if (selected) setChain(selected);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                {CHAINS.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#1e1e2e' }}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Token selector - shows tokens with balance */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' }}>
                Token
              </label>
              {isLoadingBalances ? (
                <div style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.4)',
                }}>
                  Loading balances...
                </div>
              ) : tokenBalances.length === 0 ? (
                <div style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.4)',
                }}>
                  No tokens found on {chain.name}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {tokenBalances.map((tb) => (
                    <button
                      key={tb.address}
                      onClick={() => setSelectedToken(tb)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: selectedToken?.address === tb.address
                          ? '1px solid #7C3AED'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: selectedToken?.address === tb.address
                          ? 'rgba(124,58,237,0.15)'
                          : 'rgba(255,255,255,0.03)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{tb.symbol}</span>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        {parseFloat(tb.balance).toFixed(tb.decimals > 8 ? 6 : 2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recipient address */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' }}>
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: recipient && !isValidAddress ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {recipient && !isValidAddress && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                  Invalid address
                </p>
              )}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  Amount
                </label>
                {selectedToken && (
                  <span
                    style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                    onClick={() => setAmount(selectedToken.balance)}
                  >
                    Max: {parseFloat(selectedToken.balance).toFixed(selectedToken.decimals > 8 ? 6 : 2)} {selectedToken.symbol}
                  </span>
                )}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="any"
                placeholder={`0.00 ${selectedToken?.symbol || ''}`}
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
              {insufficientBalance && amount && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                  Insufficient {selectedToken?.symbol} balance
                </p>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: '100%',
                padding: '12px',
                background: canSend
                  ? 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: canSend ? 'white' : 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: canSend ? 'pointer' : 'not-allowed',
              }}
            >
              {selectedToken ? `Send ${selectedToken.symbol} on ${chain.name}` : 'Select a token'}
            </button>
          </>
        )}

        {step === 'sending' && (
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
              Sending {selectedToken?.symbol} on {chain.name}...
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
              Sent successfully!
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
              {amount} {selectedToken?.symbol} sent to {recipient.slice(0, 6)}...{recipient.slice(-4)}
            </p>
            {txHash && (
              <a
                href={`${chain.explorerUrl}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: '#7C3AED' }}
              >
                View on {chain.name} Explorer
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
