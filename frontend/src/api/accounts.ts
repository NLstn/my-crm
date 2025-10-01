import type { Account, CreateAccountInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const accountsApi = {
  /**
   * Search for accounts by query string
   * @param query - Optional search query. If empty, returns all accounts
   * @returns Array of accounts matching the search criteria
   */
  async search(query: string = ''): Promise<Account[]> {
    const url = new URL('/accounts', API_BASE_URL);
    if (query) {
      url.searchParams.set('q', query);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to search accounts' }));
      throw new Error(error.error || 'Failed to search accounts');
    }

    return response.json();
  },

  /**
   * Get a single account by ID
   * @param id - The UUID of the account to retrieve
   * @returns The account object
   */
  async getById(id: string): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Account not found');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to fetch account' }));
      throw new Error(error.error || 'Failed to fetch account');
    }

    return response.json();
  },

  /**
   * Create a new account
   * @param input - The account data to create
   * @returns The newly created account
   */
  async create(input: CreateAccountInput): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create account' }));
      throw new Error(error.error || 'Failed to create account');
    }

    return response.json();
  },
};
