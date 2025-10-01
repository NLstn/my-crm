import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { SearchAccounts } from './SearchAccounts';
import type { Account } from '../../../types';
import { accountsApi } from '../../../api';

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
}));

const accountsApiMock = vi.mocked(accountsApi);

const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  id: overrides.id ?? 'acc-1',
  displayId: overrides.displayId ?? 'ACC-1',
  name: overrides.name ?? 'Acme Corp',
  industry: overrides.industry ?? 'Manufacturing',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const mockAccounts: Account[] = [
  buildAccount({ id: 'acc-1', displayId: 'ACC-1', name: 'Acme Corp', industry: 'Manufacturing' }),
  buildAccount({ id: 'acc-2', displayId: 'ACC-2', name: 'Globex Corporation', industry: 'Technology' }),
  buildAccount({ id: 'acc-3', displayId: 'ACC-3', name: 'Initech', industry: 'Software' }),
  buildAccount({ id: 'acc-4', displayId: 'ACC-4', name: 'Umbrella Corporation', industry: 'Pharmaceuticals' }),
];

const renderComponent = async () => {
  render(
    <MemoryRouter initialEntries={['/accounts/search']}>
      <Routes>
        <Route path="/accounts/search" element={<SearchAccounts />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(accountsApiMock.search).toHaveBeenCalled());
  await waitFor(() => {
    expect(screen.queryByText(/Loading accounts/i)).toBeNull();
  });
};

beforeEach(() => {
  vi.clearAllMocks();

  accountsApiMock.search.mockImplementation(async (query?: string) => {
    const normalized = (query ?? '').trim().toLowerCase();
    if (!normalized) {
      return mockAccounts;
    }

    return mockAccounts.filter((account) =>
      account.name.toLowerCase().includes(normalized) ||
      account.industry.toLowerCase().includes(normalized) ||
      account.displayId.toLowerCase().includes(normalized)
    );
  });
});

describe('SearchAccounts', () => {
  it('renders the search accounts workcenter', async () => {
    await renderComponent();

    expect(screen.getByText('Search Accounts')).toBeDefined();
    expect(screen.getByText('Find accounts by name')).toBeDefined();
  });

  it('displays all accounts initially', async () => {
    await renderComponent();

    expect(screen.getByText('Results (4)')).toBeDefined();
    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Globex Corporation')).toBeDefined();
    expect(screen.getByText('Initech')).toBeDefined();
    expect(screen.getByText('Umbrella Corporation')).toBeDefined();
  });

  it('filters accounts by name', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by name, industry, or ID...');
    await user.type(searchInput, 'Acme');
    await user.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText('Results (1)')).toBeDefined();
    });

    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.queryByText('Globex Corporation')).toBeNull();
    expect(screen.queryByText('Initech')).toBeNull();
    expect(screen.queryByText('Umbrella Corporation')).toBeNull();
  });

  it('is case insensitive when filtering', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by name, industry, or ID...');
    await user.type(searchInput, 'GLOBEX');
    await user.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText('Results (1)')).toBeDefined();
    });

    expect(screen.getByText('Globex Corporation')).toBeDefined();
  });

  it('shows no results message when no accounts match', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by name, industry, or ID...');
    await user.type(searchInput, 'NonExistentCompany');
    await user.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(screen.getByText('Results (0)')).toBeDefined();
    });

    expect(screen.getByText('No accounts found')).toBeDefined();
    expect(screen.getByText('Try adjusting your search criteria')).toBeDefined();
  });

  it('shows empty state when no accounts exist', async () => {
    accountsApiMock.search.mockResolvedValueOnce([]);

    await renderComponent();

    expect(screen.getByText('Results (0)')).toBeDefined();
    expect(screen.getByText('No accounts available')).toBeDefined();
    expect(screen.getByText('Create your first account to get started')).toBeDefined();
  });

  it('clears filter when search input is cleared', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const searchInput = screen.getByPlaceholderText('Search by name, industry, or ID...');
    const searchButton = screen.getByRole('button', { name: /Search/i });

    await user.type(searchInput, 'Acme');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Results (1)')).toBeDefined();
    });

    await user.clear(searchInput);
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Results (4)')).toBeDefined();
    });
  });

  it('displays account industry information', async () => {
    await renderComponent();

    expect(screen.getByText('Manufacturing')).toBeDefined();
    expect(screen.getByText('Technology')).toBeDefined();
    expect(screen.getByText('Software')).toBeDefined();
    expect(screen.getByText('Pharmaceuticals')).toBeDefined();
  });

  it('handles accounts with empty industry', async () => {
    accountsApiMock.search.mockResolvedValueOnce([
      buildAccount({ id: 'acc-empty', displayId: 'ACC-5', name: 'Test Company', industry: '' }),
    ]);

    await renderComponent();

    expect(screen.getByText('No industry specified')).toBeDefined();
  });

  it('navigates to account creation when button is clicked', async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByRole('button', { name: /Create New Account/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/accounts/create');
  });

  it('navigates to account detail when account card is clicked', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const accountCard = await screen.findByRole('button', { name: /Acme Corp/i });
    await user.click(accountCard);

    expect(mockNavigate).toHaveBeenCalledWith('/account/acc-1');
  });
});
