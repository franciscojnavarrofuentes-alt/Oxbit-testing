import { useFundWallet, useWallets } from '@privy-io/react-auth';
import { useCallback, useState, useRef, useEffect } from 'react';

type FundOption = 'usdc' | 'gas';

export const FundWalletButton = () => {
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const embeddedWallet = wallets.find(
    (wallet) => (wallet as any).walletClientType === 'privy'
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFund = useCallback(async (option: FundOption) => {
    if (!embeddedWallet) return;

    try {
      setIsLoading(true);
      setShowMenu(false);

      if (option === 'usdc') {
        await fundWallet(embeddedWallet.address, {
          asset: 'USDC',
        });
      } else {
        await fundWallet(embeddedWallet.address, {
          asset: 'native-currency',
        });
      }
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
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
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
        {isLoading ? 'Opening...' : 'Fund Wallet'}
      </button>
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: '#1e1e2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 1000,
            minWidth: '160px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <button
            onClick={() => handleFund('usdc')}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              color: 'white',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Buy USDC
          </button>
          <button
            onClick={() => handleFund('gas')}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              color: 'white',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Buy Gas (ETH/SOL)
          </button>
        </div>
      )}
    </div>
  );
};
