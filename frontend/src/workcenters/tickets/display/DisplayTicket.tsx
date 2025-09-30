import { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DisplayTicket.css';

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

export interface DisplayTicketProps {
  tickets: Ticket[];
  accounts: Account[];
  contacts: Contact[];
}

export const DisplayTicket: FC<DisplayTicketProps> = ({ tickets, accounts, contacts }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const ticket = tickets.find(t => t.id === id);

  if (!ticket) {
    return (
      <div className="display-ticket">
        <div className="display-ticket__error">
          <h1 className="display-ticket__error-title">Ticket Not Found</h1>
          <p className="display-ticket__error-subtitle">
            The ticket with ID {id} could not be found.
          </p>
          <button 
            className="display-ticket__back-button"
            onClick={() => navigate('/tickets/search')}
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const account = accounts.find(acc => acc.id === parseInt(ticket.accountId, 10));
  const accountContacts = contacts.filter(contact => contact.accountId === ticket.accountId);
  const accountTickets = tickets.filter(t => t.accountId === ticket.accountId);
  const openTickets = accountTickets.filter(t => t.status !== 'closed');

  return (
    <div className="display-ticket">
      <div className="display-ticket__header">
        <div className="display-ticket__header-content">
          <div className="display-ticket__header-main">
            <h1 className="display-ticket__title">{ticket.title}</h1>
            <span className="display-ticket__id">ID: {ticket.id}</span>
          </div>
          <button 
            className="display-ticket__back-button"
            onClick={() => navigate('/tickets/search')}
          >
            Back to Search
          </button>
        </div>
        <div className="display-ticket__header-status">
          <span className={`display-ticket__status display-ticket__status--${ticket.status}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="display-ticket__account-section">
        <h2 className="display-ticket__section-title">Associated Account</h2>
        {account ? (
          <button 
            className="display-ticket__account-card"
            onClick={() => navigate(`/account/${account.id}`)}
            type="button"
          >
            <div className="display-ticket__account-name">{account.name}</div>
            <div className="display-ticket__account-industry">{account.industry}</div>
            <div className="display-ticket__account-link">View Account →</div>
          </button>
        ) : (
          <div className="display-ticket__empty">
            <p className="display-ticket__empty-text">Account not found</p>
          </div>
        )}
      </div>

      <div className="display-ticket__summary">
        <div className="display-ticket__summary-card">
          <div className="display-ticket__summary-value">{accountContacts.length}</div>
          <div className="display-ticket__summary-label">Account Contacts</div>
        </div>
        <div className="display-ticket__summary-card">
          <div className="display-ticket__summary-value">{accountTickets.length}</div>
          <div className="display-ticket__summary-label">Total Tickets</div>
        </div>
        <div className="display-ticket__summary-card">
          <div className="display-ticket__summary-value">{openTickets.length}</div>
          <div className="display-ticket__summary-label">Open Tickets</div>
        </div>
      </div>

      <div className="display-ticket__content">
        <section className="display-ticket__section">
          <h2 className="display-ticket__section-title">Account Contacts</h2>
          {accountContacts.length > 0 ? (
            <ul className="display-ticket__list">
              {accountContacts.map((contact) => (
                <li key={contact.id} className="display-ticket__list-item">
                  <button
                    className="display-ticket__contact-card"
                    onClick={() => navigate(`/contact/${contact.id}`)}
                    type="button"
                  >
                    <div className="display-ticket__contact-header">
                      <div className="display-ticket__contact-name">
                        {contact.fullName}
                      </div>
                    </div>
                    <div className="display-ticket__contact-email">
                      {contact.email}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="display-ticket__empty">
              <p className="display-ticket__empty-text">No contacts for this ticket's account</p>
            </div>
          )}
        </section>

        <section className="display-ticket__section">
          <h2 className="display-ticket__section-title">Other Account Tickets</h2>
          {accountTickets.filter(t => t.id !== ticket.id).length > 0 ? (
            <ul className="display-ticket__list">
              {accountTickets
                .filter(t => t.id !== ticket.id)
                .map((otherTicket) => (
                  <li key={otherTicket.id} className="display-ticket__list-item">
                    <button
                      className="display-ticket__ticket-card"
                      onClick={() => navigate(`/ticket/${otherTicket.id}`)}
                      type="button"
                    >
                      <div className="display-ticket__ticket-header">
                        <div className="display-ticket__ticket-title">
                          {otherTicket.title}
                        </div>
                        <span className={`display-ticket__ticket-status display-ticket__ticket-status--${otherTicket.status}`}>
                          {otherTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="display-ticket__empty">
              <p className="display-ticket__empty-text">No other tickets for this account</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
