import { FC, ReactNode } from 'react';
import { Header } from '../Header/Header';
import './Layout.css';

export interface LayoutProps {
  children: ReactNode;
  onBackToDashboard?: () => void;
}

export const Layout: FC<LayoutProps> = ({ children, onBackToDashboard }) => {
  return (
    <div className="layout">
      <Header onBackToDashboard={onBackToDashboard} />
      <main className="layout__content">
        {children}
      </main>
    </div>
  );
};
