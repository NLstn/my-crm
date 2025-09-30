import { FC, useState } from 'react';
import './Sidebar.css';

export interface WorkCenter {
  id: string;
  name: string;
  icon?: string;
  path: string;
  subItems?: WorkCenter[];
  defaultPath?: string; // For parent items with subitems
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workCenters: WorkCenter[];
  onNavigate?: (workCenter: WorkCenter) => void;
}

export const Sidebar: FC<SidebarProps> = ({ isOpen, onClose, workCenters, onNavigate }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleNavigate = (workCenter: WorkCenter) => {
    if (onNavigate) {
      // If the workcenter has subitems, use the defaultPath, otherwise use path
      const navigationTarget = workCenter.subItems && workCenter.defaultPath
        ? { ...workCenter, path: workCenter.defaultPath }
        : workCenter;
      onNavigate(navigationTarget);
    }
    onClose();
  };

  const toggleExpanded = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderWorkCenter = (workCenter: WorkCenter, isSubItem = false) => {
    const hasSubItems = workCenter.subItems && workCenter.subItems.length > 0;
    const isExpanded = expandedItems.has(workCenter.id);

    return (
      <li key={workCenter.id} className="sidebar__list-item">
        <div className={`sidebar__link-wrapper ${isSubItem ? 'sidebar__link-wrapper--subitem' : ''}`}>
          {!isSubItem && (
            <div className="sidebar__expand-button-container">
              {hasSubItems ? (
                <button
                  type="button"
                  className="sidebar__expand-button"
                  onClick={(e) => toggleExpanded(workCenter.id, e)}
                  aria-label={isExpanded ? `Collapse ${workCenter.name}` : `Expand ${workCenter.name}`}
                  aria-expanded={isExpanded}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`sidebar__expand-icon ${isExpanded ? 'sidebar__expand-icon--expanded' : ''}`}
                  >
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <span className="sidebar__expand-placeholder" aria-hidden="true" />
              )}
            </div>
          )}
          <button
            type="button"
            className={`sidebar__link ${isSubItem ? 'sidebar__link--subitem' : ''}`}
            onClick={() => handleNavigate(workCenter)}
          >
            {workCenter.icon && !isSubItem && (
              <span className="sidebar__icon">{workCenter.icon}</span>
            )}
            <span className="sidebar__link-text">{workCenter.name}</span>
          </button>
        </div>
        {hasSubItems && isExpanded && (
          <ul className="sidebar__sublist">
            {workCenter.subItems!.map(subItem => renderWorkCenter(subItem, true))}
          </ul>
        )}
      </li>
    );
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
            {workCenters.map(workCenter => renderWorkCenter(workCenter))}
          </ul>
        </nav>
      </aside>
    </>
  );
};
