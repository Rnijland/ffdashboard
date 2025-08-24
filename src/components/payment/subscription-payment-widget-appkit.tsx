"use client";

import { useState, useEffect } from "react";
import { processSubscriptionPayment, MERCHANT_WALLET } from "@/lib/payment/appkit-pay";
import { processFallbackPayment } from "@/lib/payment/fallback-payment";
import { useAccount, useConnect } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Input } from "@/registry/new-york-v4/ui/input";
import { Label } from "@/registry/new-york-v4/ui/label";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Loader2, Crown, CreditCard, Wallet, Building2 } from "lucide-react";

export interface SubscriptionPaymentWidgetAppKitProps {
  agencyId: string;
  creatorsCount: number;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export function SubscriptionPaymentWidgetAppKit({
  agencyId,
  creatorsCount,
  onSuccess,
  onError,
  disabled = false,
  className = ""
}: SubscriptionPaymentWidgetAppKitProps) {
  const [creators, setCreators] = useState<number>(creatorsCount);
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Calculate amount based on $0.01/creator for testing
  const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
  const FEE_PER_CREATOR = 0.01; // Always $0.01 for testing
  
  useEffect(() => {
    setAmount(creators * FEE_PER_CREATOR);
  }, [creators]);

  // Validate creators count is reasonable
  const isValidCreators = creators >= 1 && creators <= 1000;
  const isValidAmount = amount > 0;

  const handlePayment = async () => {
    if (!isValidCreators || !isValidAmount) {
      setError("Invalid subscription configuration");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      let result;
      
      if (useFallback && isConnected) {
        // Use fallback direct wallet payment
        console.log('Using fallback payment method...');
        result = await processFallbackPayment(amount, {
          agencyId,
          transactionType: 'subscription',
          metadata: {
            billing_period: 'monthly',
            creators_count: creators,
            fee_per_creator: FEE_PER_CREATOR
          }
        });
      } else {
        // Try AppKit Pay first
        try {
          result = await processSubscriptionPayment(
            agencyId,
            creators,
            FEE_PER_CREATOR
          );
        } catch (appKitError: any) {
          // If AppKit Pay fails due to exchanges, offer fallback
          if (appKitError.message?.includes('Exchange services')) {
            console.warn('AppKit Pay failed, switching to fallback mode');
            setUseFallback(true);
            setError("Exchange services unavailable. Please connect your wallet to continue.");
            setIsLoading(false);
            return;
          }
          throw appKitError;
        }
      }

      console.log('👑 Subscription payment SUCCESS:', result);
      setIsLoading(false);
      onSuccess?.({
        transactionType: 'subscription',
        amount,
        metadata: {
          billing_period: 'monthly',
          creators_count: creators
        },
        agencyId,
        result
      });
    } catch (err) {
      console.error('Subscription payment failed:', err);
      setIsLoading(false);
      setError("Subscription payment failed. Please try again.");
      onError?.(err as Error);
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          Monthly Subscription (AppKit Pay)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Method Options */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <p className="text-sm font-semibold mb-2">Payment Options:</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Wallet className="w-3 h-3" />
              <span>600+ Wallets (MetaMask, Trust, etc.)</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              <span>Direct from Exchange (Binance, Coinbase)</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-3 h-3" />
              <span>Credit Card via Onramp (Meld.io)</span>
            </div>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-lg font-semibold">${amount.toFixed(2)}/month</p>
          <p className="text-sm text-muted-foreground">
            ${FEE_PER_CREATOR}/creator • {creators} creator{creators !== 1 ? 's' : ''}
          </p>
          {IS_TESTNET && (
            <Badge variant="secondary" className="mt-2">TEST MODE</Badge>
          )}
        </div>

        {/* Creator Count Input */}
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
        </div>

        {/* Merchant Wallet Info */}
        <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900 p-2 rounded">
          <p className="font-semibold">Payment will be sent to:</p>
          <p className="font-mono truncate">{MERCHANT_WALLET}</p>
        </div>

        {/* Subscription Benefits */}
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
          <Alert variant={useFallback ? "default" : "destructive"}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wallet Connection for Fallback */}
        {useFallback && !isConnected && (
          <Button 
            onClick={() => connect({ connector: connectors[0] })}
            className="w-full"
            size="lg"
            variant="outline"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet to Continue
          </Button>
        )}

        {/* Payment Button */}
        {(!useFallback || isConnected) && (
          <Button 
            onClick={handlePayment}
            disabled={disabled || isLoading || !isValidCreators || !isValidAmount}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Subscribe - ${amount.toFixed(2)}/month
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Powered by Reown AppKit Pay • Supports 600+ wallets & exchanges
        </p>
      </CardContent>
    </Card>
  );
}