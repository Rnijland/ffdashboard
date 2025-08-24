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

// Enhanced transaction creation with realistic patterns matching real data structure
async function createRealisticTransactionHistory(agency: any, agencyData: any, creatorIds: number[]) {
  const now = Date.now();
  const localTransactions = [];
  
  // Transaction types based on real examples
  const transactionTypes = ['subscription', 'chat', 'media', 'poke', 'gems'] as const;
  
  // Create 3-6 months of varied transaction history
  const monthsOfHistory = Math.floor(Math.random() * 4) + 3;
  console.log(`Creating ${monthsOfHistory} months of history for ${agencyData.name}`);
  
  for (let month = 0; month < monthsOfHistory; month++) {
    const monthTimestamp = now - (month * 30 * 24 * 60 * 60 * 1000); // Go back in time
    
    // Create subscription payment for this month
    const subscriptionAmount = agencyData.creators_count * 0.004; // 0.004 per creator like in example
    const subscriptionFee = subscriptionAmount * 0.025;
    
    try {
      // Generate manual transaction ID like in the examples
      const txId = `manual_${monthTimestamp}_${Math.random().toString(36).substring(2, 8)}`;
      
      const subscriptionTx = await xanoClient.createTransaction({
        thirdweb_transaction_id: txId,
        type: 'subscription',
        amount: subscriptionAmount,
        fee: subscriptionFee,
        net_amount: subscriptionAmount - subscriptionFee,
        status: 'completed',
        payment_method: 'crypto',
        agency: agency.id,
        creator: undefined, // Subscription has no specific creator - use undefined not 0
        wallet_address: agencyData.wallet_address,
        metadata: {
          type: 'subscription'
        },
        idempotency_key: `payment_subscription_${agencyData.wallet_address}_${subscriptionAmount}_${monthTimestamp}`,
      });

      if (subscriptionTx.data) {
        localTransactions.push(subscriptionTx.data);
        console.log(`✓ Created subscription transaction for ${agencyData.name} (month ${month + 1}, ID: ${subscriptionTx.data.id}, TX: ${txId})`);
      } else {
        console.error(`✗ Failed to create subscription for ${agencyData.name}:`, subscriptionTx.error);
      }
    } catch (error) {
      console.error(`Error creating subscription for ${agencyData.name}:`, error);
    }
    
    // Create various creator transactions for this month
    const numCreatorTransactions = Math.floor(Math.random() * 15) + 5; // 5-20 transactions per month
    
    for (let i = 0; i < numCreatorTransactions; i++) {
      const dayOffset = Math.floor(Math.random() * 30);
      const txTimestamp = monthTimestamp + (dayOffset * 24 * 60 * 60 * 1000);
      const txId = `manual_${txTimestamp}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Pick a random creator (or use 1 if no creators)
      const creatorId = creatorIds.length > 0 ? 
        creatorIds[Math.floor(Math.random() * creatorIds.length)] : 1;
      
      // Pick a random transaction type (excluding subscription)
      const txType = ['chat', 'media', 'poke'][Math.floor(Math.random() * 3)];
      
      // Amount is always 0.001 for creator transactions in the examples
      const amount = 0.001;
      const fee = 0.000025;
      
      let metadata: any = {};
      let idempotencyPrefix = 'payment_';
      
      // Set metadata based on type
      switch (txType) {
        case 'chat':
          metadata = { message_count: 1 };
          idempotencyPrefix = 'payment_gems_';
          break;
        case 'media':
          metadata = { type: 'media' };
          idempotencyPrefix = 'payment_media_';
          break;
        case 'poke':
          const pokeMessages = [
            "Poke you in your brown eye <3",
            "Hey there cutie!",
            "Thinking of you",
            "*poke poke*",
            "Miss you!"
          ];
          metadata = { 
            type: 'poke',
            message: pokeMessages[Math.floor(Math.random() * pokeMessages.length)],
            message_count: 1
          };
          idempotencyPrefix = 'payment_poke_';
          break;
      }
      
      try {
        const creatorTx = await xanoClient.createTransaction({
          thirdweb_transaction_id: txId,
          type: txType as any, // Cast to any since our types might not include all
          amount: amount,
          fee: fee,
          net_amount: amount - fee,
          status: 'completed',
          payment_method: 'crypto',
          agency: agency.id,
          creator: creatorId,
          wallet_address: agencyData.wallet_address,
          metadata: metadata,
          idempotency_key: `${idempotencyPrefix}${agencyData.wallet_address}_${amount}_${txTimestamp}`,
        });

        if (creatorTx.data) {
          localTransactions.push(creatorTx.data);
          console.log(`  ✓ ${txType} transaction (creator ${creatorId}, TX: ${txId})`);
        } else {
          console.error(`  ✗ Failed ${txType} transaction:`, creatorTx.error);
        }
      } catch (error) {
        console.error(`Error creating ${txType} transaction:`, error);
      }
    }
  }
  
  console.log(`✅ Created ${localTransactions.length} total transactions for ${agencyData.name}`);
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
    console.log('=== Starting seed process ===');
    
    // Check if already seeded
    if (hasSeeded) {
      console.log('Seed flag is set, aborting');
      return NextResponse.json(
        { message: 'Database has already been seeded. Reset the server to seed again.' },
        { status: 400 }
      );
    }

    // Check if agencies already exist
    console.log('Checking for existing agencies...');
    const existingAgencies = await xanoClient.getAgencies();
    if (existingAgencies.data && existingAgencies.data.length > 0) {
      console.log(`Found ${existingAgencies.data.length} existing agencies, aborting seed`);
      hasSeeded = true;
      return NextResponse.json(
        { message: 'Agencies already exist in database. Skipping seed.' },
        { status: 400 }
      );
    }

    const createdAgencies = [];
    const createdCreators = [];
    const createdTransactions = [];

    console.log(`Will create ${testAgencies.length} agencies`);

    // Create agencies and creators
    for (const agencyData of testAgencies) {
      console.log(`\n--- Creating agency: ${agencyData.name} ---`);
      
      const result = await xanoClient.createAgency({
        ...agencyData,
      });

      if (result.data) {
        console.log(`✓ Created agency: ${agencyData.name} (ID: ${result.data.id})`);
        createdAgencies.push(result.data);

        // Create some creators for this agency (1-3 per agency)
        const numCreators = Math.min(agencyData.creators_count, 3);
        const agencyCreatorIds = [];
        
        for (let i = 0; i < numCreators; i++) {
          const creatorName = `Creator ${i + 1}`;
          const creatorResult = await xanoClient.createCreator({
            agency: result.data.id,
            name: `${agencyData.name} - ${creatorName}`,
            username: `${agencyData.slug}_creator_${i + 1}`,
            status: 'active',
            commission_rate: 20,
          });
          
          if (creatorResult.data) {
            console.log(`  ✓ Created creator: ${creatorName} (ID: ${creatorResult.data.id})`);
            createdCreators.push(creatorResult.data);
            agencyCreatorIds.push(creatorResult.data.id);
          } else {
            console.log(`  ✗ Failed to create creator: ${creatorName}`, creatorResult.error);
          }
        }

        // Create comprehensive transaction history for ALL agencies
        console.log(`\nCreating transaction history for ${agencyData.name}...`);
        const transactions = await createRealisticTransactionHistory(result.data, agencyData, agencyCreatorIds);
        createdTransactions.push(...transactions);
        console.log(`Summary: Created ${transactions.length} transactions for ${agencyData.name}, total now: ${createdTransactions.length}`);
      } else {
        console.log(`✗ Failed to create agency: ${agencyData.name}`, result.error);
      }
    }

    // Mark as seeded
    hasSeeded = true;

    console.log('\n=== Seed Summary ===');
    console.log(`Agencies created: ${createdAgencies.length}`);
    console.log(`Creators created: ${createdCreators.length}`);
    console.log(`Transactions created: ${createdTransactions.length}`);
    console.log('===================\n');

    return NextResponse.json({
      message: 'Seed data created successfully',
      stats: {
        agencies_created: createdAgencies.length,
        creators_created: createdCreators.length,
        transactions_created: createdTransactions.length,
      },
      agencies: createdAgencies.map(a => ({
        id: a.id,
        name: a.name,
        creators_count: a.creators_count,
        subscription_status: a.subscription_status,
      })),
      sample_transactions: createdTransactions.slice(0, 5).map(t => ({
        id: t.id,
        thirdweb_transaction_id: t.thirdweb_transaction_id,
        type: t.type,
        amount: t.amount,
        agency: t.agency,
        creator: t.creator,
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