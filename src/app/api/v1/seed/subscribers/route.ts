import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';

// Check if seeding has already been done
let hasSeeded = false;

const testAgencies = [
  {
    name: 'Stellar Models Agency',
    slug: 'stellar-models',
    wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
    subscription_status: 'active' as const,
    creators_count: 12,
  },
  {
    name: 'Elite Creators Hub',
    slug: 'elite-creators',
    wallet_address: '0x2345678901bcdef2345678901bcdef2345678901',
    subscription_status: 'active' as const,
    creators_count: 8,
  },
  {
    name: 'Diamond Content Co',
    slug: 'diamond-content',
    wallet_address: '0x3456789012cdef3456789012cdef3456789012cd',
    subscription_status: 'active' as const,
    creators_count: 15,
  },
  {
    name: 'Premium Talent Group',
    slug: 'premium-talent',
    wallet_address: '0x4567890123def4567890123def4567890123def4',
    subscription_status: 'inactive' as const,
    creators_count: 5,
  },
  {
    name: 'NextGen Influencers',
    slug: 'nextgen-influencers',
    wallet_address: '0x567890123ef567890123ef567890123ef5678901',
    subscription_status: 'active' as const,
    creators_count: 10,
  },
  {
    name: 'Sunset Media Agency',
    slug: 'sunset-media',
    wallet_address: '0x67890123f67890123f67890123f67890123f6789',
    subscription_status: 'suspended' as const,
    creators_count: 3,
  },
  {
    name: 'Rising Stars Collective',
    slug: 'rising-stars',
    wallet_address: '0x7890123467890123467890123467890123467890',
    subscription_status: 'active' as const,
    creators_count: 7,
  },
  {
    name: 'Platinum Creators',
    slug: 'platinum-creators',
    wallet_address: '0x890123567890123567890123567890123567890a',
    subscription_status: 'active' as const,
    creators_count: 1,
  },
  {
    name: 'Global Talent Network',
    slug: 'global-talent',
    wallet_address: '0x90123678901236789012367890123678901236b',
    subscription_status: 'inactive' as const,
    creators_count: 4,
  },
  {
    name: 'Luxe Content Studio',
    slug: 'luxe-content',
    wallet_address: '0xa0123789012378901237890123789012378901c',
    subscription_status: 'active' as const,
    creators_count: 9,
  },
];

// Enhanced transaction creation with realistic patterns
async function createRealisticTransactionHistory(agency: any, agencyData: any, createdTransactions: any[]) {
  const now = new Date();
  
  // Define different agency payment patterns
  const patterns = {
    'stellar-models': { reliability: 0.95, preferredMethod: 'crypto', avgDays: 28 },
    'elite-creators': { reliability: 0.98, preferredMethod: 'crypto', avgDays: 30 },
    'diamond-content': { reliability: 0.92, preferredMethod: 'card', avgDays: 31 },
    'premium-talent': { reliability: 0.70, preferredMethod: 'card', avgDays: 35 }, // Problematic
    'nextgen-influencers': { reliability: 0.88, preferredMethod: 'crypto', avgDays: 29 },
    'sunset-media': { reliability: 0.40, preferredMethod: 'card', avgDays: 45 }, // Very problematic
    'rising-stars': { reliability: 0.85, preferredMethod: 'crypto', avgDays: 32 },
    'platinum-creators': { reliability: 0.99, preferredMethod: 'crypto', avgDays: 28 }, // Excellent
    'global-talent': { reliability: 0.75, preferredMethod: 'card', avgDays: 33 },
    'luxe-content': { reliability: 0.90, preferredMethod: 'crypto', avgDays: 30 }
  };

  const pattern = patterns[agencyData.slug] || { reliability: 0.85, preferredMethod: 'crypto', avgDays: 30 };
  
  // Create 8-12 months of history
  const monthsOfHistory = Math.floor(Math.random() * 5) + 8;
  
  for (let month = 0; month < monthsOfHistory; month++) {
    const baseDate = new Date(now);
    baseDate.setMonth(baseDate.getMonth() - month);
    baseDate.setDate(Math.floor(Math.random() * 5) + pattern.avgDays - 30); // Vary payment dates
    
    const transactionAmount = agencyData.creators_count * 40;
    const fee = transactionAmount * 0.025;
    
    // Determine if this payment should succeed based on agency pattern
    const shouldSucceed = Math.random() < pattern.reliability;
    
    // Payment method preference with some variation
    const paymentMethod = Math.random() < 0.8 ? pattern.preferredMethod : 
                         (pattern.preferredMethod === 'crypto' ? 'card' : 'crypto');
    
    // Create the main subscription payment
    const mainStatus = shouldSucceed ? 'completed' : 'failed';
    const mainTransaction = await xanoClient.createTransaction({
      type: 'subscription',
      amount: transactionAmount,
      fee: shouldSucceed ? fee : 0,
      net_amount: shouldSucceed ? transactionAmount - fee : 0,
      status: mainStatus,
      payment_method: paymentMethod,
      agency: agency.id,
      wallet_address: agencyData.wallet_address,
      metadata: {
        billing_period: 'monthly',
        creators_count: agencyData.creators_count,
        month: month,
        attempt: 1,
        failure_reason: !shouldSucceed ? getRandomFailureReason(paymentMethod) : undefined
      },
      idempotency_key: `seed-subscription-${agencyData.slug}-${month}-${Date.now()}-${Math.random()}`,
    });

    if (mainTransaction.data) {
      createdTransactions.push(mainTransaction.data);
    }

    // If payment failed, create retry attempts (some succeed, some don't)
    if (!shouldSucceed && Math.random() < 0.7) {
      const retryAttempts = Math.floor(Math.random() * 3) + 1;
      
      for (let retry = 1; retry <= retryAttempts; retry++) {
        const retryDate = new Date(baseDate);
        retryDate.setDate(retryDate.getDate() + retry * 2); // 2, 4, 6 days later
        
        // Later retries have better success chance
        const retrySuccessChance = pattern.reliability + (retry * 0.1);
        const retrySucceeds = Math.random() < retrySuccessChance;
        
        const retryTransaction = await xanoClient.createTransaction({
          type: 'subscription',
          amount: transactionAmount,
          fee: retrySucceeds ? fee : 0,
          net_amount: retrySucceeds ? transactionAmount - fee : 0,
          status: retrySucceeds ? 'completed' : 'failed',
          payment_method: paymentMethod,
          agency: agency.id,
          wallet_address: agencyData.wallet_address,
          metadata: {
            billing_period: 'monthly',
            creators_count: agencyData.creators_count,
            month: month,
            attempt: retry + 1,
            is_retry: true,
            original_failure: true,
            failure_reason: !retrySucceeds ? getRandomFailureReason(paymentMethod) : undefined
          },
          idempotency_key: `seed-retry-${agencyData.slug}-${month}-${retry}-${Date.now()}-${Math.random()}`,
        });

        if (retryTransaction.data) {
          createdTransactions.push(retryTransaction.data);
        }

        // If retry succeeded, stop trying
        if (retrySucceeds) break;
      }
    }

    // Add some random extra transactions for active agencies (partial payments, adjustments, etc.)
    if (agencyData.subscription_status === 'active' && Math.random() < 0.3) {
      const extraTypes = ['partial_payment', 'adjustment', 'late_fee'];
      const extraType = extraTypes[Math.floor(Math.random() * extraTypes.length)];
      
      let extraAmount = 0;
      if (extraType === 'partial_payment') extraAmount = transactionAmount * 0.5;
      else if (extraType === 'adjustment') extraAmount = Math.floor(Math.random() * 50) + 10;
      else if (extraType === 'late_fee') extraAmount = 25;

      const extraDate = new Date(baseDate);
      extraDate.setDate(extraDate.getDate() + Math.floor(Math.random() * 10));

      const extraTransaction = await xanoClient.createTransaction({
        type: 'subscription',
        amount: extraAmount,
        fee: extraAmount * 0.025,
        net_amount: extraAmount * 0.975,
        status: 'completed',
        payment_method: paymentMethod,
        agency: agency.id,
        wallet_address: agencyData.wallet_address,
        metadata: {
          transaction_type: extraType,
          billing_period: 'monthly',
          creators_count: agencyData.creators_count,
          month: month,
          is_extra: true
        },
        idempotency_key: `seed-extra-${agencyData.slug}-${month}-${extraType}-${Date.now()}-${Math.random()}`,
      });

      if (extraTransaction.data) {
        createdTransactions.push(extraTransaction.data);
      }
    }
  }
}

function getRandomFailureReason(paymentMethod: string) {
  const cryptoReasons = [
    'Insufficient wallet balance',
    'Network congestion',
    'Transaction timeout',
    'Gas fee too low',
    'Wallet connection failed'
  ];
  
  const cardReasons = [
    'Insufficient funds',
    'Card expired',
    'Card declined',
    'Invalid CVV',
    'Bank authorization failed',
    'Fraud prevention triggered'
  ];
  
  const reasons = paymentMethod === 'crypto' ? cryptoReasons : cardReasons;
  return reasons[Math.floor(Math.random() * reasons.length)];
}

export async function POST(request: NextRequest) {
  try {
    // Check if already seeded
    if (hasSeeded) {
      return NextResponse.json(
        { message: 'Database has already been seeded. Reset the server to seed again.' },
        { status: 400 }
      );
    }

    // Check if agencies already exist
    const existingAgencies = await xanoClient.getAgencies();
    if (existingAgencies.data && existingAgencies.data.length > 0) {
      hasSeeded = true;
      return NextResponse.json(
        { message: 'Agencies already exist in database. Skipping seed.' },
        { status: 400 }
      );
    }

    const createdAgencies = [];
    const createdTransactions = [];

    // Create agencies with enhanced data
    for (const agencyData of testAgencies) {
      // Calculate realistic metrics
      const monthsActive = Math.floor(Math.random() * 24) + 1;
      const monthlyRevenue = agencyData.creators_count * 40;
      const lifetimeValue = monthlyRevenue * monthsActive;
      
      // Calculate health score based on status
      let healthScore = 85 + Math.floor(Math.random() * 15); // 85-100 for active
      if (agencyData.subscription_status === 'inactive') {
        healthScore = 40 + Math.floor(Math.random() * 20); // 40-60 for inactive
      } else if (agencyData.subscription_status === 'suspended') {
        healthScore = 10 + Math.floor(Math.random() * 20); // 10-30 for suspended
      }
      
      // Determine onboarding status
      const onboardingStatus = 
        agencyData.subscription_status === 'active' ? 'completed' :
        agencyData.subscription_status === 'inactive' ? 'in_progress' : 'pending';
      
      const result = await xanoClient.createAgency({
        ...agencyData,
        monthly_revenue: monthlyRevenue,
        lifetime_value: lifetimeValue,
        health_score: healthScore,
        onboarding_status: onboardingStatus,
        referral_code: `REF-${agencyData.slug.toUpperCase()}`,
        referral_commission_rate: 10,
        settings: {},
      });

      if (result.data) {
        createdAgencies.push(result.data);

        // Create comprehensive transaction history for ALL agencies
        await createRealisticTransactionHistory(result.data, agencyData, createdTransactions);
      }
    }

    // Mark as seeded
    hasSeeded = true;

    return NextResponse.json({
      message: 'Seed data created successfully',
      stats: {
        agencies_created: createdAgencies.length,
        transactions_created: createdTransactions.length,
      },
      agencies: createdAgencies.map(a => ({
        name: a.name,
        creators_count: a.creators_count,
        subscription_status: a.subscription_status,
      })),
    });
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Reset endpoint for development
export async function DELETE(request: NextRequest) {
  hasSeeded = false;
  return NextResponse.json({ message: 'Seed flag reset. You can now seed again.' });
}