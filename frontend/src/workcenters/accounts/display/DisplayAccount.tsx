import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Account } from '../../../types';
import { accountsApi } from '../../../api';
import './DisplayAccount.css';

export interface DisplayAccountProps {}

export const DisplayAccount: FC<DisplayAccountProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
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
        const accountData = await accountsApi.getById(id);
        setAccount(accountData);
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
        <div className="display-account__summary-card">
          <div className="display-account__summary-value">0</div>
          <div className="display-account__summary-label">Contacts</div>
        </div>
        <div className="display-account__summary-card">
          <div className="display-account__summary-value">0</div>
          <div className="display-account__summary-label">Total Tickets</div>
        </div>
        <div className="display-account__summary-card">
          <div className="display-account__summary-value">0</div>
          <div className="display-account__summary-label">Open Tickets</div>
        </div>
      </div>

      <div className="display-account__content">
        <section className="display-account__section">
          <h2 className="display-account__section-title">Contacts</h2>
          <div className="display-account__empty">
            <p className="display-account__empty-text">No contacts for this account</p>
            <p className="display-account__empty-subtitle">Contact management coming soon</p>
          </div>
        </section>

        <section className="display-account__section">
          <h2 className="display-account__section-title">Tickets</h2>
          <div className="display-account__empty">
            <p className="display-account__empty-text">No tickets for this account</p>
            <p className="display-account__empty-subtitle">Ticket management coming soon</p>
          </div>
        </section>
      </div>
    </div>
  );
};
