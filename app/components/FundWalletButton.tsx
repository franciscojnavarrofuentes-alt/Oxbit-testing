import { useFundWallet, useWallets } from '@privy-io/react-auth';
import { useCallback, useState } from 'react';

export const FundWalletButton = () => {
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  const [isLoading, setIsLoading] = useState(false);

  const embeddedWallet = wallets.find(
    (wallet) => (wallet as any).walletClientType === 'privy'
  );

  const handleFundWallet = useCallback(async () => {
    if (!embeddedWallet) {
      return;
    }

    try {
      setIsLoading(true);
      await fundWallet(embeddedWallet.address, {
        amount: '50',
        asset: 'USDC',
      });
    } catch (error) {
      console.error('Error funding wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [embeddedWallet, fundWallet]);

  if (!embeddedWallet) {
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
