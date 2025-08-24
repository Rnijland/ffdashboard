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
async function createRealisticTransactionHistory(agency: any, agencyData: any) {
  const now = new Date();
  const localTransactions = [];
  
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

  const pattern = patterns[agencyData.slug as keyof typeof patterns] || { reliability: 0.85, preferredMethod: 'crypto', avgDays: 30 };
  
  // Create 3-6 months of history (reduced for reliability)
  const monthsOfHistory = Math.floor(Math.random() * 4) + 3;
  console.log(`Creating ${monthsOfHistory} months of history for ${agencyData.name}`);
  
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
    try {
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
          attempt: 1,
          failure_reason: !shouldSucceed ? getRandomFailureReason(paymentMethod) : undefined
        },
        idempotency_key: `seed-subscription-${agencyData.slug}-${month}-${Date.now()}-${Math.random()}`,
      });

      if (mainTransaction.data) {
        localTransactions.push(mainTransaction.data);
        console.log(`✓ Created transaction ${localTransactions.length} for ${agencyData.name} (month ${month})`);
      } else {
        console.error(`Failed to create transaction for ${agencyData.name}:`, mainTransaction.error);
      }
    } catch (error) {
      console.error(`Error creating transaction for ${agencyData.name}:`, error);
    }

    // Add a simple retry if failed (only one retry to keep it simple)
    if (!shouldSucceed && Math.random() < 0.5) {
      try {
        const retryDate = new Date(baseDate);
        retryDate.setDate(retryDate.getDate() + 3); // 3 days later
        
        const retryTransaction = await xanoClient.createTransaction({
          type: 'subscription',
          amount: transactionAmount,
          fee: fee,
          net_amount: transactionAmount - fee,
          status: 'completed', // Retry usually succeeds
          payment_method: paymentMethod,
          agency: agency.id,
          wallet_address: agencyData.wallet_address,
          metadata: {
            billing_period: 'monthly',
            creators_count: agencyData.creators_count,
            attempt: 2,
            is_retry: true
          },
          idempotency_key: `seed-retry-${agencyData.slug}-${month}-${Date.now()}-${Math.random()}`,
        });

        if (retryTransaction.data) {
          localTransactions.push(retryTransaction.data);
          console.log(`✓ Created retry transaction for ${agencyData.name}`);
        }
      } catch (error) {
        console.error(`Error creating retry for ${agencyData.name}:`, error);
      }
    }
  }
  
  return localTransactions;
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
        // These fields might not exist in database yet, commenting for now
        // monthly_revenue: monthlyRevenue,
        // lifetime_value: lifetimeValue,
        // health_score: healthScore,
        // onboarding_status: onboardingStatus,
        // referral_code: `REF-${agencyData.slug.toUpperCase()}`,
        // referral_commission_rate: 10,
        // settings: {},
      });

      if (result.data) {
        createdAgencies.push(result.data);

        // Create comprehensive transaction history for ALL agencies
        console.log(`Creating transaction history for ${agencyData.name}...`);
        const transactions = await createRealisticTransactionHistory(result.data, agencyData);
        createdTransactions.push(...transactions);
        console.log(`Created ${transactions.length} transactions for ${agencyData.name}, total now: ${createdTransactions.length}`);
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