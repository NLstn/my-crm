import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { SearchAccounts, Account } from './SearchAccounts';

const mockAccounts: Account[] = [
  { id: 1, name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 2, name: 'Globex Corporation', industry: 'Technology' },
  { id: 3, name: 'Initech', industry: 'Software' },
  { id: 4, name: 'Umbrella Corporation', industry: 'Pharmaceuticals' },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SearchAccounts', () => {
  it('renders the search accounts workcenter', () => {
    renderWithRouter(<SearchAccounts accounts={mockAccounts} />);
    
    expect(screen.getByText('Search Accounts')).toBeDefined();
    expect(screen.getByText('Find accounts by name')).toBeDefined();
  });

  it('displays all accounts initially', () => {
    renderWithRouter(<SearchAccounts accounts={mockAccounts} />);
    
    expect(screen.getByText('Results (4)')).toBeDefined();
    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Globex Corporation')).toBeDefined();
    expect(screen.getByText('Initech')).toBeDefined();
    expect(screen.getByText('Umbrella Corporation')).toBeDefined();
  });

  it('filters accounts by name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchAccounts accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by account name...');
    await user.type(searchInput, 'Acme');
    
    expect(screen.getByText('Results (1)')).toBeDefined();
    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.queryByText('Globex Corporation')).toBeNull();
    expect(screen.queryByText('Initech')).toBeNull();
    expect(screen.queryByText('Umbrella Corporation')).toBeNull();
  });

  it('is case insensitive when filtering', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchAccounts accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by account name...');
    await user.type(searchInput, 'GLOBEX');
    
    expect(screen.getByText('Results (1)')).toBeDefined();
    expect(screen.getByText('Globex Corporation')).toBeDefined();
  });

  it('shows no results message when no accounts match', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchAccounts accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by account name...');
    await user.type(searchInput, 'NonExistentCompany');
    
    expect(screen.getByText('Results (0)')).toBeDefined();
    expect(screen.getByText('No accounts found')).toBeDefined();
    expect(screen.getByText('Try adjusting your search criteria')).toBeDefined();
  });

  it('shows empty state when no accounts exist', () => {
    renderWithRouter(<SearchAccounts accounts={[]} />);
    
    expect(screen.getByText('Results (0)')).toBeDefined();
    expect(screen.getByText('No accounts available')).toBeDefined();
    expect(screen.getByText('Create your first account to get started')).toBeDefined();
  });

  it('clears filter when search input is cleared', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchAccounts accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by account name...');
    await user.type(searchInput, 'Acme');
    expect(screen.getByText('Results (1)')).toBeDefined();
    
    await user.clear(searchInput);
    expect(screen.getByText('Results (4)')).toBeDefined();
  });

  it('displays account industry information', () => {
    renderWithRouter(<SearchAccounts accounts={mockAccounts} />);
    
    expect(screen.getByText('Manufacturing')).toBeDefined();
    expect(screen.getByText('Technology')).toBeDefined();
    expect(screen.getByText('Software')).toBeDefined();
    expect(screen.getByText('Pharmaceuticals')).toBeDefined();
  });

  it('handles accounts with empty industry', () => {
    const accountsWithEmptyIndustry: Account[] = [
      { id: 1, name: 'Test Company', industry: '' },
    ];
    
    renderWithRouter(<SearchAccounts accounts={accountsWithEmptyIndustry} />);
    
    expect(screen.getByText('No industry specified')).toBeDefined();
  });
});
