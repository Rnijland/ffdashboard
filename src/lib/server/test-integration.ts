/**
 * Simple Xano Integration Test
 * Run this to verify database connection and basic operations
 */

import { xanoClient } from './xano-client';

export async function testXanoIntegration() {
  console.log('🔍 Testing Xano Integration...');
  
  try {
    // Test 1: Get agencies (should return empty array or existing data)
    console.log('1. Testing getAgencies...');
    const agenciesResult = await xanoClient.getAgencies();
    
    if (agenciesResult.error) {
      console.error('❌ Get agencies failed:', agenciesResult.error);

      return false;
    }
    
    console.log('✅ Get agencies successful:', Array.isArray(agenciesResult.data));
    
    // Test 2: Create test agency
    console.log('2. Testing createAgency...');
    const testAgency = {
      name: 'Test Agency',
      slug: `test-agency-${Date.now()}`,
      subscription_status: 'active' as const,
    };
    
    const createResult = await xanoClient.createAgency(testAgency);
    
    if (createResult.error) {
      console.error('❌ Create agency failed:', createResult.error);

      return false;
    }
    
    console.log('✅ Create agency successful:', createResult.data?.id);
    const testAgencyId = createResult.data!.id;
    
    // Test 3: Get agency by ID
    console.log('3. Testing getAgency by ID...');
    const getResult = await xanoClient.getAgency(testAgencyId);
    
    if (getResult.error) {
      console.error('❌ Get agency by ID failed:', getResult.error);

      return false;
    }
    
    console.log('✅ Get agency by ID successful:', getResult.data?.name === testAgency.name);
    
    // Test 4: Create test transaction
    console.log('4. Testing createTransaction...');
    const testTransaction = {
      type: 'subscription' as const,
      amount: 120.50,
      fee: 5.25,
      agency: testAgencyId,
      idempotency_key: `test-${Date.now()}`,
      metadata: {
        billing_period: 'monthly' as const,
        creators_count: 3,
      },
    };
    
    const transactionResult = await xanoClient.createTransaction(testTransaction);
    
    if (transactionResult.error) {
      console.error('❌ Create transaction failed:', transactionResult.error);

      return false;
    }
    
    console.log('✅ Create transaction successful:', transactionResult.data?.net_amount === 115.25);
    const testTransactionId = transactionResult.data!.id;
    
    // Test 5: Financial precision validation
    console.log('5. Testing financial precision...');
    const expectedNetAmount = testTransaction.amount - testTransaction.fee;
    const actualNetAmount = transactionResult.data!.net_amount;
    
    if (Math.abs(actualNetAmount - expectedNetAmount) > 0.001) {
      console.error('❌ Financial precision failed: expected', expectedNetAmount, 'got', actualNetAmount);

      return false;
    }
    
    console.log('✅ Financial precision verified');
    
    // Cleanup: Delete test data
    console.log('6. Cleaning up test data...');
    await xanoClient.deleteTransaction(testTransactionId);
    await xanoClient.deleteAgency(testAgencyId);
    
    console.log('🎉 All tests passed! Xano integration working correctly.');

    return true;
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error);

    return false;
  }
}

// Only run if called directly
if (require.main === module) {
  testXanoIntegration()
    .then((success) => {
      return process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test runner error:', error);

      return process.exit(1);
    });
}