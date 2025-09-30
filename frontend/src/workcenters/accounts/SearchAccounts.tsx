import { FC, useState, useMemo } from 'react';
import './SearchAccounts.css';

export interface Account {
  id: string;
  name: string;
  industry: string;
}

export interface SearchAccountsProps {
  accounts: Account[];
}

export const SearchAccounts: FC<SearchAccountsProps> = ({ accounts }) => {
  const [searchName, setSearchName] = useState('');

  const filteredAccounts = useMemo(() => {
    if (!searchName.trim()) {
      return accounts;
    }

    const lowerSearchName = searchName.toLowerCase();
    return accounts.filter(account =>
      account.name.toLowerCase().includes(lowerSearchName)
    );
  }, [accounts, searchName]);

  return (
    <div className="search-accounts">
      <div className="search-accounts__header">
        <h1 className="search-accounts__title">Search Accounts</h1>
        <p className="search-accounts__subtitle">
          Find accounts by name
        </p>
      </div>

      <div className="search-accounts__filters">
        <div className="search-accounts__filter-group">
          <label htmlFor="account-name" className="search-accounts__label">
            Account Name
          </label>
          <input
            id="account-name"
            type="text"
            className="search-accounts__input"
            placeholder="Search by account name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>
      </div>

      <div className="search-accounts__results">
        <div className="search-accounts__results-header">
          <h2 className="search-accounts__results-title">
            Results ({filteredAccounts.length})
          </h2>
        </div>

        {filteredAccounts.length > 0 ? (
          <ul className="search-accounts__list">
            {filteredAccounts.map((account) => (
              <li key={account.id} className="search-accounts__list-item">
                <div className="search-accounts__account-card">
                  <div className="search-accounts__account-header">
                    <h3 className="search-accounts__account-name">
                      {account.name}
                    </h3>
                  </div>
                  <div className="search-accounts__account-details">
                    <span className="search-accounts__account-industry">
                      {account.industry || 'No industry specified'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="search-accounts__empty">
            {searchName.trim() ? (
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
