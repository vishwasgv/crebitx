import api from './api';

export interface CreditProfile {
  creditLimit: number;
  paymentCycle: number;
  gracePeriod: number;
  lateFeePercent: number;
  reminderFreq: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditProfile?: CreditProfile;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditProfile?: Partial<CreditProfile>;
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditProfile?: Partial<CreditProfile>;
}

export const customerService = {
  /**
   * Get all customers
   */
  async getAll(params?: { search?: string; limit?: number; offset?: number }): Promise<Customer[]> {
    const response = await api.get('/customers', { params });
    return response.data.data;
  },

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
  },

  /**
   * Create new customer
   */
  async create(data: CreateCustomerData): Promise<Customer> {
    const response = await api.post('/customers', data);
    return response.data.data;
  },

  /**
   * Update customer
   */
  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete customer
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  /**
   * Add ledger entry for customer
   */
  async addLedgerEntry(data: {
    customerId: string;
    amount: number;
    tag: 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'PAYMENT';
    note?: string;
  }): Promise<any> {
    const response = await api.post('/customers/ledger', data);
    return response.data.data;
  },

  /**
   * Get ledger history
   */
  async getLedgerHistory(params: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
    tag?: string;
  }): Promise<any[]> {
    const response = await api.get('/customers/ledger/history', { params });
    return response.data.data;
  },
};

export default customerService;
