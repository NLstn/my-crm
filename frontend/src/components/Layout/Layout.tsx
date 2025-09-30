import { FC, ReactNode, useState } from 'react';
import { Header } from '../Header/Header';
import { Sidebar, WorkCenter } from '../Sidebar/Sidebar';
import './Layout.css';

export interface LayoutProps {
  children: ReactNode;
  onBackToDashboard?: () => void;
  workCenters?: WorkCenter[];
  onNavigate?: (workCenter: WorkCenter) => void;
}

const defaultWorkCenters: WorkCenter[] = [
  { 
    id: 'accounts', 
    name: 'Accounts', 
    icon: '👥', 
    path: '/accounts',
    defaultPath: '/accounts/search',
    subItems: [
      { id: 'accounts-search', name: 'Search Accounts', path: '/accounts/search' },
      { id: 'accounts-create', name: 'Create Account', path: '/accounts/create' },
    ]
  },
  { 
    id: 'contacts', 
    name: 'Contacts', 
    icon: '📇', 
    path: '/contacts',
    defaultPath: '/contacts/search',
    subItems: [
      { id: 'contacts-search', name: 'Search Contacts', path: '/contacts/search' },
      { id: 'contacts-create', name: 'Create Contact', path: '/contacts/create' },
    ]
  },
];

export const Layout: FC<LayoutProps> = ({ 
  children, 
  onBackToDashboard,
  workCenters = defaultWorkCenters,
  onNavigate
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Header 
        onBackToDashboard={onBackToDashboard}
        onMenuClick={handleMenuClick}
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        workCenters={workCenters}
        onNavigate={onNavigate}
      />
      <main className="layout__content">
        {children}
      </main>
    </div>
  );
};
