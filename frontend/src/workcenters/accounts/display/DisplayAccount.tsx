import { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DisplayAccount.css';

export interface Contact {
  id: number;
  accountId: string;
  fullName: string;
  email: string;
}

export interface Ticket {
  id: string;
  accountId: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
}

export interface Account {
  id: number;
  name: string;
  industry: string;
}

export interface DisplayAccountProps {
  accounts: Account[];
  contacts: Contact[];
  tickets: Ticket[];
}

export const DisplayAccount: FC<DisplayAccountProps> = ({ accounts, contacts, tickets }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const accountId = id ? parseInt(id, 10) : null;
  const account = accounts.find(acc => acc.id === accountId);

  if (!account) {
    return (
      <div className="display-account">
        <div className="display-account__error">
          <h1 className="display-account__error-title">Account Not Found</h1>
          <p className="display-account__error-subtitle">
            The account with ID {id} could not be found.
          </p>
          <button 
            className="display-account__back-button"
            onClick={() => navigate('/accounts/search')}
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const accountContacts = contacts.filter(contact => contact.accountId === String(account.id));
  const accountTickets = tickets.filter(ticket => ticket.accountId === String(account.id));
  const openTickets = accountTickets.filter(ticket => ticket.status !== 'closed');

  return (
    <div className="display-account">
      <div className="display-account__header">
        <div className="display-account__header-content">
          <div className="display-account__header-main">
            <h1 className="display-account__title">{account.name}</h1>
            <span className="display-account__id">ID: {account.id}</span>
          </div>
          <button 
            className="display-account__back-button"
            onClick={() => navigate('/accounts/search')}
          >
            Back to Search
          </button>
        </div>
        <p className="display-account__industry">{account.industry}</p>
      </div>

      <div className="display-account__summary">
        <div className="display-account__summary-card">
          <div className="display-account__summary-value">{accountContacts.length}</div>
          <div className="display-account__summary-label">Contacts</div>
        </div>
        <div className="display-account__summary-card">
          <div className="display-account__summary-value">{accountTickets.length}</div>
          <div className="display-account__summary-label">Total Tickets</div>
        </div>
        <div className="display-account__summary-card">
          <div className="display-account__summary-value">{openTickets.length}</div>
          <div className="display-account__summary-label">Open Tickets</div>
        </div>
      </div>

      <div className="display-account__content">
        <section className="display-account__section">
          <h2 className="display-account__section-title">Contacts</h2>
          {accountContacts.length > 0 ? (
            <ul className="display-account__list">
              {accountContacts.map((contact) => (
                <li key={contact.id} className="display-account__list-item">
                  <div className="display-account__contact-card">
                    <div className="display-account__contact-name">
                      {contact.fullName}
                    </div>
                    <div className="display-account__contact-email">
                      {contact.email}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="display-account__empty">
              <p className="display-account__empty-text">No contacts for this account</p>
            </div>
          )}
        </section>

        <section className="display-account__section">
          <h2 className="display-account__section-title">Tickets</h2>
          {accountTickets.length > 0 ? (
            <ul className="display-account__list">
              {accountTickets.map((ticket) => (
                <li key={ticket.id} className="display-account__list-item">
                  <div className="display-account__ticket-card">
                    <div className="display-account__ticket-header">
                      <div className="display-account__ticket-title">
                        {ticket.title}
                      </div>
                      <span className={`display-account__ticket-status display-account__ticket-status--${ticket.status}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="display-account__empty">
              <p className="display-account__empty-text">No tickets for this account</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
