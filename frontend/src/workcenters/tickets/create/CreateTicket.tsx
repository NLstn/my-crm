import { FC, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import './CreateTicket.css';

export interface Account {
  id: number;
  name: string;
}

export interface CreateTicketProps {
  accounts: Account[];
  onCreateTicket: (title: string, accountId: string, status: 'open' | 'in_progress' | 'closed') => string;
}

export const CreateTicket: FC<CreateTicketProps> = ({ accounts, onCreateTicket }) => {
  const [title, setTitle] = useState('');
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState<'open' | 'in_progress' | 'closed'>('open');
  const [errors, setErrors] = useState<{ title?: string; accountId?: string }>({});
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
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

    // Create the ticket and get the new ID
    const newTicketId = onCreateTicket(title.trim(), accountId, status);

    // Navigate to the display ticket workcenter
    navigate(`/ticket/${newTicketId}`);
  };

  const handleCancel = () => {
    navigate('/tickets/search');
  };

  const accountOptions = accounts.map(account => ({
    value: String(account.id),
    label: account.name,
  }));

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
            onChange={(e) => setStatus(e.target.value as 'open' | 'in_progress' | 'closed')}
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            Create Ticket
          </Button>
        </div>
      </form>
    </div>
  );
};
