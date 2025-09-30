import { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DisplayContact.css';

export interface Account {
  id: number;
  name: string;
  industry: string;
}

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

export interface DisplayContactProps {
  contacts: Contact[];
  accounts: Account[];
  tickets: Ticket[];
}

export const DisplayContact: FC<DisplayContactProps> = ({ contacts, accounts, tickets }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const contactId = id ? parseInt(id, 10) : null;
  const contact = contacts.find(cont => cont.id === contactId);

  if (!contact) {
    return (
      <div className="display-contact">
        <div className="display-contact__error">
          <h1 className="display-contact__error-title">Contact Not Found</h1>
          <p className="display-contact__error-subtitle">
            The contact with ID {id} could not be found.
          </p>
          <button 
            className="display-contact__back-button"
            onClick={() => navigate('/contacts/search')}
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const account = accounts.find(acc => acc.id === parseInt(contact.accountId, 10));
  const accountTickets = tickets.filter(ticket => ticket.accountId === contact.accountId);
  const openTickets = accountTickets.filter(ticket => ticket.status !== 'closed');

  return (
    <div className="display-contact">
      <div className="display-contact__header">
        <div className="display-contact__header-content">
          <div className="display-contact__header-main">
            <h1 className="display-contact__title">{contact.fullName}</h1>
            <span className="display-contact__id">ID: {contact.id}</span>
          </div>
          <button 
            className="display-contact__back-button"
            onClick={() => navigate('/contacts/search')}
          >
            Back to Search
          </button>
        </div>
        <p className="display-contact__email">{contact.email}</p>
      </div>

      <div className="display-contact__account-section">
        <h2 className="display-contact__section-title">Associated Account</h2>
        {account ? (
          <button 
            className="display-contact__account-card"
            onClick={() => navigate(`/account/${account.id}`)}
            type="button"
          >
            <div className="display-contact__account-name">{account.name}</div>
            <div className="display-contact__account-industry">{account.industry}</div>
            <div className="display-contact__account-link">View Account →</div>
          </button>
        ) : (
          <div className="display-contact__empty">
            <p className="display-contact__empty-text">Account not found</p>
          </div>
        )}
      </div>

      <div className="display-contact__summary">
        <div className="display-contact__summary-card">
          <div className="display-contact__summary-value">{accountTickets.length}</div>
          <div className="display-contact__summary-label">Account Tickets</div>
        </div>
        <div className="display-contact__summary-card">
          <div className="display-contact__summary-value">{openTickets.length}</div>
          <div className="display-contact__summary-label">Open Tickets</div>
        </div>
      </div>

      <div className="display-contact__content">
        <section className="display-contact__section">
          <h2 className="display-contact__section-title">Account Tickets</h2>
          {accountTickets.length > 0 ? (
            <ul className="display-contact__list">
              {accountTickets.map((ticket) => (
                <li key={ticket.id} className="display-contact__list-item">
                  <div className="display-contact__ticket-card">
                    <div className="display-contact__ticket-header">
                      <div className="display-contact__ticket-title">
                        {ticket.title}
                      </div>
                      <span className={`display-contact__ticket-status display-contact__ticket-status--${ticket.status}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="display-contact__empty">
              <p className="display-contact__empty-text">No tickets for this contact's account</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
