import { FC, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { accountsApi, contactsApi } from '../../../api';
import { Account, Contact } from '../../../types';
import './SearchContacts.css';

export const SearchContacts: FC = () => {
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
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
        
        // Fetch contacts for all accounts
        const contactsPromises = accountsData.map((account: Account) => 
          contactsApi.getByAccount(account.id)
        );
        const contactsArrays = await Promise.all(contactsPromises);
        const allContacts = contactsArrays.flat();
        setContacts(allContacts);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load contacts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (searchName.trim()) {
      const lowerSearchName = searchName.toLowerCase();
      result = result.filter(contact =>
        contact.fullName.toLowerCase().includes(lowerSearchName)
      );
    }

    if (searchEmail.trim()) {
      const lowerSearchEmail = searchEmail.toLowerCase();
      result = result.filter(contact =>
        contact.email.toLowerCase().includes(lowerSearchEmail)
      );
    }

    return result;
  }, [contacts, searchName, searchEmail]);

  const getAccountName = (accountId: string): string => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  if (loading) {
    return (
      <div className="search-contacts">
        <div className="search-contacts__loading">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-contacts">
        <div className="search-contacts__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="search-contacts">
      <div className="search-contacts__header">
        <div className="search-contacts__header-content">
          <div>
            <h1 className="search-contacts__title">Search Contacts</h1>
            <p className="search-contacts__subtitle">
              Find contacts by name or email
            </p>
          </div>
          <Button
            onClick={() => navigate('/contacts/create')}
          >
            Create New Contact
          </Button>
        </div>
      </div>

      <div className="search-contacts__filters">
        <Input
          id="contact-name"
          label="Contact Name"
          placeholder="Search by contact name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          id="contact-email"
          label="Email"
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
      </div>

      <div className="search-contacts__results">
        <div className="search-contacts__results-header">
          <h2 className="search-contacts__results-title">
            Results ({filteredContacts.length})
          </h2>
        </div>

        {filteredContacts.length > 0 ? (
          <ul className="search-contacts__list">
            {filteredContacts.map((contact) => (
              <li key={contact.id} className="search-contacts__list-item">
                <button 
                  className="search-contacts__contact-card"
                  onClick={() => navigate(`/contact/${contact.id}`)}
                  type="button"
                >
                  <div className="search-contacts__contact-header">
                    <h3 className="search-contacts__contact-name">
                      {contact.fullName}
                    </h3>
                    <span className="search-contacts__contact-id">ID: {contact.id}</span>
                  </div>
                  <div className="search-contacts__contact-details">
                    <span className="search-contacts__contact-email">
                      {contact.email}
                    </span>
                    <span className="search-contacts__contact-account">
                      {getAccountName(contact.accountId)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="search-contacts__empty">
            {searchName.trim() || searchEmail.trim() ? (
              <>
                <p className="search-contacts__empty-title">No contacts found</p>
                <p className="search-contacts__empty-subtitle">
                  Try adjusting your search criteria
                </p>
              </>
            ) : (
              <>
                <p className="search-contacts__empty-title">No contacts available</p>
                <p className="search-contacts__empty-subtitle">
                  Create your first contact to get started
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
