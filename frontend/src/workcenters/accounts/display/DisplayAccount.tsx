import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Account, Contact, Ticket } from '../../../types';
import { accountsApi, contactsApi, ticketsApi } from '../../../api';
import { Button, Card } from '../../../components';
import './DisplayAccount.css';

export type DisplayAccountProps = Record<string, never>;

export const DisplayAccount: FC<DisplayAccountProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccount = async () => {
      if (!id) {
        setError('No account ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch account, contacts, and tickets in parallel
        const [accountData, contactsData, ticketsData] = await Promise.all([
          accountsApi.getById(id),
          contactsApi.getByAccount(id),
          ticketsApi.getByAccount(id)
        ]);
        
        setAccount(accountData);
        setContacts(contactsData);
        setTickets(ticketsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account');
      } finally {
        setIsLoading(false);
      }
    };

    loadAccount();
  }, [id]);

  if (isLoading) {
    return (
      <div className="display-account">
        <div className="display-account__loading">
          <p>Loading account...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="display-account">
        <div className="display-account__error">
          <h1 className="display-account__error-title">{error || 'Account Not Found'}</h1>
          <p className="display-account__error-subtitle">
            {error || `The account with ID ${id} could not be found.`}
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

  const openTickets = tickets.filter(ticket => ticket.status !== 'closed');

  return (
    <div className="display-account">
      <div className="display-account__header">
        <div className="display-account__header-content">
          <div className="display-account__header-main">
            <h1 className="display-account__title">{account.name}</h1>
            <span className="display-account__id">{account.displayId}</span>
          </div>
          <button 
            className="display-account__back-button"
            onClick={() => navigate('/accounts/search')}
          >
            Back to Search
          </button>
        </div>
        <p className="display-account__industry">{account.industry || 'No industry specified'}</p>
      </div>

      <div className="display-account__summary">
        <Card variant="summary" className="display-account__summary-card">
          <div className="display-account__summary-value">{contacts.length}</div>
          <div className="display-account__summary-label">Contacts</div>
        </Card>
        <Card variant="summary" className="display-account__summary-card">
          <div className="display-account__summary-value">{tickets.length}</div>
          <div className="display-account__summary-label">Total Tickets</div>
        </Card>
        <Card variant="summary" className="display-account__summary-card">
          <div className="display-account__summary-value">{openTickets.length}</div>
          <div className="display-account__summary-label">Open Tickets</div>
        </Card>
      </div>

      <div className="display-account__content">
        <Card 
          variant="section" 
          className="display-account__section"
          title="Contacts"
          headerAction={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/contacts/create?accountId=${id}`)}
            >
              Create Contact
            </Button>
          }
        >
          {contacts.length > 0 ? (
            <ul className="display-account__list">
              {contacts.map((contact) => (
                <li key={contact.id} className="display-account__list-item">
                  <Card
                    variant="default"
                    className="display-account__contact-card"
                    onClick={() => navigate(`/contact/${contact.id}`)}
                  >
                    <div className="display-account__contact-header">
                      <div className="display-account__contact-name">
                        {contact.fullName}
                      </div>
                    </div>
                    <div className="display-account__contact-email">
                      {contact.email}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <div className="display-account__empty">
              <p className="display-account__empty-text">No contacts for this account</p>
            </div>
          )}
        </Card>

        <Card variant="section" className="display-account__section" title="Tickets">
          {tickets.length > 0 ? (
            <ul className="display-account__list">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="display-account__list-item">
                  <Card
                    variant="default"
                    className="display-account__ticket-card"
                    onClick={() => navigate(`/ticket/${ticket.id}`)}
                  >
                    <div className="display-account__ticket-header">
                      <div className="display-account__ticket-title">
                        {ticket.title}
                      </div>
                      <span className={`display-account__ticket-status display-account__ticket-status--${ticket.status}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <div className="display-account__empty">
              <p className="display-account__empty-text">No tickets for this account</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
