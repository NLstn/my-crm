import type { Contact, CreateContactInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const contactsApi = {
  /**
   * Search contacts across all accounts
   * @param query - Optional search query to filter by name or email
   * @returns Array of contacts matching the search
   */
  async search(query?: string): Promise<Contact[]> {
    const url = new URL(`${API_BASE_URL}/contacts`);
    if (query) {
      url.searchParams.set('q', query);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to search contacts' }));
      throw new Error(error.error || 'Failed to search contacts');
    }

    return response.json();
  },

  /**
   * Get all contacts for a specific account
   * @param accountId - The UUID of the account
   * @returns Array of contacts for the account
   */
  async getByAccount(accountId: string): Promise<Contact[]> {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/contacts`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Account not found');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to fetch contacts' }));
      throw new Error(error.error || 'Failed to fetch contacts');
    }

    return response.json();
  },

  /**
   * Create a new contact for a specific account
   * @param accountId - The UUID of the account
   * @param input - The contact data to create
   * @returns The newly created contact
   */
  async create(accountId: string, input: CreateContactInput): Promise<Contact> {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Account not found');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to create contact' }));
      throw new Error(error.error || 'Failed to create contact');
    }

    return response.json();
  },
};
