import type { Ticket, CreateTicketInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const ticketsApi = {
  /**
   * Get all tickets for a specific account
   * @param accountId - The UUID of the account
   * @returns Array of tickets for the account
   */
  async getByAccount(accountId: string): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/tickets`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Account not found');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to fetch tickets' }));
      throw new Error(error.error || 'Failed to fetch tickets');
    }

    return response.json();
  },

  /**
   * Create a new ticket for a specific account
   * @param accountId - The UUID of the account
   * @param input - The ticket data to create
   * @returns The newly created ticket
   */
  async create(accountId: string, input: CreateTicketInput): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/tickets`, {
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
      const error = await response.json().catch(() => ({ error: 'Failed to create ticket' }));
      throw new Error(error.error || 'Failed to create ticket');
    }

    return response.json();
  },

  /**
   * Update the status of a ticket
   * @param accountId - The UUID of the account
   * @param ticketId - The UUID of the ticket
   * @param status - The new status for the ticket
   * @returns The updated ticket
   */
  async updateStatus(accountId: string, ticketId: string, status: string): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Ticket or account not found');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to update ticket status' }));
      throw new Error(error.error || 'Failed to update ticket status');
    }

    return response.json();
  },
};
