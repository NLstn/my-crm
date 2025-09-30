import { FC } from 'react';
import { ProfileDropdown } from './ProfileDropdown';
import './Header.css';

export interface HeaderProps {
  onBackToDashboard?: () => void;
}

export const Header: FC<HeaderProps> = ({ onBackToDashboard }) => {
  const handleBackClick = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      // Default behavior - could navigate to dashboard route
      console.log('Navigate to dashboard');
    }
  };

  return (
    <header className="header">
      <div className="header__left">
        <button
          type="button"
          className="header__logo-button"
          onClick={handleBackClick}
          aria-label="Back to My CRM"
        >
          <span className="header__logo-text">My CRM</span>
        </button>
      </div>
      <div className="header__right">
        <ProfileDropdown initials="NL" />
      </div>
    </header>
  );
};
