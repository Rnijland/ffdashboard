# Reown AppKit - Complete Web3 Payment Solutions

## Overview

Reown offers two complementary solutions for Web3 applications: **AppKit Core** for user wallet management and **AppKit Pay** for merchant payment processing. This document explains both modules and their use cases.

## AppKit Core vs AppKit Pay

Reown provides two distinct but complementary modules:

### AppKit Core 🔗
- **Wallet connections** - Connect to 600+ wallets
- **Onramp services** - Users buy crypto for themselves via Meld.io
- **Swap functionality** - Token swapping within wallets
- **User-focused features** - Account management, balance display
- **Use case**: When users need to connect wallets or buy crypto

### AppKit Pay 💳 (Our Primary Solution)
- **Merchant payment processing** - Accept payments for products/services
- **Direct to merchant wallet** - Funds go straight to your configured address
- **Multiple payment methods** - Wallets, exchanges, credit cards
- **Business-focused features** - Subscriptions, checkout flows
- **Use case**: When you need to collect payments from customers

## AppKit Pay Features (What We Implemented)

AppKit Pay is designed specifically for merchants who need to accept payments for products and services. It provides a complete payment gateway that sends funds directly to your merchant wallet.

### Payment Methods
1. **Pay with Self-Custodial Wallet** - MetaMask, Trust, Ledger, etc.
2. **Pay with Exchange** - Direct from Binance, Coinbase (no withdrawals needed!)
3. **One-Click Checkout** - Fast, mobile-optimized flows (coming soon)
4. **Subscriptions & Recurring Payments** - For memberships, SaaS (coming soon)

### Why AppKit Pay is Ideal for Our Use Case
- **600+ wallet support** - Maximum user reach
- **Exchange payments** - Users pay directly from Binance/Coinbase (no withdrawals!)
- **Low KYC options** - Better conversion rates
- **Multi-chain** - EVM, Solana, Bitcoin support
- **No smart contract deployment** - AppKit handles infrastructure
- **Apple Pay / Google Pay** - Available through onramp providers

## Quick Integration Guide

### 1. Install
```bash
npm install @reown/appkit-pay
```

### 2. Configure Merchant Wallet
```env
# .env.local
NEXT_PUBLIC_MERCHANT_WALLET=0xYourWalletAddress
```

### 3. Basic Payment
```javascript
import { pay } from '@reown/appkit-pay'

// Process a payment - goes directly to your wallet!
const result = await pay({
    recipient: process.env.NEXT_PUBLIC_MERCHANT_WALLET,
    amount: 29.99, // USD amount
    paymentAsset: USDC_BASE // USDC on Base network
})
```

### 4. Payment Assets (Base Network)
```javascript
const USDC_BASE = {
    network: 'eip155:8453', // Base Mainnet
    asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    metadata: { name: 'USD Coin', symbol: 'USDC', decimals: 6 }
}
```

## AppKit Pay vs ThirdWeb Comparison

| Feature | ThirdWeb | Reown AppKit Pay |
|---------|----------|------------------|
| **KYC Requirements** | ❌ Hard KYC required | ✅ **Low KYC options** |
| Onramp Providers | Limited (Coinbase) | 9 providers via Meld.io |
| Wallet Support | Basic | 600+ wallets |
| **Exchange Payments** | ❌ None | ✅ **Binance, Coinbase direct** |
| Smart Contracts | Required deployment | Optional |
| Apple/Google Pay | ❌ | ✅ Via onramp providers |
| Integration Time | Days/weeks | Hours |
| Subscription Support | Manual setup | Native support |

### 🎯 **Key Advantage: Low KYC**

**ThirdWeb** requires full KYC verification for all users - this creates massive friction and blocks many potential customers.

**AppKit Pay** offers **low KYC options** through select providers:
- Minimal document requirements
- Some providers require only basic info
- Much higher conversion rates
- Better user experience

## How Payments Work

### 1. User Flow
```
User clicks "Subscribe" → AppKit Pay modal opens → User selects payment method:
├── Wallet payment (MetaMask, Trust, etc.)
├── Exchange payment (Binance, Coinbase - no withdrawals!)
└── Credit card (via onramp → includes Apple/Google Pay)
```

### 2. Payment Processing
- All payments go directly to **your merchant wallet**
- No intermediary smart contracts
- Instant settlement for wallet/exchange payments
- Onramp payments convert fiat → USDC → your wallet

### 3. Database Integration
- Payment success triggers webhook/callback
- Update subscription status in database
- Track transaction hashes for verification

## What We Have Implemented

### AppKit Core Implementation
- ✅ **Wallet connections** at `/test-payments/reown-onramp`
- ✅ **Meld.io onramp** - Users can buy crypto for themselves
- ✅ **600+ wallet support** via Reown providers

### AppKit Pay Implementation  
- ✅ **Merchant payment processing** for subscriptions
- ✅ **Direct payments to merchant wallet**
- ✅ **Multiple payment methods** (wallets, exchanges, cards)

## File Structure

```
src/
├── lib/payment/
│   └── appkit-pay.ts          # Payment service & config
├── components/payment/
│   └── subscription-payment-widget-appkit.tsx
├── app/test-payments/
│   ├── reown-onramp/page.tsx  # AppKit Core (wallet + onramp)
│   └── appkit-pay/page.tsx    # AppKit Pay (merchant payments)
└── .env.local                 # NEXT_PUBLIC_MERCHANT_WALLET
```

## Environment Setup

```env
# Merchant wallet (where payments go)
NEXT_PUBLIC_MERCHANT_WALLET=0xD27DDFA8a656432AE73695aF2c7306E22271bFA6

# Network configuration
NEXT_PUBLIC_USE_TESTNET=true  # Base Sepolia for testing
```

## Testing Both Modules

### AppKit Core Testing
- **Test Page**: `/test-payments/reown-onramp`
- **Features**: Wallet connections, Meld.io onramp
- **Use Case**: Users buying crypto for themselves

### AppKit Pay Testing  
- **Test Page**: `/test-payments/appkit-pay`
- **Payment Types**: Subscriptions, gems, pokes, media unlocks
- **Payment Methods**: Wallets, exchanges, credit cards
- **Networks**: Base Sepolia (test) / Base Mainnet (production)

## Team Integration Notes

- **Replace existing ThirdWeb CheckoutWidget** with AppKit Pay calls
- **Use `processPayment()` function** from `/lib/payment/appkit-pay.ts`
- **All payments automatically go** to configured merchant wallet
- **Database updates handled** in payment success callback
- **No smart contract deployment** required

## Resources

- [AppKit Pay Docs](https://docs.reown.com/appkit/payments/overview)
- [Implementation Examples](https://github.com/reown-com/appkit-web-examples)
- [Payment Methods Guide](https://docs.reown.com/appkit/javascript/payments/pay-with-exchange)