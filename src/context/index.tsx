'use client'

import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider } from 'wagmi'
import { mainnet, base, baseSepolia } from 'viem/chains'
import { wagmiAdapter, projectId, networks } from '@/config'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'FanFlow Payment Gateway',
  description: 'Crypto payment gateway for OnlyFans-style platforms',
  url: 'https://ffdashboard-three.vercel.app', // origin must match your domain & subdomain
  icons: ['https://ffdashboard-three.vercel.app/favicon.ico']
}

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
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