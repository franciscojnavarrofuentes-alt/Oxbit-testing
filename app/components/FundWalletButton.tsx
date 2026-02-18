import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const FundWalletButton = () => {
  const navigate = useNavigate();

  const handleFundWallet = useCallback(() => {
    try {
      // Navigate to Portfolio page where users can deposit funds
      navigate('/portfolio');
    } catch (error) {
      console.error('Error navigating to portfolio:', error);
    }
  }, [navigate]);

  return (
    <button
      onClick={handleFundWallet}
      className="oui-btn oui-btn-primary oui-px-4 oui-py-2 oui-rounded-lg oui-font-semibold oui-text-sm"
      style={{
        background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 16px',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '14px',
      }}
    >
      💳 Fund Wallet
    </button>
  );
};
