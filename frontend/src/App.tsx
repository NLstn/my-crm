import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { SearchAccounts } from './workcenters/accounts';
import { sampleAccounts } from './pages/Dashboard';
import './App.css';

// Re-export types for use in other parts of the app
export type { Account, Contact, Ticket } from './pages/Dashboard';

function AppContent() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleNavigate = (workCenter: { path: string }) => {
    navigate(workCenter.path);
  };

  return (
    <Layout 
      onBackToDashboard={handleBackToDashboard}
      onNavigate={handleNavigate}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts/search" element={<SearchAccounts accounts={sampleAccounts} />} />
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
