/**
 * Database type definitions for FanFlow Payment Gateway
 * Maps to Xano database tables with TypeScript interfaces
 */

// Enum types for status fields
export type SubscriptionStatus = 'active' | 'inactive' | 'suspended';
export type CreatorStatus = 'active' | 'inactive' | 'pending';
export type TransactionType = 'chat' | 'script' | 'media' | 'subscription';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

// Transaction metadata interfaces for different types
export interface TransactionMetadata {
  // For chat payments
  message_count?: number;
  chat_duration?: number;
  
  // For script purchases
  script_id?: string;
  license_type?: 'single' | 'unlimited';
  
  // For media unlocks
  media_id?: string;
  access_type?: 'permanent' | 'timed';
  access_duration_days?: number;
  
  // For subscription payments
  billing_period?: 'monthly';
  creators_count?: number;
}

// Agency interface matching ff_agency table
export interface Agency {
  id: number;
  name: string;
  slug: string;
  wallet_address?: string;
  subscription_status: SubscriptionStatus;
  creators_count: number;
  monthly_revenue: number;
  lifetime_value: number;
  referral_code?: string;
  created_at: number; // Xano epochms
  updated_at: number; // Xano epochms
}

// Creator interface matching ff_creator table  
export interface Creator {
  id: number;
  agency: number; // Foreign key to ff_agency
  name: string;
  username: string;
  status: CreatorStatus;
  monthly_revenue: number;
  lifetime_revenue: number;
  subscriber_count: number;
  commission_rate: number;
  created_at: number; // Xano epochms
  updated_at: number; // Xano epochms
}

// Transaction interface matching ff_transaction table
export interface Transaction {
  id: number;
  thirdweb_transaction_id?: string;
  type: TransactionType;
  amount: number;
  fee: number;
  net_amount: number;
  status: TransactionStatus;
  payment_method?: string;
  agency: number; // Foreign key to ff_agency
  creator?: number; // Foreign key to ff_creator
  subscriber_email?: string;
  metadata: TransactionMetadata;
  idempotency_key: string;
  created_at: number; // Xano epochms
  updated_at: number; // Xano epochms
}

// WebhookEvent interface matching ff_webhook_event table
export interface WebhookEvent {
  id: number;
  event_type?: string;
  transaction?: number; // Foreign key to ff_transaction
  payload: any; // Raw webhook payload
  signature?: string;
  processed: boolean;
  error?: string;
  created_at: number; // Xano epochms
}

// SimulationRun interface matching ff_simulation_run table
export interface SimulationRun {
  id: number;
  scenario_type: string;
  parameters: {
    transaction_types?: TransactionType[];
    amount_range?: { min: number; max: number };
    failure_rate?: number;
    batch_size?: number;
  };
  transactions_count: number;
  success_count: number;
  failure_count: number;
  total_amount: number;
  results?: {
    transactions?: Array<Partial<Transaction>>;
    metrics?: any;
  };
  created_by?: string;
  created_at: number; // Xano epochms
}

// API Response wrapper types
export interface XanoResponse<T> {
  data?: T;
  error?: string;
}

export interface XanoListResponse<T> {
  data?: T[];
  total?: number;
  error?: string;
}

// Request payload types for creating records
export interface CreateAgencyRequest {
  name: string;
  slug: string;
  wallet_address?: string;
  subscription_status?: SubscriptionStatus;
  referral_code?: string;
}

export interface CreateCreatorRequest {
  agency: number;
  name: string;
  username: string;
  status?: CreatorStatus;
  commission_rate?: number;
}

export interface CreateTransactionRequest {
  thirdweb_transaction_id?: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  status?: TransactionStatus;
  payment_method?: string;
  agency: number;
  creator?: number;
  subscriber_email?: string;
  metadata?: TransactionMetadata;
  idempotency_key: string;
}

export interface CreateWebhookEventRequest {
  event_type?: string;
  transaction?: number;
  payload: any;
  signature?: string;
  processed?: boolean;
  error?: string;
}

export interface CreateSimulationRunRequest {
  scenario_type: string;
  parameters: SimulationRun['parameters'];
  created_by?: string;
}