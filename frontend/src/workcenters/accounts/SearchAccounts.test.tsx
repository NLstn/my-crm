import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SearchAccounts, Account } from './SearchAccounts';

const mockAccounts: Account[] = [
  { id: 'acc-1', name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 'acc-2', name: 'Globex Corporation', industry: 'Technology' },
  { id: 'acc-3', name: 'Initech', industry: 'Software' },
  { id: 'acc-4', name: 'Umbrella Corporation', industry: 'Pharmaceuticals' },
];

describe('SearchAccounts', () => {
  it('renders the search accounts workcenter', () => {
    render(<SearchAccounts accounts={mockAccounts} />);
    
    expect(screen.getByText('Search Accounts')).toBeInTheDocument();
    expect(screen.getByText('Find accounts by name')).toBeInTheDocument();
  });

  it('displays all accounts initially', () => {
    render(<SearchAccounts accounts={mockAccounts} />);
    
    expect(screen.getByText('Results (4)')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex Corporation')).toBeInTheDocument();
    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(screen.getByText('Umbrella Corporation')).toBeInTheDocument();
  });

  it('filters accounts by name', async () => {
    const user = userEvent.setup();
    render(<SearchAccounts accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by account name...');
    await user.type(searchInput, 'Acme');
    
    expect(screen.getByText('Results (1)')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Globex Corporation')).not.toBeInTheDocument();
    expect(screen.queryByText('Initech')).not.toBeInTheDocument();
    expect(screen.queryByText('Umbrella Corporation')).not.toBeInTheDocument();
  });

  it('is case insensitive when filtering', async () => {
    const user = userEvent.setup();
    render(<SearchAccounts accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by account name...');
    await user.type(searchInput, 'GLOBEX');
    
    expect(screen.getByText('Results (1)')).toBeInTheDocument();
    expect(screen.getByText('Globex Corporation')).toBeInTheDocument();
  });

  it('shows no results message when no accounts match', async () => {
    const user = userEvent.setup();
    render(<SearchAccounts accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by account name...');
    await user.type(searchInput, 'NonExistentCompany');
    
    expect(screen.getByText('Results (0)')).toBeInTheDocument();
    expect(screen.getByText('No accounts found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria')).toBeInTheDocument();
  });

  it('shows empty state when no accounts exist', () => {
    render(<SearchAccounts accounts={[]} />);
    
    expect(screen.getByText('Results (0)')).toBeInTheDocument();
    expect(screen.getByText('No accounts available')).toBeInTheDocument();
    expect(screen.getByText('Create your first account to get started')).toBeInTheDocument();
  });

  it('clears filter when search input is cleared', async () => {
    const user = userEvent.setup();
    render(<SearchAccounts accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by account name...');
    await user.type(searchInput, 'Acme');
    expect(screen.getByText('Results (1)')).toBeInTheDocument();
    
    await user.clear(searchInput);
    expect(screen.getByText('Results (4)')).toBeInTheDocument();
  });

  it('displays account industry information', () => {
    render(<SearchAccounts accounts={mockAccounts} />);
    
    expect(screen.getByText('Manufacturing')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Software')).toBeInTheDocument();
    expect(screen.getByText('Pharmaceuticals')).toBeInTheDocument();
  });

  it('handles accounts with empty industry', () => {
    const accountsWithEmptyIndustry: Account[] = [
      { id: 'acc-1', name: 'Test Company', industry: '' },
    ];
    
    render(<SearchAccounts accounts={accountsWithEmptyIndustry} />);
    
    expect(screen.getByText('No industry specified')).toBeInTheDocument();
  });
});
