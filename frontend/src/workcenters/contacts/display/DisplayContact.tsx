import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsApi, contactsApi, ticketsApi } from '../../../api';
import type { Account, Ticket } from '../../../types';
import './DisplayContact.css';

export type DisplayContactProps = Record<string, never>;

export const DisplayContact: FC<DisplayContactProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<{ id: string; accountId: string; fullName: string; email: string } | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('No contact ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // For now, we need to fetch all accounts and their contacts to find this contact
        // In a real app, you'd have a GET /contacts/{id} endpoint
        const accounts = await accountsApi.search();
        
        let foundContact = null;
        let foundAccount = null;
        
        for (const acc of accounts) {
          try {
            const contacts = await contactsApi.getByAccount(acc.id);
            const match = contacts.find(c => c.id === id);
            if (match) {
              foundContact = match;
              foundAccount = acc;
              break;
            }
          } catch (err) {
            // Continue searching other accounts
            console.error(`Error fetching contacts for account ${acc.id}:`, err);
          }
        }

        if (!foundContact || !foundAccount) {
          setError('Contact not found');
          setIsLoading(false);
          return;
        }

        setContact(foundContact);
        setAccount(foundAccount);

        // Fetch tickets for the account
        const ticketsData = await ticketsApi.getByAccount(foundAccount.id);
        setTickets(ticketsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="display-contact">
        <div className="display-contact__loading">
          <p>Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="display-contact">
        <div className="display-contact__error">
          <h1 className="display-contact__error-title">{error || 'Contact Not Found'}</h1>
          <p className="display-contact__error-subtitle">
            {error || `The contact with ID ${id} could not be found.`}
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

  const openTickets = tickets.filter(ticket => ticket.status !== 'closed');

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
          <div className="display-contact__summary-value">{tickets.length}</div>
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
          {tickets.length > 0 ? (
            <ul className="display-contact__list">
              {tickets.map((ticket) => (
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
              <p className="display-contact__empty-text">No tickets for this contact&apos;s account</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
