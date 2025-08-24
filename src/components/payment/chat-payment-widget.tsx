"use client";

import { useState } from "react";
import { CheckoutWidget, useActiveAccount } from "thirdweb/react";
import { base, baseSepolia } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/client/thirdweb";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Input } from "@/registry/new-york-v4/ui/input";
import { Label } from "@/registry/new-york-v4/ui/label";
import { Loader2 } from "lucide-react";

// USDC contract addresses
const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet
const USDC_TESTNET = "0x26df8d79c4faca88d0212f0bd7c4a4d1e8955f0e"; // Base Sepolia testnet

// Environment-based configuration
const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
const CHAIN = IS_TESTNET ? baseSepolia : base;
const USDC_ADDRESS = IS_TESTNET ? USDC_TESTNET : USDC_MAINNET;
// Temporary seller address for demo purposes
const SELLER_ADDRESS = "0xD27DDFA8a656432AE73695aF2c7306E22271bFA6" as const;

// Gem packages with pricing
const GEM_PACKAGES = [
  { gems: 1, price: 0.001 }, // Ultra test package (0.1 cent)
  { gems: 5, price: 0.005 }, // Mini test package (0.5 cent)
  { gems: 10, price: 0.01 }, // Super cheap test package
  { gems: 50, price: 0.10 }, // Cheap test package
  { gems: 135, price: 19.99 },
  { gems: 380, price: 49.99 },
  { gems: 775, price: 99.99 },
  { gems: 2140, price: 249.99 },
  { gems: 4525, price: 499.99 }
];

export interface ChatPaymentWidgetProps {
  agencyId: string;
  creatorId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
  testMode?: boolean; // Enable fiat onramp testing
}

export function ChatPaymentWidget({
  agencyId,
  creatorId,
  onSuccess,
  onError,
  disabled = false,
  className = "",
  testMode = false
}: ChatPaymentWidgetProps) {
  const [selectedPackage, setSelectedPackage] = useState(GEM_PACKAGES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);

  // Get connected wallet
  const account = useActiveAccount();

  const handleSuccess = async (result?: any) => {
    console.log('🎉 Payment SUCCESS:', {
      selectedPackage,
      amount: selectedPackage.price,
      gems: selectedPackage.gems,
      agencyId,
      creatorId,
      account: account?.address,
      result
    });

    // Update database with payment information
    try {
      console.log('💾 Updating database...');
      const response = await fetch('/api/update-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPackage.price,
          gems: selectedPackage.gems,
          agencyId,
          creatorId,
          walletAddress: account?.address || 'unknown',
          transactionHash: result?.transactionHash,
          transactionType: 'gems' as const
        })
      });

      const updateResult = await response.json();
      
      if (response.ok) {
        console.log('✅ Database updated successfully:', updateResult);
      } else {
        console.error('⚠️ Database update failed:', updateResult);
        // Don't fail the payment, just log the error
      }
    } catch (error) {
      console.error('❌ Database update error:', error);
      // Don't fail the payment, just log the error
    }
    
    setIsLoading(false);
    setError(null);
    setShowWidget(false);
    
    // Call the parent success handler
    onSuccess?.({
      transactionType: 'gems',
      amount: selectedPackage.price,
      metadata: {
        gems_purchased: selectedPackage.gems
      },
      agencyId,
      creatorId
    });
  };

  const handleError = (error?: any) => {
    console.error('❌ Payment ERROR:', {
      selectedPackage,
      amount: selectedPackage.price,
      account: account?.address,
      error
    });
    
    setIsLoading(false);
    setError("Gem purchase failed. Please try again.");
    setShowWidget(false);
    onError?.(new Error("Gem purchase failed"));
  };

  const openCheckout = () => {
    console.log('🚀 Starting checkout:', {
      selectedPackage,
      amount: selectedPackage.price,
      chain: CHAIN.name,
      chainId: CHAIN.id,
      seller: SELLER_ADDRESS,
      buyer: account?.address,
      tokenAddress: USDC_ADDRESS,
      agencyId,
      creatorId,
      isTestnet: IS_TESTNET
    });
    
    setError(null);
    setIsLoading(true);
    setShowWidget(true);
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="text-center">Buy Gems for Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {IS_TESTNET && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>
              🧪 <strong>Test Mode:</strong> Using Base Sepolia testnet (free testing)
            </AlertDescription>
          </Alert>
        )}

        {testMode && (
          <Alert className="bg-purple-50 border-purple-200">
            <AlertDescription>
              💳 <strong>Fiat Test Mode:</strong> Credit card payments are in sandbox mode - no real money charged!<br/>
              <span className="text-xs">Tip: Click "Secured by Coinbase" 10x for mock mode</span>
            </AlertDescription>
          </Alert>
        )}

        {!account && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription>
              👆 <strong>Sign in with Google</strong> using the button above to make payments
            </AlertDescription>
          </Alert>
        )}

        {account && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-xs">
              ✅ <strong>Connected:</strong> {account.address}<br/>
              {account.address === "0xD27DDFA8a656432AE73695aF2c7306E22271bFA6" 
                ? "🎉 This is your target wallet!" 
                : "⚠️ Different wallet - may need to transfer ETH or switch accounts"}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Select Gem Package</Label>
          <div className="grid grid-cols-2 gap-2">
            {GEM_PACKAGES.map((pkg) => (
              <Button
                key={pkg.gems}
                variant={selectedPackage.gems === pkg.gems ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPackage(pkg)}
                className="flex flex-col p-2 h-auto"
              >
                <span className="text-xs">{pkg.gems} gems</span>
                <span className="text-xs font-bold">${pkg.price}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Selected: {selectedPackage.gems} gems for ${selectedPackage.price.toFixed(2)}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showWidget ? (
          <Button 
            onClick={openCheckout}
            disabled={disabled || isLoading || !account}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading...' : `Buy ${selectedPackage.gems} Gems - $${selectedPackage.price.toFixed(2)}`}
          </Button>
        ) : (
          <div className="checkout-widget-container">
            <CheckoutWidget
              client={thirdwebClient}
              chain={CHAIN}
              tokenAddress={USDC_ADDRESS}
              amount={selectedPackage.price.toString()}
              seller={SELLER_ADDRESS}
              name="Buy Gems for Chat"
              description={`Buy ${selectedPackage.gems} gems for $${selectedPackage.price.toFixed(2)}`}
              onSuccess={handleSuccess}
              onError={handleError}
              purchaseData={{
                agencyId,
                creatorId,
                transactionType: 'gems',
                metadata: {
                  gems_purchased: selectedPackage.gems
                }
              }}
              paymentMethods={["crypto", "card"]}
              currency="USD"
              theme="light"
              // testMode={testMode} // Enable fiat onramp testing - removed due to type error
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}