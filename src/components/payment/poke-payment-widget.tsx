"use client";

import { useState } from "react";
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
import { Loader2, Heart } from "lucide-react";

export interface PokePaymentWidgetProps {
  agencyId: string;
  creatorId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export function PokePaymentWidget({
  agencyId,
  creatorId,
  onSuccess,
  onError,
  disabled = false,
  className = ""
}: PokePaymentWidgetProps) {
  const [amount, setAmount] = useState<number>(5);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);

  // Validate amount is within range ($5-$525)
  const isValidAmount = amount >= 5 && amount <= 525;

  // Preset amounts for pokes
  const presetAmounts = [5, 10, 25, 50, 100, 200];

  const handleSuccess = () => {
    setIsLoading(false);
    setError(null);
    setShowWidget(false);
    onSuccess?.({
      transactionType: 'chat',
      amount,
      metadata: {
        message_count: 1,
        chat_duration: 0,
        type: 'poke',
        message: message
      },
      agencyId,
      creatorId
    });
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Poke payment failed. Please try again.");
    setShowWidget(false);
    onError?.(new Error("Poke payment failed"));
  };

  const openCheckout = () => {
    if (!isValidAmount) {
      setError("Amount must be between $5 and $525");
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
          <Heart className="w-5 h-5 text-pink-500" />
          Send a Poke
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Quick Amount Selection</Label>
          <div className="grid grid-cols-3 gap-2">
            {presetAmounts.map((preset) => (
              <Button
                key={preset}
                variant={amount === preset ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(preset)}
              >
                ${preset}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Custom Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            min="5"
            max="525"
            step="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Enter amount ($5-$525)"
          />
          {!isValidAmount && (
            <p className="text-sm text-destructive">Amount must be between $5 and $525</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Optional Message</Label>
          <Input
            id="message"
            type="text"
            maxLength={100}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a sweet message..."
          />
          <p className="text-xs text-muted-foreground">{message.length}/100 characters</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showWidget ? (
          <Button 
            onClick={openCheckout}
            disabled={disabled || isLoading || !isValidAmount}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading...' : `Send Poke - $${amount.toFixed(2)}`}
          </Button>
        ) : (
          <div className="checkout-widget-container">
            <CheckoutWidget
              client={thirdwebClient}
              chain={base}
              tokenAddress={USDC_ADDRESS}
              amount={amount.toString()}
              seller={SELLER_ADDRESS}
              name="Send a Poke"
              description={`Send a poke for $${amount.toFixed(2)}${message ? ' with message: "' + message + '"' : ''}`}
              onSuccess={handleSuccess}
              onError={handleError}
              purchaseData={{
                agencyId,
                creatorId,
                transactionType: 'poke',
                metadata: {
                  type: 'poke',
                  message: message,
                  message_count: 1
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