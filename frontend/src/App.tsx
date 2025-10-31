import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import EmployeesList from './pages/Employees/EmployeesList'
import EmployeeDetail from './pages/Employees/EmployeeDetail'
import EmployeeForm from './pages/Employees/EmployeeForm'
import { fetchEnums } from './lib/enums'

function App() {
  // Fetch enum definitions from backend on app initialization
  useEffect(() => {
    fetchEnums()
  }, [])
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            
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
            
            {/* Employees routes */}
            <Route path="employees" element={<EmployeesList />} />
            <Route path="employees/new" element={<EmployeeForm />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="employees/:id/edit" element={<EmployeeForm />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
