import { FC } from 'react';
import { ProfileDropdown } from './ProfileDropdown';
import './Header.css';

export interface HeaderProps {
  onBackToDashboard?: () => void;
  onMenuClick?: () => void;
}

export const Header: FC<HeaderProps> = ({ onBackToDashboard, onMenuClick }) => {
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
          className="header__menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
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
