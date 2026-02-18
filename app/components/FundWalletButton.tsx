import { useWalletConnector } from '@orderly.network/hooks';
import { useCallback, useState } from 'react';

export const FundWalletButton = () => {
  const { wallet } = useWalletConnector();
  const [isLoading, setIsLoading] = useState(false);

  const handleFundWallet = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!wallet || !wallet.address) {
        alert('Please connect your wallet first.');
        return;
      }

      // Call the fund method with address parameter (required by Privy)
      // Let MoonPay handle chain selection by not specifying chain
      if (typeof (wallet as any).fund === 'function') {
        await (wallet as any).fund({
          address: wallet.address,
          options: {
            asset: 'USDC',
          }
        });
      } else {
        console.error('Fund method not available on this wallet type');
        alert('Funding is only available for Privy embedded wallets. Please connect using email/social login.');
      }
    } catch (error) {
      console.error('Error funding wallet:', error);
      alert('Failed to open funding dialog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  // Only show button if wallet is connected
  if (!wallet) {
    return null;
  }

  return (
    <button
      onClick={handleFundWallet}
      disabled={isLoading}
      className="oui-btn oui-btn-primary oui-px-4 oui-py-2 oui-rounded-lg oui-font-semibold oui-text-sm"
      style={{
        background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
        color: 'white',
        border: 'none',
        cursor: isLoading ? 'wait' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
        padding: '8px 16px',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '14px',
      }}
    >
      {isLoading ? 'Opening...' : '💳 Fund Wallet'}
    </button>
  );
};
