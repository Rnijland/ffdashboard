/**
 * Fiat-to-Crypto Payment Flow
 * Two-step process: Onramp + Transfer
 */

import { writeContract, readContract, waitForTransactionReceipt, getBalance } from '@wagmi/core';
import { parseUnits, formatUnits } from 'viem';
import { wagmiAdapter } from '@/config';

// USDC contract addresses
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet
const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia

// Merchant wallet
const MERCHANT_WALLET = process.env.NEXT_PUBLIC_MERCHANT_WALLET as `0x${string}`;

// ERC20 ABI for USDC
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  }
] as const;

// Get USDC address based on environment
function getUSDCAddress(): `0x${string}` {
  const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_TESTNET === 'true';
  return (IS_TESTNET ? USDC_BASE_SEPOLIA : USDC_BASE) as `0x${string}`;
}

// Payment flow state management
export interface PaymentFlowState {
  step: 'idle' | 'onramp' | 'waiting_for_funds' | 'transferring' | 'completed' | 'error';
  requiredAmount: number;
  userAddress?: `0x${string}`;
  initialBalance?: bigint;
  currentBalance?: bigint;
  transactionHash?: string;
  error?: string;
}

// Check user's USDC balance
export async function checkUSDCBalance(userAddress: `0x${string}`): Promise<bigint> {
  try {
    const balance = await readContract(wagmiAdapter.wagmiConfig, {
      address: getUSDCAddress(),
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress]
    });
    return balance;
  } catch (error) {
    console.error('Failed to check USDC balance:', error);
    return BigInt(0);
  }
}

// Monitor balance changes after onramp
export async function waitForBalanceIncrease(
  userAddress: `0x${string}`,
  initialBalance: bigint,
  requiredAmount: number,
  maxAttempts: number = 60, // 5 minutes with 5 second intervals
  intervalMs: number = 5000
): Promise<boolean> {
  const requiredAmountBigInt = parseUnits(String(requiredAmount), 6); // USDC has 6 decimals
  
  for (let i = 0; i < maxAttempts; i++) {
    const currentBalance = await checkUSDCBalance(userAddress);
    const balanceIncrease = currentBalance - initialBalance;
    
    console.log(`Checking balance (attempt ${i + 1}/${maxAttempts}):`, {
      initial: formatUnits(initialBalance, 6),
      current: formatUnits(currentBalance, 6),
      increase: formatUnits(balanceIncrease, 6),
      required: requiredAmount
    });
    
    // Check if user has received enough USDC
    if (balanceIncrease >= requiredAmountBigInt) {
      return true;
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  return false;
}

// Transfer USDC to merchant
export async function transferToMerchant(
  amount: number,
  metadata?: any
): Promise<{ transactionHash: string; success: boolean }> {
  try {
    const amountBigInt = parseUnits(String(amount), 6); // USDC has 6 decimals
    
    console.log('Initiating transfer to merchant:', {
      merchant: MERCHANT_WALLET,
      amount: amount,
      amountBigInt: amountBigInt.toString()
    });
    
    // Execute transfer
    const hash = await writeContract(wagmiAdapter.wagmiConfig, {
      address: getUSDCAddress(),
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [MERCHANT_WALLET, amountBigInt]
    });
    
    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
      hash
    });
    
    console.log('Transfer completed:', {
      hash,
      status: receipt.status,
      merchant: MERCHANT_WALLET
    });
    
    // Update database if needed
    if (metadata) {
      await updatePaymentDatabase({
        transactionHash: hash,
        amount,
        from: receipt.from,
        to: MERCHANT_WALLET,
        ...metadata
      });
    }
    
    return {
      transactionHash: hash,
      success: receipt.status === 'success'
    };
  } catch (error) {
    console.error('Transfer to merchant failed:', error);
    throw error;
  }
}

// Update payment database
async function updatePaymentDatabase(paymentData: any) {
  try {
    const response = await fetch('/api/update-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      console.error('Failed to update database:', await response.text());
    }
  } catch (error) {
    console.error('Database update error:', error);
  }
}

// Complete two-step payment flow
export class FiatPaymentFlow {
  private state: PaymentFlowState;
  private onStateChange?: (state: PaymentFlowState) => void;
  
  constructor(
    requiredAmount: number,
    userAddress: `0x${string}`,
    onStateChange?: (state: PaymentFlowState) => void
  ) {
    this.state = {
      step: 'idle',
      requiredAmount,
      userAddress
    };
    this.onStateChange = onStateChange;
  }
  
  private updateState(updates: Partial<PaymentFlowState>) {
    this.state = { ...this.state, ...updates };
    this.onStateChange?.(this.state);
  }
  
  // Step 1: Record initial balance before onramp
  async recordInitialBalance() {
    if (!this.state.userAddress) throw new Error('User address not set');
    
    this.updateState({ step: 'onramp' });
    const balance = await checkUSDCBalance(this.state.userAddress);
    this.updateState({ initialBalance: balance });
    
    console.log('Initial USDC balance:', formatUnits(balance, 6));
    return balance;
  }
  
  // Step 2: Wait for onramp completion
  async waitForOnramp() {
    if (!this.state.userAddress || this.state.initialBalance === undefined) {
      throw new Error('Initial state not set');
    }
    
    this.updateState({ step: 'waiting_for_funds' });
    
    const success = await waitForBalanceIncrease(
      this.state.userAddress,
      this.state.initialBalance,
      this.state.requiredAmount
    );
    
    if (!success) {
      this.updateState({ 
        step: 'error',
        error: 'Timeout waiting for funds. Please try again.'
      });
      return false;
    }
    
    const currentBalance = await checkUSDCBalance(this.state.userAddress);
    this.updateState({ currentBalance });
    
    return true;
  }
  
  // Step 3: Transfer to merchant
  async transferToMerchant(metadata?: any) {
    this.updateState({ step: 'transferring' });
    
    try {
      const result = await transferToMerchant(
        this.state.requiredAmount,
        metadata
      );
      
      if (result.success) {
        this.updateState({
          step: 'completed',
          transactionHash: result.transactionHash
        });
        return result;
      } else {
        throw new Error('Transfer failed');
      }
    } catch (error: any) {
      this.updateState({
        step: 'error',
        error: error.message || 'Transfer failed'
      });
      throw error;
    }
  }
  
  getState() {
    return this.state;
  }
}