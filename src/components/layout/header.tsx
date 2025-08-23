"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "@/components/wallet-connect";
import { Card } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { LayoutDashboard, TestTube } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">FanFlow Payments</h1>
          
          <nav className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button 
                variant={isDashboard ? "default" : "ghost"} 
                size="sm"
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/test-payments">
              <Button 
                variant={pathname === '/test-payments' ? "default" : "ghost"} 
                size="sm"
                className="gap-2"
              >
                <TestTube className="h-4 w-4" />
                Test Payments
              </Button>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}