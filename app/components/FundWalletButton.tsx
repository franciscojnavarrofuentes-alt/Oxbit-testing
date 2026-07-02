import { useFundWallet, useWallets, useMfaEnrollment, usePrivy } from '@privy-io/react-auth';
import { useCallback, useState, useRef, useEffect } from 'react';
import { ConvertUsdcToEth } from './ConvertUsdcToEth';
import { SendFunds } from './SendFunds';

export const FundWalletButton = ({ dropUp = false }: { dropUp?: boolean }) => {
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  const { user, getAccessToken } = usePrivy();
  const { initEnrollmentWithTotp, submitEnrollmentWithTotp, unenrollWithTotp } = useMfaEnrollment();
  const hasTotpMfa = user?.mfaMethods?.includes('totp');
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [showDisableMfa, setShowDisableMfa] = useState(false);
  const [disablingMfa, setDisablingMfa] = useState(false);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaAuthUrl, setMfaAuthUrl] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState(false);
  const [mfaCopied, setMfaCopied] = useState(false);
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

  const handleBuyUsdc = useCallback(async () => {
    if (!embeddedWallet) return;

    try {
      setIsLoading(true);
      setShowMenu(false);
      await fundWallet(embeddedWallet.address, {
        asset: 'USDC',
        amount: '10',
      });
    } catch (error) {
      console.error('Error funding wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [embeddedWallet, fundWallet]);

  const handleInitMfa = useCallback(async () => {
    try {
      setMfaError(null);
      setMfaSuccess(false);
      await getAccessToken();
      const { authUrl, secret } = await initEnrollmentWithTotp();
      setMfaAuthUrl(authUrl);
      setMfaSecret(secret);
    } catch (error: any) {
      setMfaError(error?.message || 'Failed to initialize 2FA');
    }
  }, [initEnrollmentWithTotp, getAccessToken]);

  const handleSubmitMfa = useCallback(async () => {
    try {
      setMfaError(null);
      await submitEnrollmentWithTotp({ mfaCode: mfaCode });
      setMfaSuccess(true);
      setMfaCode('');
    } catch (error: any) {
      setMfaError(error?.message || 'Invalid code. Please try again.');
    }
  }, [submitEnrollmentWithTotp, mfaCode]);

  const handleDisableMfa = useCallback(async () => {
    try {
      setDisablingMfa(true);
      setMfaError(null);
      await unenrollWithTotp();
      setShowDisableMfa(false);
    } catch (error: any) {
      setMfaError(error?.message || 'Failed to disable 2FA');
    } finally {
      setDisablingMfa(false);
    }
  }, [unenrollWithTotp]);

  if (!embeddedWallet) {
    return null;
  }

  return (
    <>
      <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isLoading}
          className="oui-btn oui-btn-primary oui-px-4 oui-py-2 oui-rounded-lg oui-font-semibold oui-text-sm"
          style={{
            background: '#7155ef',
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
              ...(dropUp
                ? { bottom: '100%', left: 0, marginBottom: '4px' }
                : { top: '100%', right: 0, marginTop: '4px' }),
              background: '#1e1e2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              overflow: 'hidden',
              zIndex: 1000,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <button
              onClick={handleBuyUsdc}
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
              onClick={() => {
                setShowMenu(false);
                setShowConvert(true);
              }}
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
              USDC → ETH (Gas)
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setShowSend(true);
              }}
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
              Send
            </button>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />
            <button
              onClick={() => {
                setShowMenu(false);
                if (hasTotpMfa) {
                  setMfaError(null);
                  setShowDisableMfa(true);
                } else {
                  setShowMfa(true);
                  handleInitMfa();
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                color: hasTotpMfa ? '#ef4444' : 'white',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {hasTotpMfa ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        )}
      </div>
      <ConvertUsdcToEth
        isOpen={showConvert}
        onClose={() => setShowConvert(false)}
      />
      <SendFunds
        isOpen={showSend}
        onClose={() => setShowSend(false)}
      />
      {showDisableMfa && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => {
            setShowDisableMfa(false);
            setMfaError(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e2e',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              color: 'white',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
              Disable 2FA
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>
              Are you sure you want to disable two-factor authentication? This will make your account less secure.
            </p>
            {mfaError && (
              <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 12px' }}>
                {mfaError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDisableMfa(false);
                  setMfaError(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMfa}
                disabled={disablingMfa}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: disablingMfa ? 'rgba(239,68,68,0.4)' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: disablingMfa ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {disablingMfa ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showMfa && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseDown={() => {
            setShowMfa(false);
            setMfaSecret(null);
            setMfaAuthUrl(null);
            setMfaCode('');
            setMfaError(null);
            setMfaSuccess(false);
          }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: '#1e1e2e',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              color: 'white',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
              Enable 2FA
            </h3>
            {mfaSuccess ? (
              <div>
                <p style={{ color: '#4ade80', margin: '0 0 16px' }}>
                  2FA has been enabled successfully!
                </p>
                <button
                  onClick={() => {
                    setShowMfa(false);
                    setMfaSuccess(false);
                    setMfaSecret(null);
                    setMfaAuthUrl(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#7155ef',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Done
                </button>
              </div>
            ) : !mfaSecret ? (
              <div>
                {mfaError ? (
                  <>
                    <p style={{ color: '#f87171', fontSize: '14px', margin: '0 0 16px' }}>
                      {mfaError}
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>
                      Try logging out and back in, then try again.
                    </p>
                    <button
                      onClick={handleInitMfa}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#7155ef',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      Retry
                    </button>
                  </>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                    Setting up authenticator...
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>
                  Open your authenticator app and add this key manually:
                </p>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(mfaSecret);
                    setMfaCopied(true);
                    setTimeout(() => setMfaCopied(false), 2000);
                  }}
                  title="Click to copy"
                >
                  <span style={{ wordBreak: 'break-all', fontSize: '13px', fontFamily: 'monospace', flex: 1 }}>
                    {mfaSecret}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={mfaCopied ? '#4ade80' : 'rgba(255,255,255,0.5)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    {mfaCopied ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </>
                    )}
                  </svg>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>
                  Enter the 6-digit code from your authenticator:
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="000000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '18px',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    marginBottom: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {mfaError && (
                  <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 12px' }}>
                    {mfaError}
                  </p>
                )}
                <button
                  onClick={handleSubmitMfa}
                  disabled={mfaCode.length !== 6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: mfaCode.length === 6 ? '#7155ef' : 'rgba(113,85,239,0.4)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: mfaCode.length === 6 ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Verify & Enable
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
