import { FC, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components';
import './CreateAccount.css';

export interface CreateAccountProps {
  onCreateAccount: (name: string) => number;
}

export const CreateAccount: FC<CreateAccountProps> = ({ onCreateAccount }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate that name is not empty
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    // Clear any previous errors
    setError('');

    // Create the account and get the new ID
    const newAccountId = onCreateAccount(name.trim());

    // Navigate to the display account workcenter
    navigate(`/account/${newAccountId}`);
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
        <div className="create-account__form-group">
          <label htmlFor="account-name" className="create-account__label">
            Account Name <span className="create-account__required">*</span>
          </label>
          <input
            id="account-name"
            type="text"
            className={`create-account__input ${error ? 'create-account__input--error' : ''}`}
            placeholder="Enter account name..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
          />
          {error && (
            <span className="create-account__error-message" role="alert">
              {error}
            </span>
          )}
        </div>

        <div className="create-account__actions">
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
            Create Account
          </Button>
        </div>
      </form>
    </div>
  );
};
