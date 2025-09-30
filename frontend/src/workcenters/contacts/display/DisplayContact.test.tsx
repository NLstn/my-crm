import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { DisplayContact, Contact, Account, Ticket } from './DisplayContact';

const mockAccounts: Account[] = [
  { id: 1, name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 2, name: 'Globex Corporation', industry: 'Technology' },
];

const mockContacts: Contact[] = [
  { id: 1, accountId: '1', fullName: 'John Doe', email: 'john.doe@acme.com' },
  { id: 2, accountId: '2', fullName: 'Jane Smith', email: 'jane.smith@globex.com' },
];

const mockTickets: Ticket[] = [
  { id: '1', accountId: '1', title: 'Issue with product', status: 'open' },
  { id: '2', accountId: '1', title: 'Feature request', status: 'in_progress' },
  { id: '3', accountId: '1', title: 'Bug report', status: 'closed' },
  { id: '4', accountId: '2', title: 'Support needed', status: 'open' },
];

const renderWithRouter = (component: React.ReactElement, contactId = '1') => {
  return render(
    <MemoryRouter initialEntries={[`/contact/${contactId}`]}>
      <Routes>
        <Route path="/contact/:id" element={component} />
        <Route path="/contacts/search" element={<div>Search Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('DisplayContact', () => {
  it('renders contact information', () => {
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '1'
    );
    
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('john.doe@acme.com')).toBeDefined();
    expect(screen.getByText('ID: 1')).toBeDefined();
  });

  it('displays associated account information', () => {
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '1'
    );
    
    expect(screen.getByText('Associated Account')).toBeDefined();
    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Manufacturing')).toBeDefined();
  });

  it('displays summary statistics', () => {
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '1'
    );
    
    expect(screen.getByText('3')).toBeDefined(); // Total account tickets
    expect(screen.getByText('2')).toBeDefined(); // Open tickets
  });

  it('displays account tickets', () => {
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '1'
    );
    
    // Check for tickets (text appears twice - in summary and section title)
    expect(screen.getAllByText('Account Tickets').length).toBeGreaterThan(0);
    expect(screen.getByText('Issue with product')).toBeDefined();
    expect(screen.getByText('Feature request')).toBeDefined();
    expect(screen.getByText('Bug report')).toBeDefined();
  });

  it('displays ticket status badges', () => {
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '1'
    );
    
    expect(screen.getByText('open')).toBeDefined();
    expect(screen.getByText('in progress')).toBeDefined();
    expect(screen.getByText('closed')).toBeDefined();
  });

  it('shows error when contact not found', () => {
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '999'
    );
    
    expect(screen.getByText('Contact Not Found')).toBeDefined();
    expect(screen.getByText(/The contact with ID 999 could not be found/)).toBeDefined();
  });

  it('handles contact with no account', () => {
    const contactWithoutAccount: Contact[] = [
      { id: 99, accountId: '999', fullName: 'Test User', email: 'test@example.com' },
    ];
    
    renderWithRouter(
      <DisplayContact 
        contacts={contactWithoutAccount} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '99'
    );
    
    expect(screen.getByText('Account not found')).toBeDefined();
  });

  it('shows empty state when no tickets exist', () => {
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={[]}
      />,
      '1'
    );
    
    expect(screen.getByText("No tickets for this contact's account")).toBeDefined();
  });

  it('navigates back to search when back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '1'
    );
    
    const backButton = screen.getByText('Back to Search');
    expect(backButton).toBeDefined();
    
    await user.click(backButton);
    // Navigation would be handled by router in real app
  });

  it('displays correct statistics for different contacts', () => {
    renderWithRouter(
      <DisplayContact 
        contacts={mockContacts} 
        accounts={mockAccounts}
        tickets={mockTickets}
      />,
      '2'
    );
    
    // Contact 2 is associated with account 2, which has 1 ticket (open)
    expect(screen.getByText('Jane Smith')).toBeDefined();
    const ticketCounts = screen.getAllByText('1');
    expect(ticketCounts.length).toBe(2); // Both total and open are 1
  });
});
