"use client";

import { useState } from "react";
import { ChatPaymentWidget } from "@/components/payment/chat-payment-widget";
import { PokePaymentWidget } from "@/components/payment/poke-payment-widget";
import { MediaPaymentWidget } from "@/components/payment/media-payment-widget";
import { SubscriptionPaymentWidget } from "@/components/payment/subscription-payment-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";

export default function TestPaymentsPage() {
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (result: any) => {
    setLastResult(result);
    setError(null);
    console.log("Payment successful:", result);
  };

  const handleError = (error: Error) => {
    setError(error.message);
    setLastResult(null);
    console.error("Payment error:", error);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">Payment Widgets Test Page</h1>
        <p className="text-muted-foreground text-center">
          Test all payment widget types with proper validation and metadata
        </p>
      </div>

      {lastResult && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription>
            <strong>Last Payment Success:</strong>
            <br />
            Type: {lastResult.transactionType}, Amount: ${lastResult.amount.toFixed(2)}
            <br />
            Agency: {lastResult.agencyId}, Creator: {lastResult.creatorId || 'N/A'}
            <br />
            Metadata: {JSON.stringify(lastResult.metadata)}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            <strong>Payment Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">Buy Gems</TabsTrigger>
          <TabsTrigger value="poke">Poke</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid gap-6 md:grid-cols-2">
            <ChatPaymentWidget
              agencyId="agency-001"
              creatorId="creator-001"
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle>Gem Purchase Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Packages:</strong> 1 gem ($0.001) to 4525 gems ($499.99)
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Use Case:</strong> Buy gems for chat system
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Metadata:</strong> gems_purchased
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Test Cases:</strong>
                  <br />• Try $0.001 ultra-test package (1 gem)
                  <br />• Test different gem packages
                  <br />• Verify USDC payment works
                  <br />• Test onramp functionality
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="poke">
          <div className="grid gap-6 md:grid-cols-2">
            <PokePaymentWidget
              agencyId="agency-001"
              creatorId="creator-001"
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle>Poke Payment Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Range:</strong> $0.001 - $525
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Use Case:</strong> Send a poke with optional message
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Metadata:</strong> type: 'poke', message, message_count: 1
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Test Cases:</strong>
                  <br />• Test preset amounts: $0.001, $0.005, $0.01, $5, $10, $25
                  <br />• Test custom amounts with validation (min $0.001)
                  <br />• Test with and without messages
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="media">
          <div className="grid gap-6 md:grid-cols-2">
            <MediaPaymentWidget
              agencyId="agency-001"
              creatorId="creator-001"
              mediaId="photo-12345"
              mediaType="photo"
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle>Media Payment Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Range:</strong> $0.001 - $210
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Use Case:</strong> Unlock photos/videos with permanent or timed access
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Metadata:</strong> media_id, access_type, access_duration_days, media_type
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Test Cases:</strong>
                  <br />• Test permanent vs timed access
                  <br />• Test photo vs video pricing
                  <br />• Try ultra-cheap amounts: $0.001 (timed) $0.01 (permanent)
                  <br />• Test duration selection for timed access
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="grid gap-6 md:grid-cols-2">
            <SubscriptionPaymentWidget
              agencyId="agency-001"
              creatorsCount={3}
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle>Subscription Payment Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Formula:</strong> $0.01 per creator per month (TEST MODE - was $40)
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Use Case:</strong> Monthly subscription for agency creator management
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Metadata:</strong> billing_period: 'monthly', creators_count
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Test Cases:</strong>
                  <br />• Test with 1 creator ($0.01)
                  <br />• Test with 10 creators ($0.10)
                  <br />• Test with 100 creators ($1.00)
                  <br />• Test validation for 0 or negative creators
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}