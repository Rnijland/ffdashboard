# 🧪 Testnet Testing Guide

## Quick Start: Free Testing with Base Sepolia

To test the CheckoutWidget and webhook integration without spending real money:

### 1. Enable Testnet Mode

Add to your `.env.local`:
```bash
NEXT_PUBLIC_USE_TESTNET=true
```

### 2. Get Free Test Tokens

1. **Get Base Sepolia ETH**: Visit [thirdweb faucets](https://thirdweb.com/faucets) 
2. **Get Base Sepolia USDC**: Use a testnet USDC faucet or DEX

### 3. Network Configuration

- **Testnet**: Base Sepolia (`baseSepolia` chain)
- **USDC Contract**: `0x26df8d79c4faca88d0212f0bd7c4a4d1e8955f0e`
- **Free Testing**: No real money required! ✅

### 4. Webhook Configuration

Your webhook endpoint works with both mainnet and testnet:
- URL: `https://ffdashboard-three.vercel.app/api/thirdweb-webhook`
- Secret: Same webhook secret for both networks
- Chain ID: `84532` (Base Sepolia) vs `8453` (Base mainnet)

### 5. Visual Indicators

When testnet mode is active, you'll see:
```
🧪 Test Mode: Using Base Sepolia testnet (free testing)
```

## Alternative: Mainnet with Ultra-Cheap Prices

If testnet doesn't work, use mainnet with our cheapest packages:
- **1 gem**: $0.01 (1 cent)  
- **10 gems**: $0.10 (10 cents)

Your current Base mainnet balance: `0.0020716 ETH` should cover multiple small tests.

## Switching Back to Production

Remove from `.env.local`:
```bash
# NEXT_PUBLIC_USE_TESTNET=true  # Comment out or remove
```

The app automatically uses Base mainnet when testnet mode is disabled.