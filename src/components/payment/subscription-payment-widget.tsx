"use client";

import { useState, useEffect } from "react";
import { CheckoutWidget, useActiveAccount } from "thirdweb/react";
import { base, baseSepolia } from "thirdweb/chains";

// USDC contract addresses
const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet
const USDC_TESTNET = "0x26df8d79c4faca88d0212f0bd7c4a4d1e8955f0e"; // Base Sepolia testnet

// Environment-based configuration
const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
const CHAIN = IS_TESTNET ? baseSepolia : base;
const USDC_ADDRESS = IS_TESTNET ? USDC_TESTNET : USDC_MAINNET;
import { thirdwebClient } from "@/lib/client/thirdweb";

// Temporary seller address for demo purposes
const SELLER_ADDRESS = "0xD27DDFA8a656432AE73695aF2c7306E22271bFA6" as const;
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Input } from "@/registry/new-york-v4/ui/input";
import { Label } from "@/registry/new-york-v4/ui/label";
import { Loader2, Crown } from "lucide-react";

export interface SubscriptionPaymentWidgetProps {
  agencyId: string;
  creatorsCount: number;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export function SubscriptionPaymentWidget({
  agencyId,
  creatorsCount,
  onSuccess,
  onError,
  disabled = false,
  className = ""
}: SubscriptionPaymentWidgetProps) {
  const [creators, setCreators] = useState<number>(creatorsCount);
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  
  // Get connected wallet
  const account = useActiveAccount();

  // Calculate amount based on $0.001/creator for testing (was $40/creator)
  useEffect(() => {
    setAmount(creators * 0.001);
  }, [creators]);

  // Validate creators count is reasonable
  const isValidCreators = creators >= 1 && creators <= 1000;
  const isValidAmount = amount > 0;

  const handleSuccess = async (result?: any) => {
    console.log('👑 Subscription payment SUCCESS:', {
      amount,
      creators,
      agencyId,
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
          amount,
          agencyId,
          walletAddress: account?.address || 'unknown',
          transactionHash: result?.transactionHash,
          transactionType: 'subscription' as const
        })
      });

      const updateResult = await response.json();
      
      if (response.ok) {
        console.log('✅ Database updated successfully:', updateResult);
      } else {
        console.error('⚠️ Database update failed:', updateResult);
      }
    } catch (error) {
      console.error('❌ Database update error:', error);
    }

    setIsLoading(false);
    setError(null);
    setShowWidget(false);
    onSuccess?.({
      transactionType: 'subscription',
      amount,
      metadata: {
        billing_period: 'monthly' as const,
        creators_count: creators
      },
      agencyId
    });
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Subscription payment failed. Please try again.");
    setShowWidget(false);
    onError?.(new Error("Subscription payment failed"));
  };

  const openCheckout = () => {
    if (!isValidCreators) {
      setError("Number of creators must be between 1 and 1000");

      return;
    }
    if (!isValidAmount) {
      setError("Invalid subscription amount");

      return;
    }
    setError(null);
    setIsLoading(true);
    setShowWidget(true);
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          Monthly Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-lg font-semibold">${amount.toFixed(2)}/month</p>
          <p className="text-sm text-muted-foreground">
            ${40}/creator • {creators} creator{creators !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="creators">Number of Creators</Label>
          <Input
            id="creators"
            type="number"
            min="1"
            max="1000"
            value={creators}
            onChange={(e) => setCreators(Number(e.target.value))}
            placeholder="Enter number of creators"
          />
          {!isValidCreators && (
            <p className="text-sm text-destructive">Number of creators must be between 1 and 1000</p>
          )}
          <p className="text-xs text-muted-foreground">
            TEST MODE: Each creator costs $0.001/month (was $40). You currently have {creatorsCount} creator{creatorsCount !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Subscription Benefits</Label>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Full access to creator management</li>
            <li>• Payment processing for all transaction types</li>
            <li>• Analytics and reporting</li>
            <li>• 24/7 support</li>
          </ul>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showWidget ? (
          <Button 
            onClick={openCheckout}
            disabled={disabled || isLoading || !isValidCreators || !isValidAmount}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading...' : `Subscribe - $${amount.toFixed(2)}/month`}
          </Button>
        ) : (
          <div className="checkout-widget-container">
            <CheckoutWidget
              client={thirdwebClient}
              chain={CHAIN}
              tokenAddress={USDC_ADDRESS}
              amount={amount.toString()}
              seller={SELLER_ADDRESS}
              name="Monthly Subscription"
              description={`Monthly subscription for ${creators} creator${creators !== 1 ? 's' : ''} at $40 each = $${amount.toFixed(2)}/month`}
              onSuccess={handleSuccess}
              onError={handleError}
              purchaseData={{
                agencyId,
                transactionType: 'subscription',
                metadata: {
                  billing_period: 'monthly' as const,
                  creators_count: creators
                }
              }}
              paymentMethods={["crypto", "card"]}
              currency="USD"
              theme="light"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}