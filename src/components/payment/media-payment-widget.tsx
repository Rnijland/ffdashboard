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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/new-york-v4/ui/select";
import { Loader2, Image, Video } from "lucide-react";

export interface MediaPaymentWidgetProps {
  agencyId: string;
  creatorId: string;
  mediaId: string;
  mediaType: 'photo' | 'video';
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export function MediaPaymentWidget({
  agencyId,
  creatorId,
  mediaId,
  mediaType,
  onSuccess,
  onError,
  disabled = false,
  className = ""
}: MediaPaymentWidgetProps) {
  const [amount, setAmount] = useState<number>(0.001);
  const [accessType, setAccessType] = useState<'permanent' | 'timed'>('permanent');
  const [accessDurationDays, setAccessDurationDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  
  // Get connected wallet
  const account = useActiveAccount();

  // Validate amount is within range ($0.001-$210)
  const isValidAmount = amount >= 0.001 && amount <= 210;

  // Auto-adjust price based on access type and media type
  const handleAccessTypeChange = (value: 'permanent' | 'timed') => {
    setAccessType(value);
    if (value === 'permanent') {
      setAmount(mediaType === 'photo' ? 0.01 : 0.05); // Higher for permanent access
    } else {
      setAmount(mediaType === 'photo' ? 0.001 : 0.005); // Lower for timed access
    }
  };

  const handleSuccess = async (result?: any) => {
    console.log('🎬 Media payment SUCCESS:', {
      amount,
      mediaId,
      accessType,
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
          agencyId,
          creatorId,
          walletAddress: account?.address || 'unknown',
          transactionHash: result?.transactionHash,
          transactionType: 'media' as const
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
      transactionType: 'media',
      amount,
      metadata: {
        media_id: mediaId,
        access_type: accessType,
        access_duration_days: accessType === 'timed' ? accessDurationDays : undefined,
        media_type: mediaType
      },
      agencyId,
      creatorId
    });
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Media purchase failed. Please try again.");
    setShowWidget(false);
    onError?.(new Error("Media purchase failed"));
  };

  const openCheckout = () => {
    if (!isValidAmount) {
      setError("Amount must be between $0.001 and $210");

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
          {mediaType === 'photo' ? (
            <Image className="w-5 h-5 text-blue-500" />
          ) : (
            <Video className="w-5 h-5 text-purple-500" />
          )}
          Unlock {mediaType === 'photo' ? 'Photo' : 'Video'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Media Information</Label>
          <div className="text-sm text-muted-foreground">
            <p>Media ID: {mediaId}</p>
            <p>Type: {mediaType === 'photo' ? 'Photo' : 'Video'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessType">Access Type</Label>
          <Select value={accessType} onValueChange={handleAccessTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select access type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="permanent">Permanent Access</SelectItem>
              <SelectItem value="timed">Timed Access</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {accessType === 'timed' && (
          <div className="space-y-2">
            <Label htmlFor="duration">Access Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="365"
              value={accessDurationDays}
              onChange={(e) => setAccessDurationDays(Number(e.target.value))}
              placeholder="Duration in days"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount (USD) - {accessType === 'permanent' ? 'Permanent' : `${accessDurationDays} day`} Access
          </Label>
          <Input
            id="amount"
            type="number"
            min="0.001"
            max="210"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Enter amount ($0.001-$210)"
          />
          {!isValidAmount && (
            <p className="text-sm text-destructive">Amount must be between $0.001 and $210</p>
          )}
          <p className="text-xs text-muted-foreground">
            {accessType === 'permanent' 
              ? `Permanent ${mediaType} access typically ranges $50-$210` 
              : `Timed ${mediaType} access typically ranges $10-$100`
            }
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
            disabled={disabled || isLoading || !isValidAmount}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading...' : `Unlock ${mediaType} - $${amount.toFixed(2)}`}
          </Button>
        ) : (
          <div className="checkout-widget-container">
            <CheckoutWidget
              client={thirdwebClient}
              chain={CHAIN}
              tokenAddress={USDC_ADDRESS}
              amount={amount.toString()}
              seller={SELLER_ADDRESS}
              name={`Unlock ${mediaType === 'photo' ? 'Photo' : 'Video'}`}
              description={`${accessType === 'permanent' ? 'Permanent' : `${accessDurationDays} day`} access to ${mediaType} for $${amount.toFixed(2)}`}
              onSuccess={handleSuccess}
              onError={handleError}
              purchaseData={{
                agencyId,
                creatorId,
                transactionType: 'media',
                metadata: {
                  media_id: mediaId,
                  access_type: accessType,
                  access_duration_days: accessType === 'timed' ? accessDurationDays : undefined,
                  media_type: mediaType
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