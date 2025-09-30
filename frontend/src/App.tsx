import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { SearchAccounts, DisplayAccount, CreateAccount } from './workcenters/accounts';
import { sampleAccounts, sampleContacts, sampleTickets } from './pages/Dashboard';
import type { Account } from './pages/Dashboard';
import './App.css';

// Re-export types for use in other parts of the app
export type { Account, Contact, Ticket } from './pages/Dashboard';

function AppContent() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>(sampleAccounts);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleNavigate = (workCenter: { path: string }) => {
    navigate(workCenter.path);
  };

  const handleCreateAccount = (name: string): number => {
    // Generate a new ID (max existing ID + 1)
    const maxId = accounts.reduce((max, acc) => Math.max(max, acc.id), 0);
    const newId = maxId + 1;

    const newAccount: Account = {
      id: newId,
      name,
      industry: '', // Default empty industry for now
    };

    setAccounts([...accounts, newAccount]);
    return newId;
  };

  return (
    <Layout 
      onBackToDashboard={handleBackToDashboard}
      onNavigate={handleNavigate}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts/search" element={<SearchAccounts accounts={accounts} />} />
        <Route path="/accounts/create" element={<CreateAccount onCreateAccount={handleCreateAccount} />} />
        <Route path="/account/:id" element={
          <DisplayAccount 
            accounts={accounts} 
            contacts={sampleContacts} 
            tickets={sampleTickets} 
          />
        } />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
