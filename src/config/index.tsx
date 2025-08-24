import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, base, baseSepolia } from 'viem/chains'

// Get project ID from environment with debugging
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

// Debug logging for environment variables
if (typeof window !== 'undefined') {
  console.log('🔍 Client-side environment check:')
  console.log('   NEXT_PUBLIC_PROJECT_ID:', process.env.NEXT_PUBLIC_PROJECT_ID ? '✅ Set' : '❌ Not set')
  console.log('   Raw value:', process.env.NEXT_PUBLIC_PROJECT_ID)
  console.log('   All NEXT_PUBLIC vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')))
} else {
  console.log('🔍 Server-side environment check:')
  console.log('   NEXT_PUBLIC_PROJECT_ID:', process.env.NEXT_PUBLIC_PROJECT_ID ? '✅ Set' : '❌ Not set')
  console.log('   Value length:', process.env.NEXT_PUBLIC_PROJECT_ID?.length)
}

if (!projectId) {
  console.error('❌ NEXT_PUBLIC_PROJECT_ID is not configured!')
  console.error('📋 Please add your Reown project ID to environment variables:')
  console.error('   - For local development: add to .env.local')
  console.error('   - For Vercel deployment: add to Vercel dashboard Environment Variables')
  console.error('   - Expected value: b35fce82601fc7cd22b6eaa9dec2db69')
  console.error('🔗 Get your project ID from: https://dashboard.reown.com')
  
  // Don't throw error immediately, use a fallback
  console.warn('⚠️ Using fallback project ID for now...')
}

// Define networks - using Base for production and Base Sepolia for testing
const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
export const networks = IS_TESTNET ? [baseSepolia, mainnet] : [base, mainnet]

// Fallback project ID
const FALLBACK_PROJECT_ID = 'b35fce82601fc7cd22b6eaa9dec2db69'
const finalProjectId = projectId || FALLBACK_PROJECT_ID

// Log final configuration
console.log('📦 Wagmi Adapter Configuration:', {
  projectId: finalProjectId?.substring(0, 8) + '...',
  isTestnet: IS_TESTNET,
  networks: networks.map(n => n.name),
  hasEnvProjectId: !!projectId,
  usingFallback: !projectId
})

// Create the Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId: finalProjectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig