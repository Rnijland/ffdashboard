"use client";

import { useState, useEffect } from "react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Progress } from "@/registry/new-york-v4/ui/progress";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Wallet,
  DollarSign
} from "lucide-react";
import {
  FiatPaymentFlow,
  PaymentFlowState,
  checkUSDCBalance
} from "@/lib/payment/fiat-payment-flow";

export interface FiatPaymentWidgetProps {
  amount: number;
  agencyId: string;
  transactionType: 'subscription' | 'gems' | 'poke' | 'media';
  metadata?: Record<string, any>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function FiatPaymentWidget({
  amount,
  agencyId,
  transactionType,
  metadata,
  onSuccess,
  onError
}: FiatPaymentWidgetProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [flowState, setFlowState] = useState<PaymentFlowState>({
    step: 'idle',
    requiredAmount: amount
  });
  const [paymentFlow, setPaymentFlow] = useState<FiatPaymentFlow | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>("0");

  // Check USDC balance periodically
  useEffect(() => {
    if (!address) return;

    const checkBalance = async () => {
      const balance = await checkUSDCBalance(address as `0x${string}`);
      setUsdcBalance(formatUnits(balance, 6));
    };

    checkBalance();
    const interval = setInterval(checkBalance, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [address]);

  // Initialize payment flow when user is connected
  useEffect(() => {
    if (address && !paymentFlow) {
      const flow = new FiatPaymentFlow(
        amount,
        address as `0x${string}`,
        setFlowState
      );
      setPaymentFlow(flow);
    }
  }, [address, amount, paymentFlow]);

  const handleStartPayment = async () => {
    if (!isConnected) {
      open({ view: 'Connect' });
      return;
    }

    if (!paymentFlow) return;

    try {
      // Record initial balance
      await paymentFlow.recordInitialBalance();
      
      // Open onramp modal
      open({ view: 'OnRampProviders' });
      
      // Start monitoring for balance increase
      setTimeout(async () => {
        const hasNewFunds = await paymentFlow.waitForOnramp();
        
        if (hasNewFunds) {
          // Auto-transfer to merchant
          const result = await paymentFlow.transferToMerchant({
            agencyId,
            transactionType,
            ...metadata
          });
          
          onSuccess?.(result);
        }
      }, 5000); // Start checking after 5 seconds
      
    } catch (error) {
      console.error('Payment flow error:', error);
      onError?.(error as Error);
    }
  };

  const handleDirectTransfer = async () => {
    if (!paymentFlow) return;

    try {
      const result = await paymentFlow.transferToMerchant({
        agencyId,
        transactionType,
        ...metadata
      });
      
      onSuccess?.(result);
    } catch (error) {
      console.error('Direct transfer error:', error);
      onError?.(error as Error);
    }
  };

  const getStepProgress = () => {
    switch (flowState.step) {
      case 'idle': return 0;
      case 'onramp': return 25;
      case 'waiting_for_funds': return 50;
      case 'transferring': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const hasEnoughBalance = parseFloat(usdcBalance) >= amount;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay with Card
          </span>
          <Badge variant="secondary">2-Step Process</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Display */}
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-2xl font-bold">${amount.toFixed(2)} USD</p>
          <p className="text-sm text-muted-foreground mt-1">
            Payment will be sent as USDC
          </p>
        </div>

        {/* Current Balance */}
        {isConnected && (
          <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
            <span className="text-sm">Your USDC Balance:</span>
            <span className="font-mono font-semibold">
              ${parseFloat(usdcBalance).toFixed(2)}
            </span>
          </div>
        )}

        {/* Progress Indicator */}
        {flowState.step !== 'idle' && flowState.step !== 'error' && (
          <div className="space-y-2">
            <Progress value={getStepProgress()} />
            <p className="text-xs text-center text-muted-foreground">
              {flowState.step === 'onramp' && 'Step 1: Buy USDC with your card'}
              {flowState.step === 'waiting_for_funds' && 'Waiting for funds to arrive...'}
              {flowState.step === 'transferring' && 'Step 2: Sending payment to merchant'}
              {flowState.step === 'completed' && 'Payment completed!'}
            </p>
          </div>
        )}

        {/* Payment Steps */}
        {flowState.step === 'idle' && (
          <div className="space-y-3">
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  1
                </div>
                <p className="text-sm font-medium">Buy USDC with Card</p>
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                Use Meld.io to purchase USDC with credit/debit card
              </p>
            </div>
            
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                  2
                </div>
                <p className="text-sm font-medium">Auto-Send to Merchant</p>
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                Payment automatically sent after purchase
              </p>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {flowState.step === 'waiting_for_funds' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Waiting for your USDC purchase to complete...
            </AlertDescription>
          </Alert>
        )}

        {flowState.step === 'transferring' && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Sending payment to merchant...
            </AlertDescription>
          </Alert>
        )}

        {flowState.step === 'completed' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Payment successful! Transaction: {flowState.transactionHash?.slice(0, 10)}...
            </AlertDescription>
          </Alert>
        )}

        {flowState.step === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {flowState.error || 'Payment failed. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isConnected ? (
            <Button 
              onClick={() => open({ view: 'Connect' })}
              className="w-full"
              size="lg"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet to Start
            </Button>
          ) : (
            <>
              {hasEnoughBalance ? (
                <Button 
                  onClick={handleDirectTransfer}
                  className="w-full"
                  size="lg"
                  disabled={flowState.step !== 'idle'}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay ${amount} (You have enough USDC)
                </Button>
              ) : (
                <Button 
                  onClick={handleStartPayment}
                  className="w-full"
                  size="lg"
                  disabled={flowState.step !== 'idle'}
                >
                  {flowState.step === 'idle' ? (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Start Payment - ${amount}
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-center text-muted-foreground">
          Powered by Meld.io • Low KYC • Supports 100+ countries
        </p>
      </CardContent>
    </Card>
  );
}