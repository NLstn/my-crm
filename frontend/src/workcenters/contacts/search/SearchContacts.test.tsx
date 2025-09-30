import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { SearchContacts, Contact, Account } from './SearchContacts';

const mockAccounts: Account[] = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Globex Corporation' },
  { id: 3, name: 'Initech' },
];

const mockContacts: Contact[] = [
  { id: 1, accountId: '1', fullName: 'John Doe', email: 'john.doe@acme.com' },
  { id: 2, accountId: '1', fullName: 'Jane Smith', email: 'jane.smith@acme.com' },
  { id: 3, accountId: '2', fullName: 'Bob Johnson', email: 'bob.johnson@globex.com' },
  { id: 4, accountId: '3', fullName: 'Alice Williams', email: 'alice.williams@initech.com' },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SearchContacts', () => {
  it('renders the search contacts workcenter', () => {
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    expect(screen.getByText('Search Contacts')).toBeDefined();
    expect(screen.getByText('Find contacts by name or email')).toBeDefined();
  });

  it('displays all contacts initially', () => {
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    expect(screen.getByText('Results (4)')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
    expect(screen.getByText('Bob Johnson')).toBeDefined();
    expect(screen.getByText('Alice Williams')).toBeDefined();
  });

  it('filters contacts by name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by contact name...');
    await act(async () => {
      await user.type(searchInput, 'John');
    });
    
    expect(screen.getByText('Results (2)')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Bob Johnson')).toBeDefined();
    expect(screen.queryByText('Jane Smith')).toBeNull();
    expect(screen.queryByText('Alice Williams')).toBeNull();
  });

  it('filters contacts by email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by email...');
    await act(async () => {
      await user.type(searchInput, 'acme');
    });
    
    expect(screen.getByText('Results (2)')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
    expect(screen.queryByText('Bob Johnson')).toBeNull();
    expect(screen.queryByText('Alice Williams')).toBeNull();
  });

  it('filters contacts by both name and email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    const nameInput = screen.getByPlaceholderText('Search by contact name...');
    const emailInput = screen.getByPlaceholderText('Search by email...');
    
    await act(async () => {
      await user.type(nameInput, 'Jane');
      await user.type(emailInput, 'acme');
    });
    
    expect(screen.getByText('Results (1)')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
  });

  it('is case insensitive when filtering', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by contact name...');
    await act(async () => {
      await user.type(searchInput, 'ALICE');
    });
    
    expect(screen.getByText('Results (1)')).toBeDefined();
    expect(screen.getByText('Alice Williams')).toBeDefined();
  });

  it('shows no results message when no contacts match', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by contact name...');
    await act(async () => {
      await user.type(searchInput, 'NonExistentPerson');
    });
    
    expect(screen.getByText('Results (0)')).toBeDefined();
    expect(screen.getByText('No contacts found')).toBeDefined();
    expect(screen.getByText('Try adjusting your search criteria')).toBeDefined();
  });

  it('shows empty state when no contacts exist', () => {
    renderWithRouter(<SearchContacts contacts={[]} accounts={mockAccounts} />);
    
    expect(screen.getByText('Results (0)')).toBeDefined();
    expect(screen.getByText('No contacts available')).toBeDefined();
    expect(screen.getByText('Create your first contact to get started')).toBeDefined();
  });

  it('clears filter when search input is cleared', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    const searchInput = screen.getByPlaceholderText('Search by contact name...');
    await act(async () => {
      await user.type(searchInput, 'John');
    });
    expect(screen.getByText('Results (2)')).toBeDefined();
    
    await act(async () => {
      await user.clear(searchInput);
    });
    expect(screen.getByText('Results (4)')).toBeDefined();
  });

  it('displays contact email information', () => {
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    expect(screen.getByText('john.doe@acme.com')).toBeDefined();
    expect(screen.getByText('jane.smith@acme.com')).toBeDefined();
    expect(screen.getByText('bob.johnson@globex.com')).toBeDefined();
    expect(screen.getByText('alice.williams@initech.com')).toBeDefined();
  });

  it('displays associated account names', () => {
    renderWithRouter(<SearchContacts contacts={mockContacts} accounts={mockAccounts} />);
    
    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
    expect(screen.getByText('Globex Corporation')).toBeDefined();
    expect(screen.getByText('Initech')).toBeDefined();
  });

  it('handles contacts with unknown account', () => {
    const contactsWithUnknownAccount: Contact[] = [
      { id: 1, accountId: '999', fullName: 'Test Person', email: 'test@example.com' },
    ];
    
    renderWithRouter(<SearchContacts contacts={contactsWithUnknownAccount} accounts={mockAccounts} />);
    
    expect(screen.getByText('Unknown Account')).toBeDefined();
  });
});
