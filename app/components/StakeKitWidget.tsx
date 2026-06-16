import { useCallback, useMemo } from "react";
import { useWalletConnector } from "@orderly.network/hooks";
import { SKApp, darkTheme } from "@stakekit/widget";
import type { SKExternalProviders } from "@stakekit/widget";
import { getRuntimeConfig } from "../utils/runtime-config";

import "@stakekit/widget/package/css";

export default function StakeKitWidget() {
  const { wallet, setChain, connectedChain } = useWalletConnector();
  const apiKey = getRuntimeConfig("VITE_STAKEKIT_API_KEY") || "";

  const handleSignMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!wallet?.provider) throw new Error("Wallet not connected");
      const accounts = await wallet.provider.request({
        method: "eth_accounts",
      });
      const address = (accounts as string[])[0];
      return wallet.provider.request({
        method: "personal_sign",
        params: [message, address],
      }) as Promise<string>;
    },
    [wallet]
  );

  const handleSwitchChain = useCallback(
    async (chainId: number): Promise<void> => {
      await setChain({ chainId });
    },
    [setChain]
  );

  const handleSendTransaction = useCallback(
    async (tx: any): Promise<string> => {
      if (!wallet?.provider) throw new Error("Wallet not connected");

      if (tx.type === "evm") {
        const evmTx = tx.tx;
        const txHash = await wallet.provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              to: evmTx.to,
              from: evmTx.from,
              data: evmTx.data,
              value: evmTx.value,
              gas: evmTx.gas,
              ...(evmTx.maxFeePerGas
                ? {
                    maxFeePerGas: evmTx.maxFeePerGas,
                    maxPriorityFeePerGas: evmTx.maxPriorityFeePerGas,
                  }
                : { gasPrice: evmTx.gasPrice }),
            },
          ],
        });
        return txHash as string;
      }

      throw new Error(`Unsupported transaction type: ${tx.type}`);
    },
    [wallet]
  );

  const externalProviders = useMemo((): SKExternalProviders | undefined => {
    if (!wallet?.address) return undefined;

    return {
      currentAddress: wallet.address,
      currentChain: connectedChain?.id as any,
      type: "generic" as const,
      provider: {
        signMessage: handleSignMessage,
        switchChain: handleSwitchChain,
        sendTransaction: handleSendTransaction,
      },
    };
  }, [wallet?.address, connectedChain?.id, handleSignMessage, handleSwitchChain, handleSendTransaction]);

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
