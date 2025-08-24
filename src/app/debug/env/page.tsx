'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card'
import { Badge } from '@/registry/new-york-v4/ui/badge'
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert'

export default function EnvDebugPage() {
  // Get all environment variables
  const envVars = {
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
    NEXT_PUBLIC_MERCHANT_WALLET: process.env.NEXT_PUBLIC_MERCHANT_WALLET,
    NEXT_PUBLIC_USE_TESTNET: process.env.NEXT_PUBLIC_USE_TESTNET,
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    NODE_ENV: process.env.NODE_ENV,
  }

  // Check if running on Vercel
  const isVercel = process.env.NEXT_PUBLIC_VERCEL === '1' || 
                   typeof window !== 'undefined' && window.location.hostname.includes('vercel')

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-6">Environment Variables Debug</h1>
      
      <Alert className="mb-6">
        <AlertDescription>
          This page helps debug environment variable issues on Vercel deployment.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Deployment Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Environment:</span>
            <Badge>{process.env.NODE_ENV}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Is Vercel:</span>
            <Badge variant={isVercel ? "default" : "secondary"}>
              {isVercel ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>URL:</span>
            <code className="text-sm">
              {typeof window !== 'undefined' ? window.location.origin : 'Server-side'}
            </code>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Required Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <code className="font-mono text-sm font-semibold">{key}</code>
                  {value ? (
                    <Badge variant="default">Set ✅</Badge>
                  ) : (
                    <Badge variant="destructive">Missing ❌</Badge>
                  )}
                </div>
                {value && (
                  <div className="mt-2">
                    <code className="text-xs text-muted-foreground break-all">
                      {key.includes('SECRET') || key.includes('KEY') 
                        ? value.substring(0, 10) + '...' 
                        : value}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Expected Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>NEXT_PUBLIC_PROJECT_ID:</strong>
              <code className="ml-2">b35fce82601fc7cd22b6eaa9dec2db69</code>
            </div>
            <div>
              <strong>NEXT_PUBLIC_MERCHANT_WALLET:</strong>
              <code className="ml-2">0xD27DDFA8a656432AE73695aF2c7306E22271bFA6</code>
            </div>
            <div>
              <strong>NEXT_PUBLIC_USE_TESTNET:</strong>
              <code className="ml-2">true</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Fix Missing Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to your Vercel dashboard</li>
            <li>Navigate to Settings → Environment Variables</li>
            <li>Add each missing variable with its expected value</li>
            <li>Make sure to select all environments (Production, Preview, Development)</li>
            <li>Click Save and redeploy the application</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}