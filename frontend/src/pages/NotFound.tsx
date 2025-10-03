import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export const NotFound: FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="not-found">
      <div className="not-found__content">
        <h1 className="not-found__title">404 - Page Not Found</h1>
        <p className="not-found__subtitle">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <button 
          className="not-found__button"
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
