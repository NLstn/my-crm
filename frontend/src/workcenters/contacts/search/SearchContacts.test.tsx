import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { SearchContacts } from './SearchContacts';
import type { Account, Contact } from '../../../types';
import { accountsApi, contactsApi } from '../../../api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../api', () => ({
  accountsApi: {
    search: vi.fn(),
  },
  contactsApi: {
    search: vi.fn(),
    getByAccount: vi.fn(),
    create: vi.fn(),
  },
  ticketsApi: {
    getByAccount: vi.fn(),
    create: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);
const contactsApiMock = vi.mocked(contactsApi);

const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  id: overrides.id ?? '1',
  displayId: overrides.displayId ?? 'ACC-1',
  name: overrides.name ?? 'Acme Corp',
  industry: overrides.industry ?? 'Manufacturing',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const buildContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: overrides.id ?? 'con-1',
  accountId: overrides.accountId ?? '1',
  fullName: overrides.fullName ?? 'John Doe',
  email: overrides.email ?? 'john.doe@acme.com',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const mockAccounts: Account[] = [
  buildAccount({ id: '1', displayId: 'ACC-1', name: 'Acme Corp', industry: 'Manufacturing' }),
  buildAccount({ id: '2', displayId: 'ACC-2', name: 'Globex Corporation', industry: 'Technology' }),
  buildAccount({ id: '3', displayId: 'ACC-3', name: 'Initech', industry: 'Software' }),
];

const mockContacts: Contact[] = [
  buildContact({ id: 'con-1', accountId: '1', fullName: 'John Doe', email: 'john.doe@acme.com' }),
  buildContact({ id: 'con-2', accountId: '1', fullName: 'Jane Smith', email: 'jane.smith@acme.com' }),
  buildContact({ id: 'con-3', accountId: '2', fullName: 'Bob Johnson', email: 'bob.johnson@globex.com' }),
  buildContact({ id: 'con-4', accountId: '3', fullName: 'Alice Williams', email: 'alice.williams@initech.com' }),
];

const renderComponent = async () => {
  render(
    <MemoryRouter initialEntries={['/contacts/search']}>
      <Routes>
        <Route path="/contacts/search" element={<SearchContacts />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(contactsApiMock.search).toHaveBeenCalled());
  await waitFor(() => expect(accountsApiMock.search).toHaveBeenCalled());
  await screen.findByText('Search Contacts');
};

beforeEach(() => {
  vi.clearAllMocks();

  contactsApiMock.search.mockResolvedValue(mockContacts);
  accountsApiMock.search.mockResolvedValue(mockAccounts);
});

describe('SearchContacts', () => {
  it('renders the search contacts workcenter', async () => {
    await renderComponent();

    expect(screen.getByText('Search Contacts')).toBeDefined();
    expect(screen.getByText('Find contacts by name or email')).toBeDefined();
  });

  it('displays all contacts initially', async () => {
    await renderComponent();

    expect(screen.getByText('Results (4)')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
    expect(screen.getByText('Bob Johnson')).toBeDefined();
    expect(screen.getByText('Alice Williams')).toBeDefined();
  });

  it('filters contacts by name', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by contact name...');
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(screen.getByText('Results (2)')).toBeDefined();
    });

    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Bob Johnson')).toBeDefined();
    expect(screen.queryByText('Jane Smith')).toBeNull();
    expect(screen.queryByText('Alice Williams')).toBeNull();
  });

  it('filters contacts by email', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by email...');
    await user.type(searchInput, 'acme');

    await waitFor(() => {
      expect(screen.getByText('Results (2)')).toBeDefined();
    });

    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
    expect(screen.queryByText('Bob Johnson')).toBeNull();
    expect(screen.queryByText('Alice Williams')).toBeNull();
  });

  it('filters contacts by both name and email', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const nameInput = screen.getByPlaceholderText('Search by contact name...');
    const emailInput = screen.getByPlaceholderText('Search by email...');

    await user.type(nameInput, 'Jane');
    await user.type(emailInput, 'acme');

    await waitFor(() => {
      expect(screen.getByText('Results (1)')).toBeDefined();
    });

    expect(screen.getByText('Jane Smith')).toBeDefined();
  });

  it('is case insensitive when filtering', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by contact name...');
    await user.type(searchInput, 'ALICE');

    await waitFor(() => {
      expect(screen.getByText('Results (1)')).toBeDefined();
    });

    expect(screen.getByText('Alice Williams')).toBeDefined();
  });

  it('shows no results message when no contacts match', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by contact name...');
    await user.type(searchInput, 'NonExistentPerson');

    await waitFor(() => {
      expect(screen.getByText('Results (0)')).toBeDefined();
    });

    expect(screen.getByText('No contacts found')).toBeDefined();
    expect(screen.getByText('Try adjusting your search criteria')).toBeDefined();
  });

  it('shows empty state when no contacts exist', async () => {
    contactsApiMock.search.mockResolvedValueOnce([]);

    await renderComponent();

    expect(screen.getByText('Results (0)')).toBeDefined();
    expect(screen.getByText('No contacts available')).toBeDefined();
    expect(screen.getByText('Create your first contact to get started')).toBeDefined();
  });

  it('clears filter when search input is cleared', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by contact name...');
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(screen.getByText('Results (2)')).toBeDefined();
    });

    await user.clear(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Results (4)')).toBeDefined();
    });
  });

  it('displays contact email information', async () => {
    await renderComponent();

    expect(screen.getByText('john.doe@acme.com')).toBeDefined();
    expect(screen.getByText('jane.smith@acme.com')).toBeDefined();
    expect(screen.getByText('bob.johnson@globex.com')).toBeDefined();
    expect(screen.getByText('alice.williams@initech.com')).toBeDefined();
  });

  it('displays associated account names', async () => {
    await renderComponent();

    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
    expect(screen.getByText('Globex Corporation')).toBeDefined();
    expect(screen.getByText('Initech')).toBeDefined();
  });

  it('handles contacts with unknown account', async () => {
    const contactsWithUnknownAccount: Contact[] = [
      buildContact({ id: 'con-999', accountId: '999', fullName: 'Test Person', email: 'test@example.com' }),
    ];

    contactsApiMock.search.mockResolvedValueOnce(contactsWithUnknownAccount);

    await renderComponent();

    expect(screen.getByText('Unknown Account')).toBeDefined();
  });

  it('navigates to contact creation when button is clicked', async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByRole('button', { name: /Create New Contact/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/contacts/create');
  });
});
