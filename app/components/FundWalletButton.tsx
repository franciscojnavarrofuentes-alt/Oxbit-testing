import { useWallets } from '@privy-io/react-auth';
import { useCallback, useState } from 'react';

export const FundWalletButton = () => {
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);

  const handleFundWallet = useCallback(async () => {
    try {
      setIsLoading(true);

      // Find the Privy embedded wallet
      const embeddedWallet = wallets.find(
        (wallet) => (wallet as any).walletClientType === 'privy'
      );

      if (!embeddedWallet) {
        console.error('No embedded wallet found');
        alert('No embedded wallet found. Please connect your wallet first.');
        return;
      }

      // Get current chain ID from the wallet
      const chainId = (embeddedWallet as any).chainId;

      // Call the fund method with configuration for USDC
      if (typeof (embeddedWallet as any).fund === 'function') {
        await (embeddedWallet as any).fund({
          chain: chainId ? { id: chainId } : undefined,
          asset: 'USDC', // Default to USDC instead of ETH
        });
      } else {
        console.error('Fund method not available on wallet');
        alert('Funding not available for this wallet');
      }
    } catch (error) {
      console.error('Error funding wallet:', error);
      alert('Failed to open funding dialog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [wallets]);

  // Only show button if there are wallets connected
  if (!wallets || wallets.length === 0) {
    return null;
  }

  // Check if there's an embedded wallet
  const hasEmbeddedWallet = wallets.some(
    (wallet) => (wallet as any).walletClientType === 'privy'
  );

  if (!hasEmbeddedWallet) {
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
