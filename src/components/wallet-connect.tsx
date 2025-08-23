"use client";

import { ConnectButton, useActiveAccount, useConnectedWallets, useSetActiveWallet, useDisconnect, useActiveWallet } from "thirdweb/react";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/client/thirdweb";
import { Button } from "@/registry/new-york-v4/ui/button";

// Configure ONLY external wallets (no inAppWallet - connects to existing wallets)
const wallets = [
  // External wallets - these connect to EXISTING wallets, don't create new ones
  createWallet("io.metamask"),           // MetaMask
  createWallet("com.coinbase.wallet"),   // Coinbase Wallet  
  createWallet("me.rainbow"),            // Rainbow
  createWallet("io.zerion.wallet"),      // Zerion
  createWallet("app.phantom"),           // Phantom
  createWallet("io.rabby"),              // Rabby
  walletConnect(),                       // WalletConnect (for thirdweb mobile app)
];

export function WalletConnect() {
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
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
          title: "Connect Your Existing Wallet",
          showThirdwebBranding: false,
          welcomeScreen: {
            title: "Connect to FanFlow Payments",
            subtitle: "Connect your existing wallet (MetaMask, Rainbow, etc.) or use WalletConnect for thirdweb mobile app",
          },
        }}
        connectButton={{
          label: "Connect Wallet",
        }}
        detailsButton={{
          // Let thirdweb handle balance display automatically
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
          onClick={() => activeWallet && disconnect(activeWallet)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
}