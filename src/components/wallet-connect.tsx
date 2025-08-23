"use client";

import { ConnectButton, useActiveAccount, useConnectedWallets, useSetActiveWallet, useDisconnect } from "thirdweb/react";
import { createWallet, walletConnect, inAppWallet } from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/client/thirdweb";
import { Button } from "@/registry/new-york-v4/ui/button";

// Configure supported wallets
const wallets = [
  // Standard wallets first (gives more control)
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  walletConnect(),
  createWallet("me.rainbow"),
  createWallet("io.zerion.wallet"),
  // thirdweb smart wallet
  inAppWallet({
    auth: {
      options: ["google", "email", "phone"],
    },
  }),
];

export function WalletConnect() {
  const activeAccount = useActiveAccount();
  const connectedWallets = useConnectedWallets();
  const setActiveWallet = useSetActiveWallet();
  const { disconnect } = useDisconnect();

  return (
    <div className="flex items-center gap-2">
      <ConnectButton
        client={thirdwebClient}
        wallets={wallets}
        chains={[base]} // Focus on Base chain
        connectModal={{
          size: "wide",
          title: "Connect Your Wallet",
          showThirdwebBranding: false,
        }}
        connectButton={{
          label: "Connect Wallet",
        }}
        detailsButton={{
          displayBalanceToken: {
            [base.id]: base.nativeCurrency?.address || "0x", // Show ETH balance instead of USDC
          },
        }}
        switchButton={{
          label: "Wrong Network?",
        }}
        theme="light"
      />
      
      {/* Wallet Switcher - if multiple wallets connected */}
      {connectedWallets.length > 1 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Switch Wallet:</span>
          <div className="flex gap-1">
            {connectedWallets.map((wallet) => {
              const account = wallet.getAccount();
              const isActive = account?.address === activeAccount?.address;
              
              return (
                <Button
                  key={account?.address}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveWallet(wallet)}
                  className="text-xs"
                >
                  {account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}
                  {account?.address === "0xD27DDFA8a656432AE73695aF2c7306E22271bFA6" && " 💰"}
                </Button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Manual disconnect to reset wallet selection */}
      {activeAccount && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
}