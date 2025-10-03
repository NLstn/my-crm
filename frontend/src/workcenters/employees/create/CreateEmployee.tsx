import { FC, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { employeesApi } from '../../../api';
import './CreateEmployee.css';

export type CreateEmployeeProps = Record<string, never>;

export const CreateEmployee: FC<CreateEmployeeProps> = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    const newErrors: { name?: string; email?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear any previous errors
    setErrors({});

    try {
      setIsSubmitting(true);
      
      // Create the employee via API
      await employeesApi.create({
        name: name.trim(),
        email: email.trim()
      });

      // Navigate to the search employees workcenter
      navigate('/employees/search');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee';
      setErrors({ email: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/employees/search');
  };

  return (
    <div className="create-employee">
      <div className="create-employee__header">
        <h1 className="create-employee__title">Create New Employee</h1>
        <p className="create-employee__subtitle">
          Enter the employee details below
        </p>
      </div>

      <form className="create-employee__form" onSubmit={handleSubmit}>
        <Input
          id="employee-name"
          label="Name"
          required
          fullWidth
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          error={errors.name}
          placeholder="Enter employee name..."
        />

        <Input
          id="employee-email"
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

        <div className="create-employee__actions">
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
            {isSubmitting ? 'Creating...' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
};
