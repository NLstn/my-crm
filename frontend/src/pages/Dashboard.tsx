import { useMemo, useState } from 'react';
import '../App.css';

export type Account = {
  id: number;
  name: string;
  industry: string;
};

export type Contact = {
  id: number;
  accountId: string;
  fullName: string;
  email: string;
};

export type Ticket = {
  id: string;
  accountId: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
};

const sampleAccounts: Account[] = [
  { id: 1, name: 'Acme Corp', industry: 'Manufacturing' },
  { id: 2, name: 'Globex', industry: 'Technology' }
];

const sampleContacts: Contact[] = [
  { id: 1, accountId: '1', fullName: 'Jane Doe', email: 'jane@acme.test' },
  { id: 2, accountId: '1', fullName: 'John Smith', email: 'john@acme.test' },
  { id: 3, accountId: '2', fullName: 'Mary Major', email: 'mary@globex.test' }
];

const sampleTickets: Ticket[] = [
  { id: 'tic-1', accountId: '1', title: 'Onboarding call', status: 'open' },
  { id: 'tic-2', accountId: '2', title: 'Renewal contract review', status: 'in_progress' }
];

export function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const accountContacts = useMemo(
    () => sampleContacts.filter((contact) => contact.accountId === String(selectedAccountId)),
    [selectedAccountId]
  );

  const accountTickets = useMemo(
    () => sampleTickets.filter((ticket) => ticket.accountId === String(selectedAccountId)),
    [selectedAccountId]
  );

  const activeAccount = useMemo(
    () => sampleAccounts.find((account) => account.id === selectedAccountId) ?? null,
    [selectedAccountId]
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1>My CRM</h1>
        <p>Track accounts, their contacts, and support tickets.</p>
      </header>

      <main className="app__content">
        <section className="panel">
          <h2>Accounts</h2>
          <ul className="list">
            {sampleAccounts.map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  className={account.id === selectedAccountId ? 'list__item list__item--active' : 'list__item'}
                  onClick={() => setSelectedAccountId(account.id)}
                >
                  <span className="list__item-title">{account.name}</span>
                  <span className="list__item-subtitle">{account.industry}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Contacts</h2>
          {selectedAccountId ? (
            accountContacts.length ? (
              <ul className="list">
                {accountContacts.map((contact) => (
                  <li key={contact.id} className="list__item">
                    <span className="list__item-title">{contact.fullName}</span>
                    <span className="list__item-subtitle">{contact.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="placeholder">No contacts yet for this account.</p>
            )
          ) : (
            <p className="placeholder">Select an account to see contacts.</p>
          )}
        </section>

        <section className="panel">
          <h2>Tickets</h2>
          {selectedAccountId ? (
            accountTickets.length ? (
              <ul className="list">
                {accountTickets.map((ticket) => (
                  <li key={ticket.id} className={`list__item ticket ticket--${ticket.status}`}>
                    <span className="list__item-title">{ticket.title}</span>
                    <span className="ticket__status">{ticket.status.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="placeholder">No tickets yet for this account.</p>
            )
          ) : (
            <p className="placeholder">Select an account to see tickets.</p>
          )}
        </section>
      </main>

      <aside className="app__sidebar">
        {activeAccount ? (
          <div className="sidebar__card">
            <h3>{activeAccount.name}</h3>
            <p>Industry: {activeAccount.industry}</p>
            <p>Contacts: {accountContacts.length}</p>
            <p>Open tickets: {accountTickets.filter((ticket) => ticket.status !== 'closed').length}</p>
          </div>
        ) : (
          <p className="placeholder">Choose an account to see a quick summary.</p>
        )}
      </aside>
    </div>
  );
}

// Export sample data for use in other components
export { sampleAccounts, sampleContacts, sampleTickets };
