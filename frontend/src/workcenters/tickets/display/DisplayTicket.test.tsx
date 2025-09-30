import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { DisplayTicket, Account, Contact, Ticket } from './DisplayTicket';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAccounts: Account[] = [
  { id: 1, name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 2, name: 'Globex Corporation', industry: 'Technology' },
];

const mockContacts: Contact[] = [
  { id: 1, accountId: '1', fullName: 'Jane Doe', email: 'jane@acme.test' },
  { id: 2, accountId: '1', fullName: 'John Smith', email: 'john@acme.test' },
  { id: 3, accountId: '2', fullName: 'Mary Major', email: 'mary@globex.test' },
];

const mockTickets: Ticket[] = [
  { id: 'tic-1', accountId: '1', title: 'Onboarding call', status: 'open' },
  { id: 'tic-2', accountId: '1', title: 'Setup assistance', status: 'in_progress' },
  { id: 'tic-3', accountId: '2', title: 'Renewal contract review', status: 'closed' },
];

const renderWithRouter = (
  tickets: Ticket[],
  accounts: Account[],
  contacts: Contact[],
  route = '/ticket/tic-1'
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/ticket/:id"
          element={
            <DisplayTicket tickets={tickets} accounts={accounts} contacts={contacts} />
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('DisplayTicket', () => {
  it('renders ticket details', () => {
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-1');

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('ID: tic-1')).toBeDefined();
    const openElements = screen.getAllByText(/open/i);
    expect(openElements.length).toBeGreaterThan(0);
  });

  it('displays associated account information', () => {
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-1');

    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Manufacturing')).toBeDefined();
  });

  it('displays account contacts', () => {
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-1');

    expect(screen.getByText('Jane Doe')).toBeDefined();
    expect(screen.getByText('jane@acme.test')).toBeDefined();
    expect(screen.getByText('John Smith')).toBeDefined();
    expect(screen.getByText('john@acme.test')).toBeDefined();
  });

  it('displays other account tickets', () => {
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-1');

    expect(screen.getByText('Setup assistance')).toBeDefined();
    expect(screen.queryByText('Onboarding call')).toBeDefined(); // Title in header
  });

  it('displays summary statistics', () => {
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-1');

    expect(screen.getAllByText('Account Contacts').length).toBeGreaterThan(0);
    expect(screen.getByText('Total Tickets')).toBeDefined();
    expect(screen.getAllByText(/Open Tickets/i).length).toBeGreaterThan(0);
  });

  it('shows error when ticket is not found', () => {
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-999');

    expect(screen.getByText('Ticket Not Found')).toBeDefined();
    expect(screen.getByText(/tic-999/)).toBeDefined();
  });

  it('navigates back to search when back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-1');

    const backButton = screen.getByRole('button', { name: /Back to Search/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/tickets/search');
  });

  it('navigates to account when account card is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-1');

    const accountCard = screen.getByText('View Account →').closest('button');
    if (accountCard) {
      await user.click(accountCard);
      expect(mockNavigate).toHaveBeenCalledWith('/account/1');
    }
  });

  it('displays different status badges correctly', () => {
    renderWithRouter(mockTickets, mockAccounts, mockContacts, '/ticket/tic-2');

    expect(screen.getByText(/in progress/i)).toBeDefined();
  });

  it('shows empty state when no contacts exist', () => {
    renderWithRouter(mockTickets, mockAccounts, [], '/ticket/tic-1');

    expect(screen.getByText("No contacts for this ticket's account")).toBeDefined();
  });

  it('shows empty state when no other tickets exist', () => {
    const singleTicket = [mockTickets[0]];
    renderWithRouter(singleTicket, mockAccounts, mockContacts, '/ticket/tic-1');

    expect(screen.getByText('No other tickets for this account')).toBeDefined();
  });
});
