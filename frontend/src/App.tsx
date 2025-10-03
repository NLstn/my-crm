import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { SearchAccounts, DisplayAccount, CreateAccount } from './workcenters/accounts';
import { DisplayContact, CreateContact } from './workcenters/contacts';
import { SearchContacts } from './workcenters/contacts/search/SearchContacts';
import { DisplayTicket, CreateTicket } from './workcenters/tickets';
import { SearchTickets } from './workcenters/tickets/search/SearchTickets';
import { SearchEmployees, CreateEmployee, DisplayEmployee } from './workcenters/employees';
import { SettingsDashboard, DefineIndustries } from './workcenters/settings';
import './App.css';

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
        <Route path="/accounts/search" element={<SearchAccounts />} />
        <Route path="/accounts/create" element={<CreateAccount />} />
        <Route path="/account/:id" element={<DisplayAccount />} />
        <Route path="/contacts/search" element={<SearchContacts />} />
        <Route path="/contacts/create" element={<CreateContact />} />
        <Route path="/contact/:id" element={<DisplayContact />} />
        <Route path="/tickets/search" element={<SearchTickets />} />
        <Route path="/tickets/create" element={<CreateTicket />} />
        <Route path="/ticket/:id" element={<DisplayTicket />} />
        <Route path="/employees/search" element={<SearchEmployees />} />
        <Route path="/employees/create" element={<CreateEmployee />} />
        <Route path="/employee/:id" element={<DisplayEmployee />} />
        <Route path="/settings" element={<SettingsDashboard />} />
        <Route path="/settings/accounts/industries" element={<DefineIndustries />} />
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
