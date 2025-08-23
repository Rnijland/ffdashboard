"use client";

import { CheckoutWidget } from "thirdweb/react";
import { base } from "thirdweb/chains";

// USDC contract address on Base mainnet
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
import { thirdwebClient } from "@/lib/client/thirdweb";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Loader2 } from "lucide-react";
import { useState } from "react";

// Temporary seller address - in production this would come from environment
// This is a demo address for testing purposes
const SELLER_ADDRESS = "0x3328F5f2cEcAF00a2443082B657CedeC70efBbC9" as const;

// Transaction types based on data models
export type TransactionType = 'chat' | 'script' | 'media' | 'subscription';

// Metadata interfaces for each transaction type
export interface ChatMetadata {
  message_count?: number;
  chat_duration?: number;
}

export interface ScriptMetadata {
  script_id?: string;
  license_type?: 'single' | 'unlimited';
}

export interface MediaMetadata {
  media_id?: string;
  access_type?: 'permanent' | 'timed';
  access_duration_days?: number;
}

export interface SubscriptionMetadata {
  billing_period?: 'monthly';
  creators_count?: number;
}

export type TransactionMetadata = ChatMetadata | ScriptMetadata | MediaMetadata | SubscriptionMetadata;

export interface CheckoutWidgetWrapperProps {
  transactionType: TransactionType;
  amount: number;
  metadata: TransactionMetadata;
  agencyId: string;
  creatorId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
}

export function CheckoutWidgetWrapper({
  transactionType,
  amount,
  metadata,
  agencyId,
  creatorId,
  onSuccess,
  onError,
  disabled = false,
  className = ""
}: CheckoutWidgetWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);

  const handleSuccess = () => {
    setIsLoading(false);
    setError(null);
    setShowWidget(false);
    onSuccess?.({
      transactionType,
      amount,
      metadata,
      agencyId,
      creatorId
    });
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Payment failed. Please try again.");
    setShowWidget(false);
    onError?.(new Error("Payment failed"));
  };

  const openCheckout = () => {
    setError(null);
    setIsLoading(true);
    setShowWidget(true);
  };

  const getTransactionTitle = () => {
    switch (transactionType) {
      case 'chat':
        return 'Chat Payment';
      case 'script':
        return 'Script Purchase';
      case 'media':
        return 'Media Unlock';
      case 'subscription':
        return 'Subscription Payment';
      default:
        return 'Payment';
    }
  };

  const getTransactionDescription = () => {
    switch (transactionType) {
      case 'chat': {
        return `Pay $${amount.toFixed(2)} for chat access`;
      }
      case 'script': {
        const scriptMeta = metadata as ScriptMetadata;

        return `Purchase ${scriptMeta.license_type || 'single'} license for $${amount.toFixed(2)}`;
      }
      case 'media': {
        const mediaMeta = metadata as MediaMetadata;

        return `Unlock ${mediaMeta.access_type || 'permanent'} access for $${amount.toFixed(2)}`;
      }
      case 'subscription': {
        const subMeta = metadata as SubscriptionMetadata;

        return `Monthly subscription for ${subMeta.creators_count || 1} creator(s) - $${amount.toFixed(2)}`;
      }
      default: {
        return `Payment of $${amount.toFixed(2)}`;
      }
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="text-center">{getTransactionTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          {getTransactionDescription()}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showWidget ? (
          <Button 
            onClick={openCheckout}
            disabled={disabled || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading...' : `Pay $${amount.toFixed(2)}`}
          </Button>
        ) : (
          <div className="checkout-widget-container">
            <CheckoutWidget
              client={thirdwebClient}
              chain={base}
              tokenAddress={USDC_ADDRESS}
              amount={amount.toString()}
              seller={SELLER_ADDRESS}
              name={getTransactionTitle()}
              description={getTransactionDescription()}
              onSuccess={handleSuccess}
              onError={handleError}
              purchaseData={{
                agencyId,
                creatorId,
                transactionType,
                metadata
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