import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { SearchTickets, Account, Ticket } from './SearchTickets';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAccounts: Account[] = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Globex Corporation' },
  { id: 3, name: 'Initech' },
];

const mockTickets: Ticket[] = [
  { id: 'tic-1', accountId: '1', title: 'Onboarding call', status: 'open' },
  { id: 'tic-2', accountId: '1', title: 'Setup assistance', status: 'in_progress' },
  { id: 'tic-3', accountId: '2', title: 'Renewal contract review', status: 'closed' },
  { id: 'tic-4', accountId: '3', title: 'Technical support needed', status: 'open' },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SearchTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search tickets page', () => {
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    expect(screen.getByText('Search Tickets')).toBeDefined();
    expect(screen.getByLabelText(/Ticket Title/i)).toBeDefined();
    expect(screen.getByLabelText(/Status/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create New Ticket/i })).toBeDefined();
  });

  it('displays all tickets initially', () => {
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('Setup assistance')).toBeDefined();
    expect(screen.getByText('Renewal contract review')).toBeDefined();
    expect(screen.getByText('Technical support needed')).toBeDefined();
    expect(screen.getByText('Results (4)')).toBeDefined();
  });

  it('filters tickets by title', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    const titleInput = screen.getByLabelText(/Ticket Title/i);
    await user.type(titleInput, 'onboarding');

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.queryByText('Setup assistance')).toBeNull();
    expect(screen.getByText('Results (1)')).toBeDefined();
  });

  it('filters tickets by status', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

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
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

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
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    const titleInput = screen.getByLabelText(/Ticket Title/i);
    await user.type(titleInput, 'nonexistent ticket');

    expect(screen.getByText('No tickets found')).toBeDefined();
    expect(screen.getByText('Try adjusting your search criteria')).toBeDefined();
    expect(screen.getByText('Results (0)')).toBeDefined();
  });

  it('shows empty state when no tickets exist', () => {
    renderWithRouter(
      <SearchTickets tickets={[]} accounts={mockAccounts} />
    );

    expect(screen.getByText('No tickets available')).toBeDefined();
    expect(screen.getByText('Create your first ticket to get started')).toBeDefined();
  });

  it('navigates to ticket detail when ticket card is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    const ticketCard = screen.getByText('Onboarding call').closest('button');
    if (ticketCard) {
      await user.click(ticketCard);
      expect(mockNavigate).toHaveBeenCalledWith('/ticket/tic-1');
    }
  });

  it('navigates to create ticket page when create button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    const createButton = screen.getByRole('button', { name: /Create New Ticket/i });
    await user.click(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('/tickets/create');
  });

  it('displays account names for each ticket', () => {
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0);
    expect(screen.getByText('Globex Corporation')).toBeDefined();
    expect(screen.getByText('Initech')).toBeDefined();
  });

  it('displays ticket IDs', () => {
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    expect(screen.getByText('ID: tic-1')).toBeDefined();
    expect(screen.getByText('ID: tic-2')).toBeDefined();
    expect(screen.getByText('ID: tic-3')).toBeDefined();
    expect(screen.getByText('ID: tic-4')).toBeDefined();
  });

  it('displays status badges correctly', () => {
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    const statusBadges = screen.getAllByText(/open|in progress|closed/i);
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('is case-insensitive when filtering by title', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <SearchTickets tickets={mockTickets} accounts={mockAccounts} />
    );

    const titleInput = screen.getByLabelText(/Ticket Title/i);
    await user.type(titleInput, 'ONBOARDING');

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('Results (1)')).toBeDefined();
  });
});
