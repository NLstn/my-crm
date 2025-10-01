import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { SearchAccounts } from './workcenters/accounts';
import { Layout } from './components/Layout';
import { accountsApi } from './api';
import type { Account } from './types';

vi.mock('./api', () => ({
  accountsApi: {
    search: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);

const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  id: overrides.id ?? 'acc-1',
  displayId: overrides.displayId ?? 'ACC-001',
  name: overrides.name ?? 'Acme Corp',
  industry: overrides.industry ?? 'Manufacturing',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  accountsApiMock.search.mockResolvedValue([
    buildAccount(),
    buildAccount({ id: 'acc-2', displayId: 'ACC-002', name: 'Globex', industry: 'Technology' }),
  ]);
});

describe('App', () => {
  it('renders the dashboard with CRM heading and panels', () => {
    render(
      <BrowserRouter>
        <Layout>
          <Dashboard />
        </Layout>
      </BrowserRouter>
    );

  expect(screen.getByRole('heading', { level: 1, name: /my crm/i })).toBeDefined();
  expect(screen.getByRole('heading', { level: 2, name: /accounts/i })).toBeDefined();
  expect(screen.getByRole('heading', { level: 2, name: /contacts/i })).toBeDefined();
  expect(screen.getByRole('heading', { level: 2, name: /tickets/i })).toBeDefined();
  });

  it('renders search accounts workcenter', async () => {
    render(
      <BrowserRouter>
        <Layout>
          <SearchAccounts />
        </Layout>
      </BrowserRouter>
    );

  expect(await screen.findByRole('heading', { level: 1, name: /search accounts/i })).toBeDefined();
  expect(screen.getByPlaceholderText(/search by name, industry, or id/i)).toBeDefined();

    await waitFor(() => {
      expect(accountsApiMock.search).toHaveBeenCalled();
    });

    expect(await screen.findByText('Results (2)')).toBeDefined();
  });
});
