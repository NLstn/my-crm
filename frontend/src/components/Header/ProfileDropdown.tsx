import { FC } from 'react';
import { Dropdown } from '../Dropdown/Dropdown';
import { useTheme } from '../../hooks/useTheme';
import './ProfileDropdown.css';

export interface ProfileDropdownProps {
  initials?: string;
}

export const ProfileDropdown: FC<ProfileDropdownProps> = ({ initials = 'NL' }) => {
  const { theme, toggleTheme } = useTheme();
  
  const trigger = (
    <div className="profile-dropdown__trigger" role="button" aria-label="User menu" tabIndex={0}>
      <div className="profile-dropdown__avatar">
        {initials}
      </div>
    </div>
  );

  return (
    <Dropdown trigger={trigger} align="right">
      <div className="profile-dropdown__content">
        <div className="profile-dropdown__header">
          <div className="profile-dropdown__avatar profile-dropdown__avatar--large">
            {initials}
          </div>
          <div className="profile-dropdown__info">
            <div className="profile-dropdown__name">User</div>
            <div className="profile-dropdown__email">user@example.com</div>
          </div>
        </div>
        <div className="profile-dropdown__divider"></div>
        <div className="profile-dropdown__section">
          <button
            type="button"
            className="profile-dropdown__item"
            onClick={toggleTheme}
          >
            <span className="profile-dropdown__item-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span className="profile-dropdown__item-text">Theme</span>
            <span className="profile-dropdown__item-badge">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </div>
    </Dropdown>
  );
};
