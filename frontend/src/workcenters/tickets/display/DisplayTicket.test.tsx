import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { DisplayTicket } from './DisplayTicket';
import type { Account, Contact, Ticket } from '../../../types';
import { accountsApi, contactsApi, ticketsApi } from '../../../api';

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
  ticketsApi: {
    getByAccount: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
  contactsApi: {
    getByAccount: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);
const ticketsApiMock = vi.mocked(ticketsApi);
const contactsApiMock = vi.mocked(contactsApi);

const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  id: overrides.id ?? 'acc-1',
  displayId: overrides.displayId ?? 'ACC-1',
  name: overrides.name ?? 'Acme Corp',
  industry: overrides.industry ?? 'Manufacturing',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const buildTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: overrides.id ?? 'tic-1',
  accountId: overrides.accountId ?? 'acc-1',
  title: overrides.title ?? 'Onboarding call',
  status: overrides.status ?? 'open',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const buildContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: overrides.id ?? 'con-1',
  accountId: overrides.accountId ?? 'acc-1',
  fullName: overrides.fullName ?? 'Jane Doe',
  email: overrides.email ?? 'jane@acme.test',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const mockAccounts: Account[] = [
  buildAccount({ id: 'acc-1', displayId: 'ACC-1', name: 'Acme Corp', industry: 'Manufacturing' }),
  buildAccount({ id: 'acc-2', displayId: 'ACC-2', name: 'Globex Corporation', industry: 'Technology' }),
];

const renderWithRouter = async (route = '/ticket/tic-1') => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/ticket/:id" element={<DisplayTicket />} />
      </Routes>
    </MemoryRouter>
  );

  await screen.findByText(/loading ticket/i);

  await waitFor(() => expect(accountsApiMock.search).toHaveBeenCalled());
};

beforeEach(() => {
  vi.clearAllMocks();

  accountsApiMock.search.mockResolvedValue(mockAccounts);

  ticketsApiMock.getByAccount.mockImplementation(async (accountId: string) => {
    if (accountId === 'acc-1') {
      return [
        buildTicket({ id: 'tic-1', accountId: 'acc-1', title: 'Onboarding call', status: 'open' }),
        buildTicket({ id: 'tic-2', accountId: 'acc-1', title: 'Setup assistance', status: 'in_progress' }),
      ];
    }

    if (accountId === 'acc-2') {
      return [
        buildTicket({ id: 'tic-3', accountId: 'acc-2', title: 'Renewal contract review', status: 'closed' }),
      ];
    }

    return [];
  });

  contactsApiMock.getByAccount.mockImplementation(async (accountId: string) => {
    if (accountId === 'acc-1') {
      return [
        buildContact({ id: 'con-1', fullName: 'Jane Doe', email: 'jane@acme.test' }),
        buildContact({ id: 'con-2', fullName: 'John Smith', email: 'john@acme.test' }),
      ];
    }

    if (accountId === 'acc-2') {
      return [
        buildContact({ id: 'con-3', accountId: 'acc-2', fullName: 'Mary Major', email: 'mary@globex.test' }),
      ];
    }

    return [];
  });
});

describe('DisplayTicket', () => {
  it('renders ticket details', async () => {
    await renderWithRouter('/ticket/tic-1');

    expect(await screen.findByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('ID: tic-1')).toBeDefined();
    expect(screen.getAllByText(/open/i).length).toBeGreaterThan(0);
  });

  it('displays associated account information', async () => {
    await renderWithRouter('/ticket/tic-1');

    expect(await screen.findByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Manufacturing')).toBeDefined();
  });

  it('displays account contacts', async () => {
    await renderWithRouter('/ticket/tic-1');

    expect(await screen.findByText('Jane Doe')).toBeDefined();
    expect(screen.getByText('jane@acme.test')).toBeDefined();
    expect(screen.getByText('John Smith')).toBeDefined();
    expect(screen.getByText('john@acme.test')).toBeDefined();
  });

  it('displays other account tickets', async () => {
    await renderWithRouter('/ticket/tic-1');

    expect(await screen.findByText('Setup assistance')).toBeDefined();
    expect(screen.getByText('Onboarding call')).toBeDefined();
  });

  it('displays summary statistics', async () => {
    await renderWithRouter('/ticket/tic-1');

    const accountContactLabels = await screen.findAllByText('Account Contacts');
    expect(accountContactLabels.length).toBeGreaterThan(0);
    expect(screen.getByText('Total Tickets')).toBeDefined();
    expect(screen.getAllByText(/Open Tickets/i).length).toBeGreaterThan(0);
  });

  it('shows error when ticket is not found', async () => {
    ticketsApiMock.getByAccount.mockResolvedValueOnce([]).mockResolvedValue([]);

    await renderWithRouter('/ticket/tic-999');

    const errorMessages = await screen.findAllByText(/ticket not found/i);
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Back to Search/i })).toBeDefined();
  });

  it('navigates back to search when back button is clicked', async () => {
    const user = userEvent.setup();
    await renderWithRouter('/ticket/tic-1');

    await user.click(await screen.findByRole('button', { name: /Back to Search/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/tickets/search');
  });

  it('navigates to account when account card is clicked', async () => {
    const user = userEvent.setup();
    await renderWithRouter('/ticket/tic-1');

    const accountCard = await screen.findByText('View Account →');
    await user.click(accountCard.closest('button')!);

    expect(mockNavigate).toHaveBeenCalledWith('/account/acc-1');
  });

  it('displays different status badges correctly', async () => {
    await renderWithRouter('/ticket/tic-2');

    expect(await screen.findByText(/in progress/i)).toBeDefined();
  });

  it('shows empty state when no contacts exist', async () => {
    contactsApiMock.getByAccount.mockResolvedValueOnce([]);

    await renderWithRouter('/ticket/tic-1');

    expect(await screen.findByText("No contacts for this ticket's account")).toBeDefined();
  });

  it('shows empty state when no other tickets exist', async () => {
    ticketsApiMock.getByAccount.mockImplementation(async (accountId: string) => {
      if (accountId === 'acc-1') {
        return [buildTicket({ id: 'tic-1', accountId: 'acc-1', title: 'Onboarding call', status: 'open' })];
      }
      return [];
    });

    await renderWithRouter('/ticket/tic-1');

    expect(await screen.findByText('No other tickets for this account')).toBeDefined();
  });

  it('allows changing ticket status', async () => {
    const user = userEvent.setup();
    
    // Mock the updateStatus to return the updated ticket
    const updatedTicket = buildTicket({ id: 'tic-1', accountId: 'acc-1', title: 'Onboarding call', status: 'in_progress' });
    ticketsApiMock.updateStatus = vi.fn().mockResolvedValue(updatedTicket);

    await renderWithRouter('/ticket/tic-1');

    // Find and click the "Mark as In Progress" button
    const inProgressButton = await screen.findByRole('button', { name: /Mark as In Progress/i });
    await user.click(inProgressButton);

    // Verify the API was called with correct parameters
    await waitFor(() => {
      expect(ticketsApiMock.updateStatus).toHaveBeenCalledWith('acc-1', 'tic-1', 'in_progress');
    });
  });

  it('displays status change buttons for non-current statuses', async () => {
    await renderWithRouter('/ticket/tic-1');

    // For an "open" ticket, should show "In Progress" and "Closed" buttons
    expect(await screen.findByRole('button', { name: /Mark as In Progress/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Mark as Closed/i })).toBeDefined();
    
    // Should not show "Mark as Open" button since it's already open
    expect(screen.queryByRole('button', { name: /Mark as Open/i })).toBeNull();
  });
});
