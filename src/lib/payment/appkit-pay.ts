/**
 * AppKit Pay Configuration
 * Handles merchant payment processing with Reown AppKit Pay
 */

// Import pay functions when @reown/appkit-pay is installed
// For now, we'll define the types and configuration

export const MERCHANT_WALLET = process.env.NEXT_PUBLIC_MERCHANT_WALLET as `0x${string}`;

if (!MERCHANT_WALLET) {
  throw new Error('NEXT_PUBLIC_MERCHANT_WALLET is not configured');
}

// Base network configuration
const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true';

// Payment Assets Configuration
export const PAYMENT_ASSETS = {
  // Base Mainnet USDC
  USDC_BASE: {
    network: 'eip155:8453', // Base Mainnet
    asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    metadata: {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6
    }
  },
  
  // Base Sepolia USDC (for testing)
  USDC_BASE_SEPOLIA: {
    network: 'eip155:84532', // Base Sepolia
    asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
    metadata: {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6
    }
  },
  
  // Base ETH
  ETH_BASE: {
    network: 'eip155:8453', // Base Mainnet
    asset: 'native',
    metadata: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  
  // Base Sepolia ETH (for testing)
  ETH_BASE_SEPOLIA: {
    network: 'eip155:84532', // Base Sepolia
    asset: 'native',
    metadata: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

// Get active payment asset based on environment
export const getActivePaymentAsset = (preferUSDC: boolean = true) => {
  if (IS_TESTNET) {
    return preferUSDC ? PAYMENT_ASSETS.USDC_BASE_SEPOLIA : PAYMENT_ASSETS.ETH_BASE_SEPOLIA;
  }
  return preferUSDC ? PAYMENT_ASSETS.USDC_BASE : PAYMENT_ASSETS.ETH_BASE;
};

// Payment types for our application
export interface PaymentMetadata {
  agencyId: string;
  creatorId?: string;
  transactionType: 'subscription' | 'gems' | 'poke' | 'media';
  metadata?: Record<string, any>;
}

// Process payment function
export async function processPayment(
  amount: number,
  metadata: PaymentMetadata,
  preferUSDC: boolean = true
) {
  try {
    // Dynamic import to avoid build errors if package isn't installed yet
    const appKitPay = await import('@reown/appkit-pay').catch(() => {
      console.error('AppKit Pay module not found. Please ensure @reown/appkit-pay is installed.');
      throw new Error('Payment module not available. Please try again later.');
    });
    
    if (!appKitPay?.pay) {
      throw new Error('Payment function not available');
    }
    
    const paymentAsset = getActivePaymentAsset(preferUSDC);
    
    console.log('Initiating payment:', {
      recipient: MERCHANT_WALLET,
      amount,
      asset: paymentAsset.metadata.symbol,
      network: paymentAsset.network
    });
    
    // Try to initialize payment with reduced features if exchanges fail
    let result;
    try {
      result = await appKitPay.pay({
        recipient: MERCHANT_WALLET,
        amount,
        paymentAsset,
        // Additional metadata can be passed for tracking
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          environment: IS_TESTNET ? 'testnet' : 'mainnet'
        }
      });
    } catch (payError: any) {
      // If exchanges fail, try without exchange features
      if (payError.message?.includes('Unable to get exchanges')) {
        console.warn('Exchange services unavailable, falling back to wallet-only payment');
        
        // Use simplified payment flow
        result = await appKitPay.pay({
          recipient: MERCHANT_WALLET,
          amount,
          paymentAsset,
          disableExchanges: true, // Try to disable exchange features
          metadata: {
            ...metadata,
            timestamp: Date.now(),
            environment: IS_TESTNET ? 'testnet' : 'mainnet',
            fallbackMode: true
          }
        });
      } else {
        throw payError;
      }
    }
    
    // Log successful payment
    console.log('Payment successful:', {
      txHash: result.transactionHash,
      amount,
      recipient: MERCHANT_WALLET,
      metadata
    });
    
    // Update database with payment information
    await updatePaymentDatabase(result, metadata);
    
    return result;
  } catch (error: any) {
    console.error('Payment failed:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('Origin')) {
      throw new Error('Payment service configuration error. Please contact support.');
    } else if (error.message?.includes('Unable to get exchanges')) {
      throw new Error('Exchange services temporarily unavailable. Please connect your wallet directly to proceed with payment.');
    } else if (error.message?.includes('User rejected')) {
      throw new Error('Payment cancelled by user.');
    }
    
    throw error;
  }
}

// Update database after successful payment
async function updatePaymentDatabase(paymentResult: any, metadata: PaymentMetadata) {
  try {
    const response = await fetch('/api/update-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentResult.amount,
        agencyId: metadata.agencyId,
        creatorId: metadata.creatorId,
        walletAddress: paymentResult.from || 'unknown',
        transactionHash: paymentResult.transactionHash,
        transactionType: metadata.transactionType,
        metadata: metadata.metadata
      })
    });
    
    if (!response.ok) {
      console.error('Failed to update database:', await response.text());
    }
  } catch (error) {
    console.error('Database update error:', error);
  }
}

// Subscription-specific payment function
export async function processSubscriptionPayment(
  agencyId: string,
  creatorsCount: number,
  monthlyFeePerCreator: number = 0.01 // $0.01 per creator for testing
) {
  const totalAmount = creatorsCount * monthlyFeePerCreator;
  
  return processPayment(totalAmount, {
    agencyId,
    transactionType: 'subscription',
    metadata: {
      billing_period: 'monthly',
      creators_count: creatorsCount,
      fee_per_creator: monthlyFeePerCreator
    }
  });
}

// Gems purchase payment function
export async function processGemsPayment(
  agencyId: string,
  creatorId: string,
  gemPackage: { gems: number; price: number }
) {
  return processPayment(gemPackage.price, {
    agencyId,
    creatorId,
    transactionType: 'gems',
    metadata: {
      gems_purchased: gemPackage.gems
    }
  });
}

// Poke payment function
export async function processPokePayment(
  agencyId: string,
  creatorId: string,
  amount: number,
  message?: string
) {
  return processPayment(amount, {
    agencyId,
    creatorId,
    transactionType: 'poke',
    metadata: {
      type: 'poke',
      message: message || '',
      message_count: 1
    }
  });
}

// Media unlock payment function
export async function processMediaPayment(
  agencyId: string,
  creatorId: string,
  mediaId: string,
  amount: number,
  accessType: 'permanent' | 'timed',
  accessDurationDays?: number
) {
  return processPayment(amount, {
    agencyId,
    creatorId,
    transactionType: 'media',
    metadata: {
      media_id: mediaId,
      access_type: accessType,
      access_duration_days: accessType === 'timed' ? accessDurationDays : undefined
    }
  });
}

// Check payment status
export async function checkPaymentStatus() {
  try {
    const appKitPay = await import('@reown/appkit-pay');
    
    // Check if functions exist before calling
    if (!appKitPay.getIsPaymentInProgress || !appKitPay.getPayResult || !appKitPay.getPayError) {
      console.warn('Payment status functions not available');
      return null;
    }
    
    const isInProgress = await appKitPay.getIsPaymentInProgress();
    const result = await appKitPay.getPayResult();
    const error = await appKitPay.getPayError();
    
    return {
      isInProgress,
      result,
      error
    };
  } catch (error) {
    console.error('Failed to check payment status:', error);
    return null;
  }
}

// Get available exchanges for payment
export async function getAvailableExchanges() {
  try {
    const appKitPay = await import('@reown/appkit-pay');
    
    // Check if function exists
    if (!appKitPay.getExchanges) {
      console.warn('Exchange function not available in AppKit Pay');
      return [];
    }
    
    return await appKitPay.getExchanges();
  } catch (error) {
    console.error('Failed to get exchanges:', error);
    // Return empty array instead of throwing
    return [];
  }
}