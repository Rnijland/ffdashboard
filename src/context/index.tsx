'use client'

import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider } from 'wagmi'
import { mainnet, base, baseSepolia } from 'viem/chains'
import { wagmiAdapter, projectId, networks } from '@/config'

// Set up queryClient
const queryClient = new QueryClient()

// Fallback project ID if environment variable is not set
const FALLBACK_PROJECT_ID = 'b35fce82601fc7cd22b6eaa9dec2db69'

if (!projectId) {
  console.error('⚠️ Project ID not found in environment, using fallback')
  console.log('Debug info:', {
    env: process.env.NODE_ENV,
    hasProjectId: !!process.env.NEXT_PUBLIC_PROJECT_ID,
    projectIdValue: process.env.NEXT_PUBLIC_PROJECT_ID,
    usingFallback: true
  })
}

// Set up metadata - URL must match deployment domain
const metadata = {
  name: 'FanFlow Payment Gateway',
  description: 'Crypto payment gateway for creators and agencies',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://ffdashboard-three.vercel.app',
  icons: ['https://ffdashboard-three.vercel.app/favicon.ico']
}

// Use fallback if project ID is not set
const finalProjectId = projectId || FALLBACK_PROJECT_ID

console.log('🔧 Creating AppKit with:', {
  projectId: finalProjectId,
  hasOriginalProjectId: !!projectId,
  metadata: metadata.url,
  networks: networks.map(n => n.name)
})

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: finalProjectId,
  networks,
  metadata,
  features: {
    onramp: true // Enable onramp by default
  }
})

export default function ContextProvider({
  children,
  cookies
}: {
  children: React.ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}