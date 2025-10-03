import { FC, FormEvent, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { accountsApi, contactsApi } from '../../../api';
import type { Account } from '../../../types';
import './CreateContact.css';

export type CreateContactProps = Record<string, never>;

export const CreateContact: FC<CreateContactProps> = () => {
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; accountId?: string }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await accountsApi.search();
        setAccounts(data);
        
        // Pre-fill account from URL params if provided
        const prefilledAccountId = searchParams.get('accountId');
        if (prefilledAccountId && data.some(acc => acc.id === prefilledAccountId)) {
          setAccountId(prefilledAccountId);
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    const newErrors: { fullName?: string; email?: string; accountId?: string } = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
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
      
      // Create the contact via API
      const newContact = await contactsApi.create(accountId, {
        fullName: fullName.trim(),
        email: email.trim()
      });

      // Navigate to the display contact workcenter
      navigate(`/contact/${newContact.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create contact';
      setErrors({ accountId: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/contacts/search');
  };

  const accountOptions = accounts.map(account => ({
    value: account.id,
    label: account.name,
  }));

  if (isLoadingAccounts) {
    return (
      <div className="create-contact">
        <div className="create-contact__loading">
          <p>Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-contact">
      <div className="create-contact__header">
        <h1 className="create-contact__title">Create New Contact</h1>
        <p className="create-contact__subtitle">
          Enter the contact details below
        </p>
      </div>

      <form className="create-contact__form" onSubmit={handleSubmit}>
        <Input
          id="contact-fullname"
          label="Full Name"
          required
          fullWidth
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors({ ...errors, fullName: undefined });
          }}
          error={errors.fullName}
          placeholder="Enter full name..."
        />

        <Input
          id="contact-email"
          label="Email"
          type="email"
          required
          fullWidth
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: undefined });
          }}
          error={errors.email}
          placeholder="Enter email address..."
        />

        <div className="create-contact__field">
          <label htmlFor="contact-account" className="create-contact__label">
            Account <span className="create-contact__required">*</span>
          </label>
          <select
            id="contact-account"
            className={`create-contact__select ${errors.accountId ? 'create-contact__select--error' : ''}`}
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
            <span className="create-contact__error">{errors.accountId}</span>
          )}
        </div>

        <div className="create-contact__actions">
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
            {isSubmitting ? 'Creating...' : 'Create Contact'}
          </Button>
        </div>
      </form>
    </div>
  );
};
