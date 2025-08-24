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

    // Create agencies
    for (const agencyData of testAgencies) {
      const result = await xanoClient.createAgency({
        ...agencyData,
        monthly_revenue: 0,
        lifetime_value: 0,
        referral_code: `REF-${agencyData.slug.toUpperCase()}`,
        referral_commission_rate: 10,
        settings: {},
      });

      if (result.data) {
        createdAgencies.push(result.data);

        // Create subscription transactions for active agencies
        if (agencyData.subscription_status === 'active') {
          // Create a recent successful payment (within last 30 days)
          const daysAgo = Math.floor(Math.random() * 25) + 5; // 5-30 days ago
          const paymentDate = new Date();
          paymentDate.setDate(paymentDate.getDate() - daysAgo);

          const transactionAmount = agencyData.creators_count * 40;
          const fee = transactionAmount * 0.025; // 2.5% fee

          const transactionResult = await xanoClient.createTransaction({
            type: 'subscription',
            amount: transactionAmount,
            fee: fee,
            status: 'completed',
            payment_method: 'crypto',
            agency: result.data.id,
            wallet_address: agencyData.wallet_address,
            metadata: {
              billing_period: 'monthly',
              creators_count: agencyData.creators_count,
            },
            idempotency_key: `seed-subscription-${agencyData.slug}-${Date.now()}`,
          });

          if (transactionResult.data) {
            createdTransactions.push(transactionResult.data);
          }
        } else if (agencyData.subscription_status === 'inactive') {
          // Create an older payment (40-50 days ago) to simulate overdue
          const daysAgo = Math.floor(Math.random() * 10) + 40; // 40-50 days ago
          const paymentDate = new Date();
          paymentDate.setDate(paymentDate.getDate() - daysAgo);

          const transactionAmount = agencyData.creators_count * 40;
          const fee = transactionAmount * 0.025;

          const transactionResult = await xanoClient.createTransaction({
            type: 'subscription',
            amount: transactionAmount,
            fee: fee,
            status: 'completed',
            payment_method: 'card',
            agency: result.data.id,
            wallet_address: agencyData.wallet_address,
            metadata: {
              billing_period: 'monthly',
              creators_count: agencyData.creators_count,
            },
            idempotency_key: `seed-subscription-${agencyData.slug}-${Date.now()}`,
          });

          if (transactionResult.data) {
            createdTransactions.push(transactionResult.data);
          }
        }
        // For suspended agencies, we don't create any recent transactions
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