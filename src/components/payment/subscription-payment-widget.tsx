"use client";

import { useState, useEffect } from "react";
import { CheckoutWidget } from "thirdweb/react";
import { base } from "thirdweb/chains";

// USDC contract address on Base mainnet
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
import { thirdwebClient } from "@/lib/client/thirdweb";

// Temporary seller address for demo purposes
const SELLER_ADDRESS = "0x3328F5f2cEcAF00a2443082B657CedeC70efBbC9" as const;
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

  // Calculate amount based on $40/creator
  useEffect(() => {
    setAmount(creators * 40);
  }, [creators]);

  // Validate creators count is reasonable
  const isValidCreators = creators >= 1 && creators <= 1000;
  const isValidAmount = amount > 0;

  const handleSuccess = () => {
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
            Each creator costs $40/month. You currently have {creatorsCount} creator{creatorsCount !== 1 ? 's' : ''}.
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
              chain={base}
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