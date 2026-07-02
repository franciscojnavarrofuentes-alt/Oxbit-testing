import { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * Triggers MFA verification immediately after login by requesting a personal_sign.
 * This establishes the MFA session before any Orderly dialogs open,
 * allowing Privy's built-in MFA popup to work without FocusTrap conflicts.
 */
export const MfaVerificationModal = () => {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const mfaTriggeredRef = useRef(false);

  useEffect(() => {
    if (!authenticated || !user || mfaTriggeredRef.current) return;

    const hasMfa = user.mfaMethods?.includes('totp');
    if (!hasMfa) return;

    const embeddedWallet = wallets.find(
      (w) => (w as any).walletClientType === 'privy'
    );
    if (!embeddedWallet) return;

    mfaTriggeredRef.current = true;

    (async () => {
      try {
        const provider = await embeddedWallet.getEthereumProvider();
        const msg = '0x' + Array.from(new TextEncoder().encode('Sign this message for 2FA verification'))
          .map((b) => b.toString(16).padStart(2, '0')).join('');
        await provider.request({
          method: 'personal_sign',
          params: [msg, embeddedWallet.address],
        });
      } catch {
        // MFA cancelled or failed - will be prompted on next transaction
        mfaTriggeredRef.current = false;
      }
    })();
  }, [authenticated, user, wallets]);

  return null;
};
