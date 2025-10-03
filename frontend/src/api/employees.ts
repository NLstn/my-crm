import type { Employee, CreateEmployeeInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const employeesApi = {
  /**
   * Search employees
   * @param query - Optional search query to filter by name or email
   * @returns Array of employees matching the search
   */
  async search(query?: string): Promise<Employee[]> {
    const url = new URL(`${API_BASE_URL}/employees`);
    if (query) {
      url.searchParams.set('q', query);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to search employees' }));
      throw new Error(error.error || 'Failed to search employees');
    }

    return response.json();
  },

  /**
   * Create a new employee
   * @param input - The employee data to create
   * @returns The newly created employee
   */
  async create(input: CreateEmployeeInput): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create employee' }));
      throw new Error(error.error || 'Failed to create employee');
    }

    return response.json();
  },
};
