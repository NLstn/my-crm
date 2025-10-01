import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { Account } from '../../../types';
import { accountsApi } from '../../../api';
import './SearchAccounts.css';

export interface SearchAccountsProps {}

export const SearchAccounts: FC<SearchAccountsProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadAccounts = async (query: string = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await accountsApi.search(query);
      setAccounts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSearch = () => {
    loadAccounts(searchQuery);
  };

  return (
    <div className="search-accounts">
      <div className="search-accounts__header">
        <div className="search-accounts__header-content">
          <div>
            <h1 className="search-accounts__title">Search Accounts</h1>
            <p className="search-accounts__subtitle">
              Find accounts by name
            </p>
          </div>
          <Button
            onClick={() => navigate('/accounts/create')}
          >
            Create New Account
          </Button>
        </div>
      </div>

      <div className="search-accounts__filters">
        <Input
          id="search-query"
          label="Search"
          placeholder="Search by name, industry, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="search-accounts__results">
        <div className="search-accounts__results-header">
          <h2 className="search-accounts__results-title">
            Results ({accounts.length})
          </h2>
        </div>

        {error ? (
          <div className="search-accounts__error">
            <p className="search-accounts__error-title">Error</p>
            <p className="search-accounts__error-subtitle">{error}</p>
            <Button onClick={() => loadAccounts()}>Retry</Button>
          </div>
        ) : isLoading ? (
          <div className="search-accounts__loading">
            <p>Loading accounts...</p>
          </div>
        ) : accounts.length > 0 ? (
          <ul className="search-accounts__list">
            {accounts.map((account) => (
              <li key={account.id} className="search-accounts__list-item">
                <button 
                  className="search-accounts__account-card"
                  onClick={() => navigate(`/account/${account.id}`)}
                  type="button"
                >
                  <div className="search-accounts__account-header">
                    <h3 className="search-accounts__account-name">
                      {account.name}
                    </h3>
                    <span className="search-accounts__account-id">{account.displayId}</span>
                  </div>
                  <div className="search-accounts__account-details">
                    <span className="search-accounts__account-industry">
                      {account.industry || 'No industry specified'}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="search-accounts__empty">
            {searchQuery.trim() ? (
              <>
                <p className="search-accounts__empty-title">No accounts found</p>
                <p className="search-accounts__empty-subtitle">
                  Try adjusting your search criteria
                </p>
              </>
            ) : (
              <>
                <p className="search-accounts__empty-title">No accounts available</p>
                <p className="search-accounts__empty-subtitle">
                  Create your first account to get started
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
