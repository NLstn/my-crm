import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components';
import './SettingsDashboard.css';

export type SettingsDashboardProps = Record<string, never>;

interface SettingsSection {
  id: string;
  name: string;
  description: string;
  icon: string;
  links: {
    name: string;
    path: string;
    description: string;
  }[];
}

const settingsSections: SettingsSection[] = [
  {
    id: 'accounts',
    name: 'Accounts',
    description: 'Configure account-related settings',
    icon: '👥',
    links: [
      {
        name: 'Define Industries',
        path: '/settings/accounts/industries',
        description: 'Manage industry types for accounts'
      }
    ]
  }
];

export const SettingsDashboard: FC<SettingsDashboardProps> = () => {
  const navigate = useNavigate();

  const handleLinkClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="settings-dashboard">
      <div className="settings-dashboard__header">
        <h1 className="settings-dashboard__title">Admin Settings</h1>
        <p className="settings-dashboard__subtitle">
          Configure system settings and manage data
        </p>
      </div>

      <div className="settings-dashboard__sections">
        {settingsSections.map((section) => (
          <Card key={section.id} variant="section" className="settings-section-tile">
            <div className="settings-section-tile__header">
              <span className="settings-section-tile__icon">{section.icon}</span>
              <div>
                <h2 className="settings-section-tile__title">{section.name}</h2>
                <p className="settings-section-tile__description">{section.description}</p>
              </div>
            </div>
            <div className="settings-section-tile__links">
              {section.links.map((link) => (
                <button
                  key={link.path}
                  type="button"
                  className="settings-section-tile__link"
                  onClick={() => handleLinkClick(link.path)}
                >
                  <div>
                    <div className="settings-section-tile__link-name">{link.name}</div>
                    <div className="settings-section-tile__link-description">{link.description}</div>
                  </div>
                  <svg
                    className="settings-section-tile__link-arrow"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.5 15L12.5 10L7.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
