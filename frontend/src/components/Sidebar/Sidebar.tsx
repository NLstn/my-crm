import { FC } from 'react';
import './Sidebar.css';

export interface WorkCenter {
  id: string;
  name: string;
  icon?: string;
  path: string;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workCenters: WorkCenter[];
  onNavigate?: (workCenter: WorkCenter) => void;
}

export const Sidebar: FC<SidebarProps> = ({ isOpen, onClose, workCenters, onNavigate }) => {
  const handleNavigate = (workCenter: WorkCenter) => {
    if (onNavigate) {
      onNavigate(workCenter);
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
        aria-label="Navigation sidebar"
      >
        <div className="sidebar__header">
          <h2 className="sidebar__title">Work Centers</h2>
          <button
            type="button"
            className="sidebar__close-button"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        
        <nav className="sidebar__nav">
          <ul className="sidebar__list">
            {workCenters.map((workCenter) => (
              <li key={workCenter.id} className="sidebar__list-item">
                <button
                  type="button"
                  className="sidebar__link"
                  onClick={() => handleNavigate(workCenter)}
                >
                  {workCenter.icon && (
                    <span className="sidebar__icon">{workCenter.icon}</span>
                  )}
                  <span className="sidebar__link-text">{workCenter.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};
