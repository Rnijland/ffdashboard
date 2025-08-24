/**
 * Fallback payment using standard wallet connection
 * Used when AppKit Pay encounters issues with exchanges
 */

import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { parseUnits } from 'viem';
import { wagmiAdapter } from '@/config';
import { MERCHANT_WALLET, getActivePaymentAsset } from './appkit-pay';

// ERC20 ABI for USDC transfers
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
  }
] as const;

export async function processFallbackPayment(
  amount: number,
  metadata: any,
  preferUSDC: boolean = true
) {
  try {
    const paymentAsset = getActivePaymentAsset(preferUSDC);
    
    if (paymentAsset.asset === 'native') {
      // ETH payment
      return await processETHPayment(amount);
    } else {
      // USDC payment
      return await processUSDCPayment(amount, paymentAsset.asset as `0x${string}`);
    }
  } catch (error) {
    console.error('Fallback payment failed:', error);
    throw error;
  }
}

async function processETHPayment(amount: number) {
  try {
    const { sendTransaction } = await import('@wagmi/core');
    
    // Convert USD amount to ETH (simplified - in production use price oracle)
    const ethAmount = parseUnits(String(amount / 3000), 18); // Assuming 1 ETH = $3000
    
    const hash = await sendTransaction(wagmiAdapter.wagmiConfig, {
      to: MERCHANT_WALLET,
      value: ethAmount
    });
    
    const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
      hash
    });
    
    return {
      transactionHash: receipt.transactionHash,
      amount,
      from: receipt.from,
      to: MERCHANT_WALLET,
      status: receipt.status
    };
  } catch (error) {
    console.error('ETH payment failed:', error);
    throw error;
  }
}

async function processUSDCPayment(amount: number, usdcAddress: `0x${string}`) {
  try {
    // Convert USD to USDC units (6 decimals)
    const usdcAmount = parseUnits(String(amount), 6);
    
    const hash = await writeContract(wagmiAdapter.wagmiConfig, {
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [MERCHANT_WALLET, usdcAmount]
    });
    
    const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
      hash
    });
    
    return {
      transactionHash: receipt.transactionHash,
      amount,
      from: receipt.from,
      to: MERCHANT_WALLET,
      status: receipt.status,
      token: 'USDC'
    };
  } catch (error) {
    console.error('USDC payment failed:', error);
    throw error;
  }
}

// Check if user has sufficient balance
export async function checkBalance(
  walletAddress: `0x${string}`,
  amount: number,
  preferUSDC: boolean = true
) {
  try {
    const { readContract } = await import('@wagmi/core');
    const paymentAsset = getActivePaymentAsset(preferUSDC);
    
    if (paymentAsset.asset === 'native') {
      // Check ETH balance
      const { getBalance } = await import('@wagmi/core');
      const balance = await getBalance(wagmiAdapter.wagmiConfig, {
        address: walletAddress
      });
      
      const requiredAmount = parseUnits(String(amount / 3000), 18);
      return balance.value >= requiredAmount;
    } else {
      // Check USDC balance
      const balance = await readContract(wagmiAdapter.wagmiConfig, {
        address: paymentAsset.asset as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });
      
      const requiredAmount = parseUnits(String(amount), 6);
      return balance >= requiredAmount;
    }
  } catch (error) {
    console.error('Failed to check balance:', error);
    return false;
  }
}