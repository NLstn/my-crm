import { FC, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components';
import { employeesApi } from '../../../api';
import { Employee } from '../../../types';
import './SearchEmployees.css';

export const SearchEmployees: FC = () => {
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const employeesData = await employeesApi.search();
        
        setEmployees(employeesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load employees. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    let result = employees;

    if (searchName.trim()) {
      const lowerSearchName = searchName.toLowerCase();
      result = result.filter(employee =>
        employee.name.toLowerCase().includes(lowerSearchName)
      );
    }

    if (searchEmail.trim()) {
      const lowerSearchEmail = searchEmail.toLowerCase();
      result = result.filter(employee =>
        employee.email.toLowerCase().includes(lowerSearchEmail)
      );
    }

    return result;
  }, [employees, searchName, searchEmail]);

  if (loading) {
    return (
      <div className="search-employees">
        <div className="search-employees__loading">Loading employees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-employees">
        <div className="search-employees__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="search-employees">
      <div className="search-employees__header">
        <div className="search-employees__header-content">
          <div>
            <h1 className="search-employees__title">Search Employees</h1>
            <p className="search-employees__subtitle">
              Find employees by name or email
            </p>
          </div>
          <Button
            onClick={() => navigate('/employees/create')}
          >
            Create New Employee
          </Button>
        </div>
      </div>

      <div className="search-employees__filters">
        <Input
          id="employee-name"
          label="Employee Name"
          placeholder="Search by employee name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          id="employee-email"
          label="Email"
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
      </div>

      <div className="search-employees__results">
        <div className="search-employees__results-header">
          <h2 className="search-employees__results-title">
            Results ({filteredEmployees.length})
          </h2>
        </div>

        {filteredEmployees.length > 0 ? (
          <ul className="search-employees__list">
            {filteredEmployees.map((employee) => (
              <li key={employee.id} className="search-employees__list-item">
                <button 
                  className="search-employees__employee-card"
                  onClick={() => navigate(`/employee/${employee.id}`)}
                  type="button"
                >
                  <div className="search-employees__employee-header">
                    <h3 className="search-employees__employee-name">
                      {employee.name}
                    </h3>
                    <span className="search-employees__employee-id">ID: {employee.id}</span>
                  </div>
                  <div className="search-employees__employee-details">
                    <span className="search-employees__employee-email">
                      {employee.email}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="search-employees__empty">
            {searchName.trim() || searchEmail.trim() ? (
              <>
                <p className="search-employees__empty-title">No employees found</p>
                <p className="search-employees__empty-subtitle">
                  Try adjusting your search criteria
                </p>
              </>
            ) : (
              <>
                <p className="search-employees__empty-title">No employees available</p>
                <p className="search-employees__empty-subtitle">
                  Create your first employee to get started
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
