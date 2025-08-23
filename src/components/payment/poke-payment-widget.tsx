"use client";

import { useState } from "react";
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
  const [amount, setAmount] = useState<number>(0.001);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);

  // Get connected wallet
  const account = useActiveAccount();

  // Validate amount is within range ($0.001-$525)
  const isValidAmount = amount >= 0.001 && amount <= 525;

  // Preset amounts for pokes
  const presetAmounts = [0.001, 0.005, 0.01, 5, 10, 25, 50, 100, 200];

  const handleSuccess = async (result?: any) => {
    console.log('💕 Poke SUCCESS:', {
      amount,
      message,
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
          amount,
          gems: 0, // Pokes don't give gems
          agencyId,
          creatorId,
          walletAddress: account?.address || 'unknown',
          transactionHash: result?.transactionHash,
          transactionType: 'poke' as const,
          message // Pass the poke message
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
      transactionType: 'poke',
      amount,
      metadata: {
        message_count: 1,
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
      setError("Amount must be between $0.001 and $525");

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
            min="0.001"
            max="525"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Enter amount ($0.001-$525)"
          />
          {!isValidAmount && (
            <p className="text-sm text-destructive">Amount must be between $0.001 and $525</p>
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
              chain={CHAIN}
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