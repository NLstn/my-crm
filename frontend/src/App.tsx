import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AccountsList from './pages/Accounts/AccountsList'
import AccountDetail from './pages/Accounts/AccountDetail'
import AccountForm from './pages/Accounts/AccountForm'
import ContactsList from './pages/Contacts/ContactsList'
import ContactDetail from './pages/Contacts/ContactDetail'
import ContactForm from './pages/Contacts/ContactForm'
import IssuesList from './pages/Issues/IssuesList'
import IssueDetail from './pages/Issues/IssueDetail'
import IssueForm from './pages/Issues/IssueForm'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Accounts routes */}
            <Route path="accounts" element={<AccountsList />} />
            <Route path="accounts/new" element={<AccountForm />} />
            <Route path="accounts/:id" element={<AccountDetail />} />
            <Route path="accounts/:id/edit" element={<AccountForm />} />
            
            {/* Contacts routes */}
            <Route path="contacts" element={<ContactsList />} />
            <Route path="contacts/new" element={<ContactForm />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="contacts/:id/edit" element={<ContactForm />} />
            
            {/* Issues routes */}
            <Route path="issues" element={<IssuesList />} />
            <Route path="issues/new" element={<IssueForm />} />
            <Route path="issues/:id" element={<IssueDetail />} />
            <Route path="issues/:id/edit" element={<IssueForm />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
