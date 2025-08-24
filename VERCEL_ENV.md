# Vercel Environment Variables Setup

**❌ Issue**: `No project ID is configured. You can create and configure a project ID at https://dashboard.reown.com. { code: 'APKT008' }`

**✅ Solution**: Add environment variables to your Vercel dashboard.

## Required Environment Variables for Vercel

Add these in your Vercel project dashboard under **Settings > Environment Variables**:

```env
# Reown/WalletConnect Configuration
NEXT_PUBLIC_PROJECT_ID=b35fce82601fc7cd22b6eaa9dec2db69

# Merchant Wallet Configuration  
NEXT_PUBLIC_MERCHANT_WALLET=0xD27DDFA8a656432AE73695aF2c7306E22271bFA6

# Network Configuration
NEXT_PUBLIC_USE_TESTNET=true

# Xano Database Configuration
XANO_API_URL=https://xsjm-zu7p-vaky.n7.xano.io/api:ZBBvQcGb
XANO_API_KEY=x5HL21YNOqf3RhfdkzEkt9dXH8Y

# Thirdweb Configuration (if needed)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=a686873ebb29c3b28ea281bd2ad8e0a2
```

## Steps to Add Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable above with its value
4. Set the **Environment** to: `Production`, `Preview`, and `Development`
5. Click **Save**
6. **Redeploy** your application

## Important Notes

- ⚠️ **Never commit sensitive values** to your repository
- 🔄 **Redeploy required** after adding environment variables
- 📋 **Copy values exactly** from your `.env.local` file

## Quick Test

After adding environment variables and redeploying, test at:
- https://ffdashboard-three.vercel.app/test-payments/appkit-pay

The error should be resolved and payments should work.