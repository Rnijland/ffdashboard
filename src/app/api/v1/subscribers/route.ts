import { NextRequest, NextResponse } from 'next/server';
import { xanoClient } from '@/lib/server/xano-client';

interface SubscriberWithStatus {
  id: number;
  name: string;
  slug: string;
  wallet_address: string;
  creators_count: number;
  monthly_fee: number;
  payment_status: 'active' | 'overdue' | 'suspended';
  last_payment_date?: string;
  subscription_status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get('search') || '';

    // Fetch all agencies from Xano
    const agenciesResult = await xanoClient.getAgencies();
    if (agenciesResult.error || !agenciesResult.data) {
      console.error('Failed to fetch agencies:', agenciesResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch agencies' },
        { status: 500 }
      );
    }

    // Fetch all subscription transactions to determine payment status
    const transactionsResult = await xanoClient.getTransactions();
    if (transactionsResult.error || !transactionsResult.data) {
      console.error('Failed to fetch transactions:', transactionsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    let agencies = agenciesResult.data || [];
    const transactions = transactionsResult.data || [];

    // Filter agencies by search term if provided
    if (search) {
      agencies = agencies.filter(agency =>
        agency.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Process agencies to add payment status and calculate fees
    const subscribers: SubscriberWithStatus[] = agencies.map(agency => {
      // Calculate monthly fee based on creator count
      const monthlyFee = (agency.creators_count || 0) * 40;

      // Find the most recent subscription transaction for this agency
      const agencyTransactions = transactions
        .filter(t => t.type === 'subscription' && t.agency === agency.id)
        .sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

      const lastTransaction = agencyTransactions[0];
      let paymentStatus: 'active' | 'overdue' | 'suspended' = 'suspended';
      let lastPaymentDate: string | undefined;

      if (lastTransaction) {
        lastPaymentDate = lastTransaction.created_at;
        const daysSincePayment = Math.floor(
          (Date.now() - new Date(lastTransaction.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (lastTransaction.status === 'completed') {
          if (daysSincePayment <= 35) {
            paymentStatus = 'active';
          } else if (daysSincePayment <= 45) {
            paymentStatus = 'overdue';
          } else {
            paymentStatus = 'suspended';
          }
        }
      }

      // Override with agency subscription_status if suspended
      if (agency.subscription_status === 'suspended') {
        paymentStatus = 'suspended';
      }

      return {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        wallet_address: agency.wallet_address || '',
        creators_count: agency.creators_count || 0,
        subscription_status: agency.subscription_status || 'inactive',
        created_at: String(agency.created_at),
        updated_at: agency.updated_at,
        // Calculate monthly fee in ETH (0.004 per creator based on real data)
        monthly_fee: (agency.creators_count || 0) * 0.004,
        // Enhanced fields from database
        onboarding_status: agency.onboarding_status || '',
        monthly_revenue: agency.monthly_revenue || monthlyFee,
        lifetime_value: agency.lifetime_value || 0,
        referral_code: agency.referral_code || null,
        // Calculated fields
        payment_status: paymentStatus,
        last_payment_date: lastPaymentDate,
        failed_payments_count: transactions.filter((t: any) => 
          t.agency === agency.id && t.status === 'failed'
        ).length,
        success_rate: transactions.filter((t: any) => t.agency === agency.id).length > 0
          ? (transactions.filter((t: any) => 
              t.agency === agency.id && t.status === 'completed'
            ).length / transactions.filter((t: any) => t.agency === agency.id).length) * 100
          : 100
      };
    });

    // Calculate total MRR from active subscribers
    const totalMRR = subscribers
      .filter(s => s.payment_status === 'active')
      .reduce((sum, s) => sum + s.monthly_fee, 0);

    return NextResponse.json({
      subscribers,
      total: subscribers.length,
      totalMRR,
    });
  } catch (error) {
    console.error('Subscribers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cache control headers for performance
export const revalidate = 30; // Revalidate every 30 seconds