import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsApi, contactsApi, ticketsApi } from '../../../api';
import type { Account, Contact, Ticket } from '../../../types';
import './DisplayTicket.css';

export type DisplayTicketProps = Record<string, never>;

export const DisplayTicket: FC<DisplayTicketProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('No ticket ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all accounts and their tickets to find this ticket
        const accounts = await accountsApi.search();
        
        let foundTicket = null;
        let foundAccount = null;
        
        for (const acc of accounts) {
          try {
            const ticketsData = await ticketsApi.getByAccount(acc.id);
            const match = ticketsData.find(t => t.id === id);
            if (match) {
              foundTicket = match;
              foundAccount = acc;
              break;
            }
          } catch (err) {
            console.error(`Error fetching tickets for account ${acc.id}:`, err);
          }
        }

        if (!foundTicket || !foundAccount) {
          setError('Ticket not found');
          setIsLoading(false);
          return;
        }

        setTicket(foundTicket);
        setAccount(foundAccount);

        // Fetch contacts and all tickets for the account
        const [contactsData, allTicketsData] = await Promise.all([
          contactsApi.getByAccount(foundAccount.id),
          ticketsApi.getByAccount(foundAccount.id)
        ]);
        
        setContacts(contactsData);
        setTickets(allTicketsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticket');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || !account || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updatedTicket = await ticketsApi.updateStatus(account.id, ticket.id, newStatus);
      setTicket(updatedTicket);
      
      // Update the ticket in the tickets list as well
      setTickets(prevTickets => 
        prevTickets.map(t => t.id === updatedTicket.id ? updatedTicket : t)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update ticket status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="display-ticket">
        <div className="display-ticket__loading">
          <p>Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="display-ticket">
        <div className="display-ticket__error">
          <h1 className="display-ticket__error-title">{error || 'Ticket Not Found'}</h1>
          <p className="display-ticket__error-subtitle">
            {error || `The ticket with ID ${id} could not be found.`}
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

  return (
    <div className="display-ticket">
      <div className="display-ticket__header">
        <div className="display-ticket__header-content">
          <div className="display-ticket__header-main">
            <h1 className="display-ticket__title">{ticket.title}</h1>
            <span className="display-ticket__id">ID: {ticket.displayId}</span>
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
          <div className="display-ticket__status-buttons">
            {ticket.status !== 'open' && (
              <button
                className="display-ticket__status-button"
                onClick={() => handleStatusChange('open')}
                disabled={isUpdatingStatus}
                type="button"
              >
                Mark as Open
              </button>
            )}
            {ticket.status !== 'in_progress' && (
              <button
                className="display-ticket__status-button"
                onClick={() => handleStatusChange('in_progress')}
                disabled={isUpdatingStatus}
                type="button"
              >
                Mark as In Progress
              </button>
            )}
            {ticket.status !== 'closed' && (
              <button
                className="display-ticket__status-button"
                onClick={() => handleStatusChange('closed')}
                disabled={isUpdatingStatus}
                type="button"
              >
                Mark as Closed
              </button>
            )}
          </div>
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

      <div className="display-ticket__content">
        <section className="display-ticket__section">
          <h2 className="display-ticket__section-title">Account Contacts</h2>
          {contacts.length > 0 ? (
            <ul className="display-ticket__list">
              {contacts.map((contact) => (
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
              <p className="display-ticket__empty-text">No contacts for this ticket&apos;s account</p>
            </div>
          )}
        </section>

        <section className="display-ticket__section">
          <h2 className="display-ticket__section-title">Other Account Tickets</h2>
          {tickets.filter(t => t.id !== ticket.id).length > 0 ? (
            <ul className="display-ticket__list">
              {tickets
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
