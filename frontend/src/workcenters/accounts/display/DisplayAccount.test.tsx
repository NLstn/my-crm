import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { DisplayAccount } from './DisplayAccount';
import type { Account, Contact, Ticket } from './DisplayAccount';

const mockAccounts: Account[] = [
  { id: 1, name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 2, name: 'Globex', industry: 'Technology' },
];

const mockContacts: Contact[] = [
  { id: 'con-1', accountId: '1', fullName: 'Jane Doe', email: 'jane@acme.test' },
  { id: 'con-2', accountId: '1', fullName: 'John Smith', email: 'john@acme.test' },
  { id: 'con-3', accountId: '2', fullName: 'Mary Major', email: 'mary@globex.test' },
];

const mockTickets: Ticket[] = [
  { id: 'tic-1', accountId: '1', title: 'Onboarding call', status: 'open' },
  { id: 'tic-2', accountId: '1', title: 'Follow-up meeting', status: 'in_progress' },
  { id: 'tic-3', accountId: '2', title: 'Renewal contract review', status: 'closed' },
];

describe('DisplayAccount', () => {
  it('renders account details when account exists', () => {
    window.history.pushState({}, '', '/account/1');
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={mockAccounts}
                contacts={mockContacts}
                tickets={mockTickets}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('ID: 1')).toBeDefined();
    expect(screen.getByText('Manufacturing')).toBeDefined();
  });

  it('displays summary statistics correctly', () => {
    window.history.pushState({}, '', '/account/1');
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={mockAccounts}
                contacts={mockContacts}
                tickets={mockTickets}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );

    // Account 1 has 2 contacts, 2 tickets, 2 open
    const values = screen.getAllByText('2');
    expect(values.length).toBe(3); // Should show "2" three times in summary cards
    
    // Verify summary labels exist (case insensitive)
    expect(screen.getAllByText(/contacts/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Total Tickets')).toBeDefined();
    expect(screen.getByText('Open Tickets')).toBeDefined();
  });

  it('displays contacts for the account', () => {
    window.history.pushState({}, '', '/account/1');
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={mockAccounts}
                contacts={mockContacts}
                tickets={mockTickets}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Jane Doe')).toBeDefined();
    expect(screen.getByText('jane@acme.test')).toBeDefined();
    expect(screen.getByText('John Smith')).toBeDefined();
    expect(screen.getByText('john@acme.test')).toBeDefined();
  });

  it('displays tickets for the account', () => {
    window.history.pushState({}, '', '/account/1');
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={mockAccounts}
                contacts={mockContacts}
                tickets={mockTickets}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Onboarding call')).toBeDefined();
    expect(screen.getByText('Follow-up meeting')).toBeDefined();
  });

  it('displays ticket status badges', () => {
    window.history.pushState({}, '', '/account/1');
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={mockAccounts}
                contacts={mockContacts}
                tickets={mockTickets}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('open')).toBeDefined();
    expect(screen.getByText('in progress')).toBeDefined();
  });

  it('shows error message when account does not exist', () => {
    window.history.pushState({}, '', '/account/999');
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={mockAccounts}
                contacts={mockContacts}
                tickets={mockTickets}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Account Not Found')).toBeDefined();
    expect(screen.getByText(/The account with ID 999 could not be found/)).toBeDefined();
  });

  it('shows empty state when account has no contacts', () => {
    window.history.pushState({}, '', '/account/3');
    
    const accountsWithNoContacts = [
      { id: 3, name: 'Test Corp', industry: 'Testing' },
    ];
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={accountsWithNoContacts}
                contacts={[]}
                tickets={[]}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('No contacts for this account')).toBeDefined();
  });

  it('shows empty state when account has no tickets', () => {
    window.history.pushState({}, '', '/account/3');
    
    const accountsWithNoTickets = [
      { id: 3, name: 'Test Corp', industry: 'Testing' },
    ];
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={accountsWithNoTickets}
                contacts={[]}
                tickets={[]}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('No tickets for this account')).toBeDefined();
  });

  it('has a back button that is clickable', async () => {
    const user = userEvent.setup();
    
    window.history.pushState({}, '', '/account/1');
    
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/account/:id"
            element={
              <DisplayAccount
                accounts={mockAccounts}
                contacts={mockContacts}
                tickets={mockTickets}
              />
            }
          />
          <Route path="/accounts/search" element={<div>Search Page</div>} />
        </Routes>
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /back to search/i });
    expect(backButton).toBeDefined();
    
    await act(async () => {
      await user.click(backButton);
    });
    
    // After clicking, we should navigate to search page
    expect(screen.getByText('Search Page')).toBeDefined();
  });
});
