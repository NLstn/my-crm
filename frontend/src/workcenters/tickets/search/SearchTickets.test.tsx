import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { SearchTickets } from './SearchTickets';
import type { Account, Ticket } from '../../../types';
import { accountsApi, ticketsApi } from '../../../api';

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
  },
  contactsApi: {
    getByAccount: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
  },
}));

const accountsApiMock = vi.mocked(accountsApi);
const ticketsApiMock = vi.mocked(ticketsApi);

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
  displayId: overrides.displayId ?? 1,
  accountId: overrides.accountId ?? 'acc-1',
  contactId: overrides.contactId ?? 'con-1',
  title: overrides.title ?? 'Onboarding call',
  status: overrides.status ?? 'open',
  createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
  updatedAt: overrides.updatedAt ?? '2024-01-01T00:00:00Z',
});

const mockAccounts: Account[] = [
  buildAccount({ id: 'acc-1', displayId: 'ACC-1', name: 'Acme Corp' }),
  buildAccount({ id: 'acc-2', displayId: 'ACC-2', name: 'Globex Corporation', industry: 'Technology' }),
  buildAccount({ id: 'acc-3', displayId: 'ACC-3', name: 'Initech', industry: 'Software' }),
];

const mockTicketsByAccount: Record<string, Ticket[]> = {
  'acc-1': [
    buildTicket({ id: 'tic-1', displayId: 1, accountId: 'acc-1', contactId: 'con-1', title: 'Onboarding call', status: 'open' }),
    buildTicket({ id: 'tic-2', displayId: 2, accountId: 'acc-1', contactId: 'con-2', title: 'Setup assistance', status: 'in_progress' }),
  ],
  'acc-2': [
    buildTicket({ id: 'tic-3', displayId: 3, accountId: 'acc-2', contactId: 'con-3', title: 'Renewal contract review', status: 'closed' }),
  ],
  'acc-3': [
    buildTicket({ id: 'tic-4', displayId: 4, accountId: 'acc-3', contactId: 'con-4', title: 'Technical support needed', status: 'open' }),
  ],
};

const renderComponent = async () => {
  render(
    <BrowserRouter>
      <SearchTickets />
    </BrowserRouter>
  );

  await waitFor(() => expect(accountsApiMock.search).toHaveBeenCalled());
  await waitFor(() => expect(ticketsApiMock.getByAccount).toHaveBeenCalled());

  await screen.findByText('Search Tickets');
};

beforeEach(() => {
  vi.clearAllMocks();

  accountsApiMock.search.mockResolvedValue(mockAccounts);
  ticketsApiMock.getByAccount.mockImplementation(async (accountId: string) => mockTicketsByAccount[accountId] ?? []);
});

describe('SearchTickets', () => {
  it('renders the search tickets page', async () => {
    await renderComponent();

    expect(screen.getByText('Search Tickets')).toBeDefined();
    expect(screen.getByLabelText(/Ticket Title/i)).toBeDefined();
    expect(screen.getByLabelText(/Status/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create New Ticket/i })).toBeDefined();
  });

  it('displays all tickets initially', async () => {
    await renderComponent();

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('Setup assistance')).toBeDefined();
    expect(screen.getByText('Renewal contract review')).toBeDefined();
    expect(screen.getByText('Technical support needed')).toBeDefined();
    expect(screen.getByText('Results (4)')).toBeDefined();
  });

  it('filters tickets by title', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const titleInput = screen.getByLabelText(/Ticket Title/i);
    await user.type(titleInput, 'onboarding');

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.queryByText('Setup assistance')).toBeNull();
    expect(screen.getByText('Results (1)')).toBeDefined();
  });

  it('filters tickets by status', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const statusSelect = screen.getByLabelText(/Status/i) as HTMLSelectElement;
    await user.selectOptions(statusSelect, 'open');

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('Technical support needed')).toBeDefined();
    expect(screen.queryByText('Setup assistance')).toBeNull();
    expect(screen.queryByText('Renewal contract review')).toBeNull();
    expect(screen.getByText('Results (2)')).toBeDefined();
  });

  it('filters tickets by both title and status', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const titleInput = screen.getByLabelText(/Ticket Title/i);
    const statusSelect = screen.getByLabelText(/Status/i) as HTMLSelectElement;

    await user.type(titleInput, 'support');
    await user.selectOptions(statusSelect, 'open');

    expect(screen.getByText('Technical support needed')).toBeDefined();
    expect(screen.queryByText('Onboarding call')).toBeNull();
    expect(screen.getByText('Results (1)')).toBeDefined();
  });

  it('shows empty state when no tickets match filters', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const titleInput = screen.getByLabelText(/Ticket Title/i);
    await user.type(titleInput, 'nonexistent ticket');

    expect(screen.getByText('No tickets found')).toBeDefined();
    expect(screen.getByText('Try adjusting your search criteria')).toBeDefined();
    expect(screen.getByText('Results (0)')).toBeDefined();
  });

  it('shows empty state when no tickets exist', async () => {
    accountsApiMock.search.mockResolvedValue(mockAccounts);
    ticketsApiMock.getByAccount.mockResolvedValue([]);

    await renderComponent();

    expect(screen.getByText('No tickets available')).toBeDefined();
    expect(screen.getByText('Create your first ticket to get started')).toBeDefined();
  });

  it('navigates to ticket detail when ticket card is clicked', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const ticketCard = screen.getByText('Onboarding call').closest('button');
    if (ticketCard) {
      await user.click(ticketCard);
      expect(mockNavigate).toHaveBeenCalledWith('/ticket/tic-1');
    }
  });

  it('navigates to create ticket page when create button is clicked', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const createButton = screen.getByRole('button', { name: /Create New Ticket/i });
    await user.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/tickets/create');
  });

  it('displays account names for each ticket', async () => {
    await renderComponent();

    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
    expect(screen.getByText('Globex Corporation')).toBeDefined();
    expect(screen.getByText('Initech')).toBeDefined();
  });

  it('displays ticket IDs', async () => {
    await renderComponent();

    expect(screen.getByText('ID: 1')).toBeDefined();
    expect(screen.getByText('ID: 2')).toBeDefined();
    expect(screen.getByText('ID: 3')).toBeDefined();
    expect(screen.getByText('ID: 4')).toBeDefined();
  });

  it('displays status badges correctly', async () => {
    await renderComponent();

    const statusBadges = screen.getAllByText(/open|in progress|closed/i);
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('is case-insensitive when filtering by title', async () => {
    const user = userEvent.setup();
    await renderComponent();

    const titleInput = screen.getByLabelText(/Ticket Title/i);
    await user.type(titleInput, 'ONBOARDING');

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('Results (1)')).toBeDefined();
  });
});
