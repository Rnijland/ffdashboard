/**
 * Xano API Client - Server-only wrapper for secure database operations
 * CRITICAL: Never expose XANO_API_KEY to client-side code
 */

import {
  Agency,
  Creator,
  Transaction,
  WebhookEvent,
  SimulationRun,
  CreateAgencyRequest,
  CreateCreatorRequest,
  CreateTransactionRequest,
  CreateWebhookEventRequest,
  CreateSimulationRunRequest,
} from '@/types/database';

class XanoClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.XANO_API_URL!;
    
    if (!this.baseUrl) {
      throw new Error('Missing XANO_API_URL environment variable');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data?: T; error?: string }> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Xano API Error [${response.status}]:`, errorText);
        
return { error: `API Error: ${response.status} - ${errorText}` };
      }

      const data = await response.json();
      
return { data };
    } catch (error) {
      console.error('Xano Client Error:', error);
      
return { error: `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Agency CRUD operations
  async getAgencies() {
    return this.request<Agency[]>('/ff_agency');
  }

  async getAgency(id: number) {
    return this.request<Agency>(`/ff_agency/${id}`);
  }

  async createAgency(data: CreateAgencyRequest) {
    return this.request<Agency>('/ff_agency', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgency(id: number, data: Partial<CreateAgencyRequest>) {
    return this.request<Agency>(`/ff_agency/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAgency(id: number) {
    return this.request<void>(`/ff_agency/${id}`, {
      method: 'DELETE',
    });
  }

  // Creator CRUD operations  
  async getCreators() {
    return this.request<Creator[]>('/ff_creator');
  }

  async getCreator(id: number) {
    return this.request<Creator>(`/ff_creator/${id}`);
  }

  async getCreatorsByAgency(agencyId: number) {
    return this.request<Creator[]>(`/ff_creator?agency=${agencyId}`);
  }

  async findAgencyBySlug(slug: string) {
    return this.request<Agency[]>(`/ff_agency?slug=${slug}`);
  }

  async findCreatorByUsername(username: string) {
    return this.request<Creator[]>(`/ff_creator?username=${username}`);
  }

  async createCreator(data: CreateCreatorRequest) {
    return this.request<Creator>('/ff_creator', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCreator(id: number, data: Partial<CreateCreatorRequest>) {
    return this.request<Creator>(`/ff_creator/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCreator(id: number) {
    return this.request<void>(`/ff_creator/${id}`, {
      method: 'DELETE',
    });
  }

  // Transaction CRUD operations
  async getTransactions() {
    return this.request<Transaction[]>('/ff_transaction');
  }

  async getTransaction(id: number) {
    return this.request<Transaction>(`/ff_transaction/${id}`);
  }

  async getTransactionsByAgency(agencyId: number) {
    return this.request<Transaction[]>(`/ff_transaction?agency=${agencyId}`);
  }

  async getTransactionByIdempotencyKey(key: string) {
    return this.request<Transaction>(`/ff_transaction?idempotency_key=${key}`);
  }

  async createTransaction(data: CreateTransactionRequest) {
    // Calculate net_amount if not provided
    const transactionData = {
      ...data,
      fee: data.fee || 0,
      net_amount: data.amount - (data.fee || 0),
    };
    
    return this.request<Transaction>('/ff_transaction', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async updateTransaction(id: number, data: Partial<CreateTransactionRequest>) {
    // Recalculate net_amount if amount or fee changes
    const updateData: any = { ...data };
    if ('amount' in data || 'fee' in data) {
      const current = await this.getTransaction(id);
      if (current.data) {
        const amount = data.amount ?? current.data.amount;
        const fee = data.fee ?? current.data.fee;
        updateData.net_amount = amount - fee;
      }
    }

    return this.request<Transaction>(`/ff_transaction/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async deleteTransaction(id: number) {
    return this.request<void>(`/ff_transaction/${id}`, {
      method: 'DELETE',
    });
  }

  // WebhookEvent CRUD operations
  async getWebhookEvents() {
    return this.request<WebhookEvent[]>('/ff_webhook_event');
  }

  async getWebhookEvent(id: number) {
    return this.request<WebhookEvent>(`/ff_webhook_event/${id}`);
  }

  async getUnprocessedWebhookEvents() {
    return this.request<WebhookEvent[]>('/ff_webhook_event?processed=false');
  }

  async createWebhookEvent(data: CreateWebhookEventRequest) {
    return this.request<WebhookEvent>('/ff_webhook_event', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWebhookEvent(id: number, data: Partial<CreateWebhookEventRequest>) {
    return this.request<WebhookEvent>(`/ff_webhook_event/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhookEvent(id: number) {
    return this.request<void>(`/ff_webhook_event/${id}`, {
      method: 'DELETE',
    });
  }

  // SimulationRun CRUD operations
  async getSimulationRuns() {
    return this.request<SimulationRun[]>('/ff_simulation_run');
  }

  async getSimulationRun(id: number) {
    return this.request<SimulationRun>(`/ff_simulation_run/${id}`);
  }

  async createSimulationRun(data: CreateSimulationRunRequest) {
    return this.request<SimulationRun>('/ff_simulation_run', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSimulationRun(id: number, data: Partial<CreateSimulationRunRequest>) {
    return this.request<SimulationRun>(`/ff_simulation_run/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSimulationRun(id: number) {
    return this.request<void>(`/ff_simulation_run/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance - server-only
export const xanoClient = new XanoClient();