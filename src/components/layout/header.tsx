"use client";

import { WalletConnect } from "@/components/wallet-connect";
import { Card } from "@/registry/new-york-v4/ui/card";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-semibold">FanFlow Payments</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}