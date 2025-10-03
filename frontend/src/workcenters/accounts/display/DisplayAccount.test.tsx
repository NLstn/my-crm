import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { DisplayAccount } from './DisplayAccount';
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
    getById: vi.fn(),
    search: vi.fn(),
  },
  contactsApi: {
    getByAccount: vi.fn(),
  },
  ticketsApi: {
    getByAccount: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);
const contactsApiMock = vi.mocked(contactsApi);
const ticketsApiMock = vi.mocked(ticketsApi);

const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  id: overrides.id ?? 'acc-1',
  displayId: overrides.displayId ?? 'ACC-001',
  name: overrides.name ?? 'Acme Corp',
  industry: overrides.industry ?? 'Manufacturing',
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

const buildTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: overrides.id ?? 'tic-1',
  accountId: overrides.accountId ?? 'acc-1',
  title: overrides.title ?? 'Onboarding call',
  status: overrides.status ?? 'open',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const renderDisplayAccount = async (accountId = 'acc-1') => {
  render(
    <MemoryRouter initialEntries={[`/account/${accountId}`]}>
      <Routes>
        <Route path="/account/:id" element={<DisplayAccount />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(accountsApiMock.getById).toHaveBeenCalledWith(accountId));
};

beforeEach(() => {
  vi.clearAllMocks();

  const defaultAccount = buildAccount();
  const defaultContacts = [
    buildContact({ id: 'con-1', fullName: 'Jane Doe', email: 'jane@acme.test' }),
    buildContact({ id: 'con-2', fullName: 'John Smith', email: 'john@acme.test' }),
  ];
  const defaultTickets = [
    buildTicket({ id: 'tic-1', title: 'Onboarding call', status: 'open' }),
    buildTicket({ id: 'tic-2', title: 'Follow-up meeting', status: 'in_progress' }),
    buildTicket({ id: 'tic-3', title: 'Renewal contract review', status: 'closed' }),
  ];

  accountsApiMock.getById.mockResolvedValue(defaultAccount);
  contactsApiMock.getByAccount.mockResolvedValue(defaultContacts);
  ticketsApiMock.getByAccount.mockResolvedValue(defaultTickets);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('DisplayAccount', () => {
  it('renders account details when account exists', async () => {
    await renderDisplayAccount('acc-1');

    expect(await screen.findByRole('heading', { level: 1, name: 'Acme Corp' })).toBeDefined();
    expect(screen.getByText('ACC-001')).toBeDefined();
    expect(screen.getByText('Manufacturing')).toBeDefined();
  });

  it('displays summary statistics correctly', async () => {
    await renderDisplayAccount('acc-1');

    const contactsLabels = await screen.findAllByText('Contacts');
    const contactsSummaryLabel = contactsLabels.find((element) => element.tagName === 'DIV');
    expect(contactsSummaryLabel?.previousElementSibling?.textContent).toBe('2');

    const totalTicketsLabels = screen.getAllByText('Total Tickets');
    const totalTicketsSummaryLabel = totalTicketsLabels.find((element) => element.tagName === 'DIV');
    expect(totalTicketsSummaryLabel?.previousElementSibling?.textContent).toBe('3');

    const openTicketsLabels = screen.getAllByText('Open Tickets');
    const openTicketsSummaryLabel = openTicketsLabels.find((element) => element.tagName === 'DIV');
    expect(openTicketsSummaryLabel?.previousElementSibling?.textContent).toBe('2');
  });

  it('displays contacts for the account', async () => {
    await renderDisplayAccount('acc-1');

    expect(await screen.findByText('Jane Doe')).toBeDefined();
    expect(screen.getByText('jane@acme.test')).toBeDefined();
    expect(screen.getByText('John Smith')).toBeDefined();
    expect(screen.getByText('john@acme.test')).toBeDefined();
  });

  it('displays tickets for the account', async () => {
    await renderDisplayAccount('acc-1');

    expect(await screen.findByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('Follow-up meeting')).toBeDefined();
    expect(screen.getByText('Renewal contract review')).toBeDefined();
  });

  it('displays ticket status badges', async () => {
    await renderDisplayAccount('acc-1');

    expect(await screen.findByText('open')).toBeDefined();
    expect(screen.getByText('in progress')).toBeDefined();
    expect(screen.getByText('closed')).toBeDefined();
  });

  it('shows error message when account does not exist', async () => {
    accountsApiMock.getById.mockRejectedValueOnce(new Error('Account not found'));

    await renderDisplayAccount('acc-999');

    expect(await screen.findByRole('heading', { level: 1, name: /account not found/i })).toBeDefined();
    expect(screen.getByText('Back to Search')).toBeDefined();
  });

  it('shows empty state when account has no contacts', async () => {
    contactsApiMock.getByAccount.mockResolvedValueOnce([]);

    await renderDisplayAccount('acc-1');

    expect(await screen.findByText('No contacts for this account')).toBeDefined();
  });

  it('shows empty state when account has no tickets', async () => {
    ticketsApiMock.getByAccount.mockResolvedValueOnce([]);

    await renderDisplayAccount('acc-1');

    expect(await screen.findByText('No tickets for this account')).toBeDefined();
  });

  it('has a back button that navigates to search', async () => {
    const user = userEvent.setup();
    await renderDisplayAccount('acc-1');

    const backButton = await screen.findByRole('button', { name: /Back to Search/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/accounts/search');
  });

  it('navigates to contact when contact card is clicked', async () => {
    const user = userEvent.setup();
    await renderDisplayAccount('acc-1');

    const contactButton = await screen.findByRole('button', { name: /Jane Doe/i });
    await user.click(contactButton);

    expect(mockNavigate).toHaveBeenCalledWith('/contact/con-1');
  });

  it('navigates to ticket when ticket card is clicked', async () => {
    const user = userEvent.setup();
    await renderDisplayAccount('acc-1');

    const ticketButton = await screen.findByRole('button', { name: /Onboarding call/i });
    await user.click(ticketButton);

    expect(mockNavigate).toHaveBeenCalledWith('/ticket/tic-1');
  });

  it('has a create contact button that navigates to create contact form with account pre-filled', async () => {
    const user = userEvent.setup();
    await renderDisplayAccount('acc-1');

    const createContactButton = await screen.findByRole('button', { name: /Create Contact/i });
    await user.click(createContactButton);

    expect(mockNavigate).toHaveBeenCalledWith('/contacts/create?accountId=acc-1');
  });
});
