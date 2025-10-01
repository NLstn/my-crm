import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { DisplayContact } from './DisplayContact';
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
  contactsApi: {
    getByAccount: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
  },
  ticketsApi: {
    getByAccount: vi.fn(),
    create: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);
const contactsApiMock = vi.mocked(contactsApi);
const ticketsApiMock = vi.mocked(ticketsApi);

const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  id: overrides.id ?? '1',
  displayId: overrides.displayId ?? 'ACC-1',
  name: overrides.name ?? 'Acme Corp',
  industry: overrides.industry ?? 'Manufacturing',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const buildContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: overrides.id ?? '1',
  accountId: overrides.accountId ?? '1',
  fullName: overrides.fullName ?? 'John Doe',
  email: overrides.email ?? 'john.doe@acme.com',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const buildTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: overrides.id ?? '1',
  accountId: overrides.accountId ?? '1',
  title: overrides.title ?? 'Issue with product',
  status: overrides.status ?? 'open',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const mockAccounts: Account[] = [
  buildAccount({ id: '1', displayId: 'ACC-1', name: 'Acme Corp', industry: 'Manufacturing' }),
  buildAccount({ id: '2', displayId: 'ACC-2', name: 'Globex Corporation', industry: 'Technology' }),
];

const renderWithRouter = async (contactId = '1') => {
  render(
    <MemoryRouter initialEntries={[`/contact/${contactId}`]}>
      <Routes>
        <Route path="/contact/:id" element={<DisplayContact />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(accountsApiMock.search).toHaveBeenCalled());
};

beforeEach(() => {
  vi.clearAllMocks();

  accountsApiMock.search.mockResolvedValue(mockAccounts);

  contactsApiMock.getByAccount.mockImplementation(async (accountId: string) => {
    if (accountId === '1') {
      return [
        buildContact({ id: '1', accountId: '1', fullName: 'John Doe', email: 'john.doe@acme.com' }),
      ];
    }

    if (accountId === '2') {
      return [
        buildContact({ id: '2', accountId: '2', fullName: 'Jane Smith', email: 'jane.smith@globex.com' }),
      ];
    }

    return [];
  });

  ticketsApiMock.getByAccount.mockImplementation(async (accountId: string) => {
    if (accountId === '1') {
      return [
        buildTicket({ id: '1', accountId: '1', title: 'Issue with product', status: 'open' }),
        buildTicket({ id: '2', accountId: '1', title: 'Feature request', status: 'in_progress' }),
        buildTicket({ id: '3', accountId: '1', title: 'Bug report', status: 'closed' }),
      ];
    }

    if (accountId === '2') {
      return [
        buildTicket({ id: '4', accountId: '2', title: 'Support needed', status: 'open' }),
      ];
    }

    return [];
  });
});

describe('DisplayContact', () => {
  it('renders contact information', async () => {
    await renderWithRouter('1');

    expect(await screen.findByText('John Doe')).toBeDefined();
    expect(screen.getByText('john.doe@acme.com')).toBeDefined();
    expect(screen.getByText('ID: 1')).toBeDefined();
  });

  it('displays associated account information', async () => {
    await renderWithRouter('1');

    expect(await screen.findByText('Associated Account')).toBeDefined();
    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Manufacturing')).toBeDefined();
  });

  it('displays summary statistics', async () => {
    await renderWithRouter('1');

    const summaryLabels = await screen.findAllByText('Account Tickets');
    expect(summaryLabels.length).toBeGreaterThan(0);

    const totalTickets = screen.getAllByText('3');
    expect(totalTickets.length).toBeGreaterThan(0);

    const openTickets = screen.getAllByText('2');
    expect(openTickets.length).toBeGreaterThan(0);
  });

  it('displays account tickets', async () => {
    await renderWithRouter('1');

    expect(await screen.findByText('Issue with product')).toBeDefined();
    expect(screen.getByText('Feature request')).toBeDefined();
    expect(screen.getByText('Bug report')).toBeDefined();
  });

  it('displays ticket status badges', async () => {
    await renderWithRouter('1');

    expect(await screen.findByText('open')).toBeDefined();
    expect(screen.getByText('in progress')).toBeDefined();
    expect(screen.getByText('closed')).toBeDefined();
  });

  it('shows error when contact is not found', async () => {
    contactsApiMock.getByAccount.mockResolvedValue([]);

    await renderWithRouter('999');

    const errorMessages = await screen.findAllByText(/contact not found/i);
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it('shows empty state when no tickets exist', async () => {
    ticketsApiMock.getByAccount.mockResolvedValue([]);

    await renderWithRouter('1');

    expect(await screen.findByText("No tickets for this contact's account")).toBeDefined();
  });

  it('navigates back to search when back button is clicked', async () => {
    const user = userEvent.setup();
    await renderWithRouter('1');

    const backButton = await screen.findByRole('button', { name: /Back to Search/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/contacts/search');
  });

  it('navigates to account when account card is clicked', async () => {
    const user = userEvent.setup();
    await renderWithRouter('1');

    const accountCard = await screen.findByRole('button', { name: /View Account/i });
    await user.click(accountCard);

    expect(mockNavigate).toHaveBeenCalledWith('/account/1');
  });

  it('displays correct statistics for different contacts', async () => {
    await renderWithRouter('2');

    expect(await screen.findByText('Jane Smith')).toBeDefined();

    const ticketCounts = screen.getAllByText('1');
    expect(ticketCounts.length).toBeGreaterThan(0);
  });
});
