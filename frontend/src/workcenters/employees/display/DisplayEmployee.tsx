import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeesApi } from '../../../api';
import type { Employee } from '../../../types';
import './DisplayEmployee.css';

export type DisplayEmployeeProps = Record<string, never>;

export const DisplayEmployee: FC<DisplayEmployeeProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('No employee ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const employeeData = await employeesApi.getById(id);
        setEmployee(employeeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employee');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="display-employee">
        <div className="display-employee__loading">
          <p>Loading employee...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="display-employee">
        <div className="display-employee__error">
          <h1 className="display-employee__error-title">{error || 'Employee Not Found'}</h1>
          <p className="display-employee__error-subtitle">
            {error || `The employee with ID ${id} could not be found.`}
          </p>
          <button 
            className="display-employee__back-button"
            onClick={() => navigate('/employees/search')}
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="display-employee">
      <div className="display-employee__header">
        <div className="display-employee__header-content">
          <div className="display-employee__header-main">
            <h1 className="display-employee__title">{employee.name}</h1>
            <span className="display-employee__id">ID: {employee.id}</span>
          </div>
          <button 
            className="display-employee__back-button"
            onClick={() => navigate('/employees/search')}
          >
            Back to Search
          </button>
        </div>
        <p className="display-employee__email">{employee.email}</p>
      </div>

      <div className="display-employee__details">
        <div className="display-employee__detail-section">
          <h2 className="display-employee__section-title">Employee Information</h2>
          <div className="display-employee__info-grid">
            <div className="display-employee__info-item">
              <span className="display-employee__info-label">Name:</span>
              <span className="display-employee__info-value">{employee.name}</span>
            </div>
            <div className="display-employee__info-item">
              <span className="display-employee__info-label">Email:</span>
              <span className="display-employee__info-value">{employee.email}</span>
            </div>
            <div className="display-employee__info-item">
              <span className="display-employee__info-label">Created:</span>
              <span className="display-employee__info-value">
                {new Date(employee.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="display-employee__info-item">
              <span className="display-employee__info-label">Updated:</span>
              <span className="display-employee__info-value">
                {new Date(employee.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
