import { FC, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { accountsApi, ticketsApi } from '../../../api';
import { Account, Ticket } from '../../../types';
import './SearchTickets.css';

export const SearchTickets: FC = () => {
  const [searchTitle, setSearchTitle] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const accountsData = await accountsApi.search();
        setAccounts(accountsData);
        
        // Fetch tickets for all accounts
        const ticketsPromises = accountsData.map((account: Account) => 
          ticketsApi.getByAccount(account.id)
        );
        const ticketsArrays = await Promise.all(ticketsPromises);
        const allTickets = ticketsArrays.flat();
        setTickets(allTickets);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (searchTitle.trim()) {
      const lowerSearchTitle = searchTitle.toLowerCase();
      result = result.filter(ticket =>
        ticket.title.toLowerCase().includes(lowerSearchTitle)
      );
    }

    if (searchStatus) {
      result = result.filter(ticket => ticket.status === searchStatus);
    }

    return result;
  }, [tickets, searchTitle, searchStatus]);

  const getAccountName = (accountId: string): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  if (loading) {
    return (
      <div className="search-tickets">
        <div className="search-tickets__loading">Loading tickets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-tickets">
        <div className="search-tickets__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="search-tickets">
      <div className="search-tickets__header">
        <div className="search-tickets__header-content">
          <div>
            <h1 className="search-tickets__title">Search Tickets</h1>
            <p className="search-tickets__subtitle">
              Find tickets by title or status
            </p>
          </div>
          <Button
            onClick={() => navigate('/tickets/create')}
          >
            Create New Ticket
          </Button>
        </div>
      </div>

      <div className="search-tickets__filters">
        <Input
          id="ticket-title"
          label="Ticket Title"
          placeholder="Search by ticket title..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
        />
        <div className="search-tickets__field">
          <label htmlFor="ticket-status" className="search-tickets__label">
            Status
          </label>
          <select
            id="ticket-status"
            className="search-tickets__select"
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="search-tickets__results">
        <div className="search-tickets__results-header">
          <h2 className="search-tickets__results-title">
            Results ({filteredTickets.length})
          </h2>
        </div>

        {filteredTickets.length > 0 ? (
          <ul className="search-tickets__list">
            {filteredTickets.map((ticket) => (
              <li key={ticket.id} className="search-tickets__list-item">
                <button 
                  className="search-tickets__ticket-card"
                  onClick={() => navigate(`/ticket/${ticket.id}`)}
                  type="button"
                >
                  <div className="search-tickets__ticket-header">
                    <h3 className="search-tickets__ticket-title">
                      {ticket.title}
                    </h3>
                    <span className={`search-tickets__ticket-status search-tickets__ticket-status--${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="search-tickets__ticket-details">
                    <span className="search-tickets__ticket-id">
                      ID: {ticket.displayId}
                    </span>
                    <span className="search-tickets__ticket-account">
                      {getAccountName(ticket.accountId)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="search-tickets__empty">
            {searchTitle.trim() || searchStatus ? (
              <>
                <p className="search-tickets__empty-title">No tickets found</p>
                <p className="search-tickets__empty-subtitle">
                  Try adjusting your search criteria
                </p>
              </>
            ) : (
              <>
                <p className="search-tickets__empty-title">No tickets available</p>
                <p className="search-tickets__empty-subtitle">
                  Create your first ticket to get started
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
