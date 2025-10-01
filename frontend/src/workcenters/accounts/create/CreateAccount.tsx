import { FC, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { accountsApi } from '../../../api';
import './CreateAccount.css';

export type CreateAccountProps = Record<string, never>;

export const CreateAccount: FC<CreateAccountProps> = () => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate that name is not empty
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    // Clear any previous errors
    setError('');
    setIsSubmitting(true);

    try {
      // Create the account via API
      const newAccount = await accountsApi.create({
        name: name.trim(),
        industry: industry.trim(),
      });

      // Navigate to the display account workcenter
      navigate(`/account/${newAccount.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/accounts/search');
  };

  return (
    <div className="create-account">
      <div className="create-account__header">
        <h1 className="create-account__title">Create New Account</h1>
        <p className="create-account__subtitle">
          Enter the account details below
        </p>
      </div>

      <form className="create-account__form" onSubmit={handleSubmit}>
        <Input
          id="account-name"
          label="Account Name"
          required
          fullWidth
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
          placeholder="Enter account name..."
        />

        <Input
          id="account-industry"
          label="Industry"
          fullWidth
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Enter industry (optional)..."
        />

        <div className="create-account__actions">
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
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  );
};
