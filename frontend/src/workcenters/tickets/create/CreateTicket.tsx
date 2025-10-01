import { FC, FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { accountsApi, ticketsApi } from '../../../api';
import type { Account } from '../../../types';
import './CreateTicket.css';

export type CreateTicketProps = Record<string, never>;

export const CreateTicket: FC<CreateTicketProps> = () => {
  const [title, setTitle] = useState('');
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState<string>('open');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; accountId?: string }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await accountsApi.search();
        setAccounts(data);
      } catch (err) {
        console.error('Failed to load accounts:', err);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    const newErrors: { title?: string; accountId?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!accountId) {
      newErrors.accountId = 'Account is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});

    try {
      setIsSubmitting(true);
      
      // Create the ticket via API
      const newTicket = await ticketsApi.create(accountId, {
        title: title.trim(),
        status: status
      });

      // Navigate to the display ticket workcenter
      navigate(`/ticket/${newTicket.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create ticket';
      setErrors({ accountId: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/tickets/search');
  };

  const accountOptions = accounts.map(account => ({
    value: account.id,
    label: account.name,
  }));

  if (isLoadingAccounts) {
    return (
      <div className="create-ticket">
        <div className="create-ticket__loading">
          <p>Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-ticket">
      <div className="create-ticket__header">
        <h1 className="create-ticket__title">Create New Ticket</h1>
        <p className="create-ticket__subtitle">
          Enter the ticket details below
        </p>
      </div>

      <form className="create-ticket__form" onSubmit={handleSubmit}>
        <Input
          id="ticket-title"
          label="Title"
          required
          fullWidth
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: undefined });
          }}
          error={errors.title}
          placeholder="Enter ticket title..."
        />

        <div className="create-ticket__field">
          <label htmlFor="ticket-account" className="create-ticket__label">
            Account <span className="create-ticket__required">*</span>
          </label>
          <select
            id="ticket-account"
            className={`create-ticket__select ${errors.accountId ? 'create-ticket__select--error' : ''}`}
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              if (errors.accountId) setErrors({ ...errors, accountId: undefined });
            }}
            required
          >
            <option value="">Select an account...</option>
            {accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.accountId && (
            <span className="create-ticket__error">{errors.accountId}</span>
          )}
        </div>

        <div className="create-ticket__field">
          <label htmlFor="ticket-status" className="create-ticket__label">
            Status <span className="create-ticket__required">*</span>
          </label>
          <select
            id="ticket-status"
            className="create-ticket__select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="create-ticket__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
};
