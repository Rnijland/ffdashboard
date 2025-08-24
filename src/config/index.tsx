import { cookieStorage, createStorage } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, base, baseSepolia } from 'viem/chains'

// Get project ID from environment
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
}

// Define networks - using Base for production and Base Sepolia for testing
const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true'
export const networks = IS_TESTNET ? [baseSepolia, mainnet] : [base, mainnet]

// Create the Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig