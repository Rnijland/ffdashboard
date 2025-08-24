'use client'

import { useState } from 'react'
import { SubscriptionPaymentWidgetAppKit } from '@/components/payment/subscription-payment-widget-appkit'
import { MERCHANT_WALLET, processPayment, checkPaymentStatus, getAvailableExchanges } from '@/lib/payment/appkit-pay'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert'
import { Badge } from '@/registry/new-york-v4/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs'
import { Input } from '@/registry/new-york-v4/ui/input'
import { Label } from '@/registry/new-york-v4/ui/label'
import { Separator } from '@/registry/new-york-v4/ui/separator'
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  DollarSign,
  Sparkles,
  Heart,
  Image
} from 'lucide-react'

export default function AppKitPayTestPage() {
  const [lastResult, setLastResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState<string>('0.01')
  const [isLoading, setIsLoading] = useState(false)
  const [exchanges, setExchanges] = useState<any[]>([])

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

  const handleDirectPayment = async (type: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const amount = parseFloat(customAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount')
      }

      const result = await processPayment(amount, {
        agencyId: 'test-agency-001',
        creatorId: type === 'gems' ? 'test-creator-001' : undefined,
        transactionType: type as any,
        metadata: {
          test_payment: true,
          payment_type: type
        }
      })

      handleSuccess(result)
    } catch (err) {
      handleError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkStatus = async () => {
    const status = await checkPaymentStatus()
    console.log('Payment status:', status)
    if (status) {
      setLastResult(status)
    }
  }

  const loadExchanges = async () => {
    const availableExchanges = await getAvailableExchanges()
    setExchanges(availableExchanges)
    console.log('Available exchanges:', availableExchanges)
  }

  const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true'

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">AppKit Pay - Merchant Payment Gateway</h1>
        <p className="text-muted-foreground mb-4">
          Accept payments directly to your merchant wallet from 600+ wallets, exchanges, and credit cards
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant={IS_TESTNET ? "secondary" : "default"}>
            {IS_TESTNET ? "Base Sepolia Testnet" : "Base Mainnet"}
          </Badge>
          <Badge variant="outline">USDC Payments</Badge>
        </div>
      </div>

      {/* Merchant Wallet Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Merchant Receiving Wallet
          </CardTitle>
          <CardDescription>
            All payments will be sent directly to this address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Your Thirdweb Smart Wallet:</p>
            <p className="font-mono text-sm font-semibold break-all">{MERCHANT_WALLET}</p>
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
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(lastResult, null, 2)}
                  </pre>
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

      {/* Payment Options */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Self-Custody Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• MetaMask</li>
              <li>• Trust Wallet</li>
              <li>• Ledger</li>
              <li>• 600+ more wallets</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Exchange Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Binance (Direct)</li>
              <li>• Coinbase (Direct)</li>
              <li>• No withdrawals needed</li>
              <li>• One-click payment</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Fiat Onramp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Credit/Debit Cards</li>
              <li>• Bank Transfers</li>
              <li>• Apple Pay / Google Pay*</li>
              <li>• Via Meld.io providers</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Test Payment Widgets */}
      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="gems">Buy Gems</TabsTrigger>
          <TabsTrigger value="poke">Send Poke</TabsTrigger>
          <TabsTrigger value="media">Unlock Media</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          <div className="grid gap-6 md:grid-cols-2">
            <SubscriptionPaymentWidgetAppKit
              agencyId="test-agency-001"
              creatorsCount={3}
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Card>
              <CardHeader>
                <CardTitle>How Subscription Payments Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Payment Flow:</p>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. User clicks "Subscribe"</li>
                    <li>2. AppKit Pay modal opens</li>
                    <li>3. User chooses payment method:</li>
                    <li className="ml-4">• Wallet (600+ options)</li>
                    <li className="ml-4">• Exchange (Binance/Coinbase)</li>
                    <li className="ml-4">• Credit Card (via onramp)</li>
                    <li>4. Payment sent to merchant wallet</li>
                    <li>5. Database updated with subscription</li>
                  </ol>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">Note on Apple/Google Pay:</p>
                  <p>Available through onramp providers when user selects credit card payment. Providers like Moonpay and Transak support these payment methods.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gems">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Buy Gems (Direct Payment)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <Button 
                  onClick={() => handleDirectPayment('gems')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Buy Gems - ${customAmount}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gems Package Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Direct payment test for gems purchase. This will open AppKit Pay modal and process payment to merchant wallet.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="poke">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Send Poke (Direct Payment)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <Button 
                  onClick={() => handleDirectPayment('poke')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Send Poke - ${customAmount}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Poke Payment Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Send a poke with a micro-payment. Supports amounts as low as $0.001.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="media">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-blue-500" />
                  Unlock Media (Direct Payment)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <Button 
                  onClick={() => handleDirectPayment('media')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Image className="mr-2 h-4 w-4" />
                  Unlock Media - ${customAmount}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Media Payment Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Unlock photos or videos with permanent or timed access. Payment goes directly to merchant wallet.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Utility Functions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkStatus} variant="outline">
              Check Payment Status
            </Button>
            <Button onClick={loadExchanges} variant="outline">
              Get Available Exchanges
            </Button>
          </div>
          {exchanges.length > 0 && (
            <div className="text-sm">
              <p className="font-semibold mb-2">Available Exchanges:</p>
              <pre className="text-xs overflow-auto bg-muted p-2 rounded">
                {JSON.stringify(exchanges, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}