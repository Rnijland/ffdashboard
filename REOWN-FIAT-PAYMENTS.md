# Reown Fiat-to-Crypto Payment Implementation

## Executive Summary

After extensive research, here's the current state of Reown's fiat-to-crypto payment capabilities:

### ✅ What Works Now: Onramp for User Wallets
- **Meld.io integration** allows users to buy crypto with fiat (credit/debit cards)
- Crypto goes to **user's wallet**, not merchant wallet
- This is working in your current implementation at `/test-payments/reown-onramp`

### ⚠️ What's Not Working: AppKit Pay for Merchants
- **AppKit Pay** is supposed to enable merchant payments but appears to be in early access
- The `@reown/appkit-pay` package exists but the `pay()` function is not actually implemented
- Exchange integration is returning "Unable to get exchanges" errors

## Current Reality vs Marketing

### Marketing Claims (from Reown blog/docs)
- "Frictionless crypto transactions for merchants"
- "Pay with Exchange & Self-Custodial Wallets"
- "Direct payments from Binance/Coinbase accounts"
- Sources: 
  - https://reown.com/blog/appkit-for-payments
  - https://docs.reown.com/appkit/payments/pay-with-exchange

### Actual Implementation Status
- **AppKit Core (Onramp)**: ✅ Working - Users can buy crypto for themselves
- **AppKit Pay (Merchant)**: ❌ Not fully available - Requires early access (contact sales@reown.com)

## The Solution: Hybrid Approach

Since AppKit Pay isn't fully available, we need a hybrid approach combining:
1. **Onramp** for fiat-to-crypto conversion
2. **Direct wallet transfer** for merchant payments

## Implementation Strategy

### Option 1: Two-Step Payment Flow
```
User Journey:
1. User clicks "Pay with Card"
2. Meld.io onramp opens → User buys USDC to their wallet
3. After purchase, prompt user to send USDC to merchant
4. Execute wallet transfer to merchant address
```

### Option 2: Smart Contract Intermediary
```
Advanced Flow:
1. Deploy payment processor contract
2. User buys crypto via onramp
3. Contract automatically forwards to merchant
```

### Option 3: Wait for AppKit Pay Access
```
Contact Reown:
- Email: sales@reown.com
- Request early access to AppKit Pay
- Get proper merchant payment APIs
```

## Working Implementation: Two-Step Flow

Here's what we can build TODAY that actually works:

### Step 1: User Buys Crypto (Working Now)
- Uses Meld.io via AppKit onramp
- Supports credit/debit cards
- Low KYC options available

### Step 2: Transfer to Merchant
- After onramp completes, detect new balance
- Prompt user to complete payment
- Execute USDC transfer to merchant wallet

## Technical Implementation

### Current Working Code (Onramp)
```typescript
// This works - users can buy crypto
import { useAppKitAccount } from '@reown/appkit/react'

const { address } = useAppKitAccount()
// Opens onramp modal for user to buy crypto
```

### What We Need to Add
```typescript
// After onramp completes, transfer to merchant
import { writeContract } from '@wagmi/core'

async function transferToMerchant(amount: number) {
  // Check user's new USDC balance
  const balance = await checkBalance(address)
  
  // Transfer USDC to merchant
  await writeContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [MERCHANT_WALLET, amount]
  })
}
```

## Comparison: Reown vs Thirdweb

| Feature | Thirdweb | Reown (Current) | Reown (Promised) |
|---------|----------|-----------------|------------------|
| User buys crypto | ✅ Hard KYC | ✅ Low KYC via Meld | ✅ |
| Direct merchant payment | ✅ CheckoutWidget | ❌ Manual transfer | ✅ AppKit Pay (early access) |
| Exchange payments | ❌ | ❌ Errors | ✅ Coming soon |
| Implementation complexity | Medium | High (two-step) | Low (when available) |

## Recommendations

### Immediate Action (What We'll Build Now)
1. Implement two-step payment flow
2. User buys USDC via Meld.io onramp
3. Auto-prompt for transfer to merchant
4. Track payment completion

### Future Enhancement
- Contact sales@reown.com for AppKit Pay early access
- Monitor for official release of merchant payment APIs

## Sources

1. **Reown Blog - AppKit for Payments** (Dec 2024)
   - https://reown.com/blog/appkit-for-payments
   - Claims merchant payment capabilities

2. **Reown Docs - Pay with Exchange**
   - https://docs.reown.com/appkit/payments/pay-with-exchange
   - States "early access" - contact sales@reown.com

3. **Reown Docs - Onramp Feature**
   - https://docs.reown.com/appkit/features/onramp
   - Confirms onramp is for users buying crypto for themselves

4. **GitHub - AppKit Repository**
   - https://github.com/reown-com/appkit
   - Package exists but merchant payment functions not exposed

5. **NPM - @reown/appkit-pay**
   - https://www.npmjs.com/package/@reown/appkit-pay
   - Package published but limited functionality

## Conclusion

While Reown markets AppKit Pay as a merchant payment solution, it's currently in early access. The onramp feature works well for users buying crypto, but doesn't directly support merchant payments. We'll implement a two-step flow as a working solution today.