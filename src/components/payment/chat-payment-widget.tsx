"use client";

import { useState } from "react";
import { CheckoutWidget } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { thirdwebClient } from "@/lib/client/thirdweb";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Input } from "@/registry/new-york-v4/ui/input";
import { Label } from "@/registry/new-york-v4/ui/label";
import { Loader2 } from "lucide-react";

// USDC contract address on Base mainnet
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// Temporary seller address for demo purposes
const SELLER_ADDRESS = "0xD27DDFA8a656432AE73695aF2c7306E22271bFA6" as const;

// Gem packages with pricing
const GEM_PACKAGES = [
  { gems: 1, price: 0.01 }, // Super cheap test package
  { gems: 10, price: 0.10 }, // Cheap test package
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
}

export function ChatPaymentWidget({
  agencyId,
  creatorId,
  onSuccess,
  onError,
  disabled = false,
  className = ""
}: ChatPaymentWidgetProps) {
  const [selectedPackage, setSelectedPackage] = useState(GEM_PACKAGES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);

  const handleSuccess = () => {
    setIsLoading(false);
    setError(null);
    setShowWidget(false);
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

  const handleError = () => {
    setIsLoading(false);
    setError("Gem purchase failed. Please try again.");
    setShowWidget(false);
    onError?.(new Error("Gem purchase failed"));
  };

  const openCheckout = () => {
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
            disabled={disabled || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading...' : `Buy ${selectedPackage.gems} Gems - $${selectedPackage.price.toFixed(2)}`}
          </Button>
        ) : (
          <div className="checkout-widget-container">
            <CheckoutWidget
              client={thirdwebClient}
              chain={base}
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
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}