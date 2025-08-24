'use client'

import { useState } from 'react'
import { FiatPaymentWidget } from '@/components/payment/fiat-payment-widget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card'
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert'
import { Badge } from '@/registry/new-york-v4/ui/badge'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs'
import { 
  CreditCard, 
  CheckCircle, 
  XCircle,
  Info,
  ArrowRight,
  DollarSign,
  Crown,
  Sparkles,
  Heart,
  Image
} from 'lucide-react'

export default function FiatFlowTestPage() {
  const [lastResult, setLastResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = (result: any) => {
    setLastResult(result)
    setError(null)
    console.log('Payment successful:', result)
  }

  const handleError = (error: Error) => {
    setError(error.message)
    setLastResult(null)
    console.error('Payment error:', error)
  }

  const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
  const MERCHANT_WALLET = process.env.NEXT_PUBLIC_MERCHANT_WALLET

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Fiat-to-Crypto Payment Flow</h1>
        <p className="text-muted-foreground mb-4">
          Two-step process: Buy crypto with card → Auto-send to merchant
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant={IS_TESTNET ? "secondary" : "default"}>
            {IS_TESTNET ? "Base Sepolia Testnet" : "Base Mainnet"}
          </Badge>
          <Badge variant="outline">Low KYC via Meld.io</Badge>
          <Badge variant="outline">100+ Countries</Badge>
        </div>
      </div>

      {/* How It Works */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Fiat Payment Works
          </CardTitle>
          <CardDescription>
            Since AppKit Pay is in early access, we use a two-step process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <p className="font-semibold">Connect Wallet</p>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                User connects their wallet (or creates one)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <p className="font-semibold">Buy USDC with Card</p>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                Meld.io onramp opens for credit/debit card payment
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <p className="font-semibold">Auto-Transfer</p>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                USDC automatically sent to merchant wallet
              </p>
            </div>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> This is a temporary solution until AppKit Pay is fully available. 
              Contact sales@reown.com for early access to the direct merchant payment API.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Merchant Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Merchant Wallet</CardTitle>
          <CardDescription>All payments will be sent to this address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded-lg">
            <p className="font-mono text-sm break-all">{MERCHANT_WALLET}</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      {(lastResult || error) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Payment Success
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Payment Error
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastResult && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  <p className="font-semibold mb-2">Transaction Hash:</p>
                  <p className="font-mono text-xs break-all">{lastResult.transactionHash}</p>
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Payment Types */}
      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="gems">Buy Gems</TabsTrigger>
          <TabsTrigger value="poke">Send Poke</TabsTrigger>
          <TabsTrigger value="media">Unlock Media</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          <div className="grid gap-6 md:grid-cols-2">
            <FiatPaymentWidget
              amount={0.03} // $0.03 for testing (3 creators × $0.01)
              agencyId="test-agency-001"
              transactionType="subscription"
              metadata={{
                billing_period: 'monthly',
                creators_count: 3,
                fee_per_creator: 0.01
              }}
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Testing subscription payment with fiat-to-crypto flow.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Creators:</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Per Creator:</span>
                    <span className="font-semibold">$0.01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total:</span>
                    <span className="font-semibold">$0.03/month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gems">
          <div className="grid gap-6 md:grid-cols-2">
            <FiatPaymentWidget
              amount={0.05} // $0.05 for testing
              agencyId="test-agency-001"
              transactionType="gems"
              metadata={{
                gems_purchased: 50,
                creator_id: 'test-creator-001'
              }}
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Gems Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Purchase gems using credit/debit card.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Gems:</span>
                    <span className="font-semibold">50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Price:</span>
                    <span className="font-semibold">$0.05</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="poke">
          <div className="grid gap-6 md:grid-cols-2">
            <FiatPaymentWidget
              amount={0.001} // $0.001 for testing
              agencyId="test-agency-001"
              transactionType="poke"
              metadata={{
                creator_id: 'test-creator-001',
                message: 'Hello!',
                type: 'poke'
              }}
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Send Poke
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Send a poke with micro-payment.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Amount:</span>
                    <span className="font-semibold">$0.001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Type:</span>
                    <span className="font-semibold">Poke</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="media">
          <div className="grid gap-6 md:grid-cols-2">
            <FiatPaymentWidget
              amount={0.10} // $0.10 for testing
              agencyId="test-agency-001"
              transactionType="media"
              metadata={{
                creator_id: 'test-creator-001',
                media_id: 'test-media-001',
                access_type: 'permanent'
              }}
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-blue-500" />
                  Media Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Unlock exclusive media content.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Price:</span>
                    <span className="font-semibold">$0.10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Access:</span>
                    <span className="font-semibold">Permanent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Comparison with Other Solutions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Why This Approach?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">✅ Advantages:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Low KYC requirements via Meld.io</li>
                <li>• Supports 100+ countries</li>
                <li>• Multiple payment providers (9 via Meld)</li>
                <li>• Works with existing wallet infrastructure</li>
                <li>• No smart contract deployment needed</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">⚠️ Current Limitations:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Two-step process (not instant)</li>
                <li>• User needs a wallet</li>
                <li>• Requires manual transfer after onramp</li>
                <li>• AppKit Pay direct merchant API not yet available</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">🚀 Future (with AppKit Pay):</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Direct fiat-to-merchant payments</li>
                <li>• Single-step checkout</li>
                <li>• No wallet required</li>
                <li>• Contact sales@reown.com for early access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}