'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount, useBalance } from 'wagmi'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card'
import { Badge } from '@/registry/new-york-v4/ui/badge'
import { Separator } from '@/registry/new-york-v4/ui/separator'
import { ExternalLink, Wallet, CreditCard, ArrowUpCircle } from 'lucide-react'

export default function ReownOnrampPage() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address
  })

  const handleConnect = () => {
    open()
  }

  const handleOpenOnramp = () => {
    open({ view: 'OnRampProviders' })
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reown AppKit + Meld.io Onramp</h1>
        <p className="text-muted-foreground">
          Test crypto onramp with Meld.io's smart routing and low KYC options
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>
              Connect your wallet or use onramp without a wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected && address ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
                {balance && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="text-sm font-medium">
                      {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Badge variant="outline" className="mb-4">
                  Not Connected
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect wallet for crypto payments or use onramp directly
                </p>
              </div>
            )}
            
            <Button onClick={handleConnect} variant="outline" className="w-full">
              {isConnected ? 'Change Wallet' : 'Connect Wallet'}
            </Button>
          </CardContent>
        </Card>

        {/* Onramp Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Onramp Features
            </CardTitle>
            <CardDescription>
              Meld.io smart routing with multiple providers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">9</div>
                <div className="text-xs text-muted-foreground">Providers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">200+</div>
                <div className="text-xs text-muted-foreground">Countries</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Low KYC Options</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Available
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Smart Routing</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Multiple Currencies</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  113
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onramp Action Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5" />
              Buy Crypto with Fiat
            </CardTitle>
            <CardDescription>
              Use Meld.io's onramp providers to buy crypto with credit card, bank transfer, or local payment methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Click "Buy Crypto" to open onramp providers</li>
                <li>2. Meld.io automatically finds the best provider for your location</li>
                <li>3. Choose from credit card, bank transfer, or local payment methods</li>
                <li>4. Some providers offer low KYC (minimal documents required)</li>
                <li>5. Crypto is sent directly to your connected wallet or a new one</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleOpenOnramp} 
                className="flex-1"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Buy Crypto with Fiat
              </Button>
              
              <Button 
                variant="outline" 
                asChild 
                size="lg"
              >
                <a 
                  href="https://www.meld.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Learn More
                </a>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Powered by Meld.io smart routing across Transak, Moonpay, Banxa, Ramp Network, and 5 other providers
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}