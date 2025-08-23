"use client";

import { ConnectButton } from "thirdweb/react";
import { createWallet, walletConnect, inAppWallet } from "thirdweb/wallets";
import { base } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/client/thirdweb";

// Configure supported wallets
const wallets = [
  // Your thirdweb smart wallet - should allow selecting the right account
  inAppWallet({
    auth: {
      options: ["email", "google", "apple", "facebook", "phone"],
    },
  }),
  // Standard wallets
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  walletConnect(),
  // Add more wallets as needed
  createWallet("me.rainbow"),
  createWallet("io.zerion.wallet"),
];

export function WalletConnect() {
  return (
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
          [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Show USDC balance
        },
      }}
      switchButton={{
        label: "Wrong Network?",
      }}
      theme="light"
    />
  );
}