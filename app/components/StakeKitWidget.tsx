import { useCallback, useMemo } from "react";
import { useWalletConnector } from "@orderly.network/hooks";
import { SKApp, darkTheme } from "@stakekit/widget";
import { getRuntimeConfig } from "../utils/runtime-config";

import "@stakekit/widget/style.css";

export default function StakeKitWidget() {
  const { wallet, setChain, connectedChain } = useWalletConnector();
  const apiKey = getRuntimeConfig("VITE_STAKEKIT_API_KEY") || "";

  const walletAddress = wallet?.accounts?.[0]?.address;
  const provider = wallet?.provider as any;

  const handleSignMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!provider) throw new Error("Wallet not connected");
      const accounts = await provider.request({ method: "eth_accounts" });
      return provider.request({
        method: "personal_sign",
        params: [message, accounts[0]],
      });
    },
    [provider]
  );

  const handleSwitchChain = useCallback(
    async (chainId: string): Promise<void> => {
      await setChain({ chainId: Number(chainId) });
    },
    [setChain]
  );

  const handleSendTransaction = useCallback(
    async (tx: any): Promise<string> => {
      if (!provider) throw new Error("Wallet not connected");

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: tx.value,
            gas: tx.gas,
            ...(tx.maxFeePerGas
              ? {
                  maxFeePerGas: tx.maxFeePerGas,
                  maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
                }
              : {}),
          },
        ],
      });
      return txHash as string;
    },
    [provider]
  );

  const externalProviders = useMemo(() => {
    if (!walletAddress) return undefined;

    return {
      currentAddress: walletAddress,
      currentChain: connectedChain?.id as any,
      type: "generic" as const,
      provider: {
        signMessage: handleSignMessage,
        switchChain: handleSwitchChain,
        sendTransaction: handleSendTransaction,
      },
    };
  }, [walletAddress, connectedChain?.id, handleSignMessage, handleSwitchChain, handleSendTransaction]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 60px)" }}>
      <SKApp
        apiKey={apiKey}
        theme={darkTheme}
        externalProviders={externalProviders}
      />
    </div>
  );
}
