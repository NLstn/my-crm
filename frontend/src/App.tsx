import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AccountsList from './pages/Accounts/AccountsList'
import AccountDetail from './pages/Accounts/AccountDetail'
import AccountForm from './pages/Accounts/AccountForm'
import ContactsList from './pages/Contacts/ContactsList'
import ContactDetail from './pages/Contacts/ContactDetail'
import ContactForm from './pages/Contacts/ContactForm'
import ActivitiesList from './pages/Activities/ActivitiesList'
import ActivityDetail from './pages/Activities/ActivityDetail'
import ActivityForm from './pages/Activities/ActivityForm'
import IssuesList from './pages/Issues/IssuesList'
import IssueDetail from './pages/Issues/IssueDetail'
import IssueForm from './pages/Issues/IssueForm'
import TasksList from './pages/Tasks/TasksList'
import TaskDetail from './pages/Tasks/TaskDetail'
import TaskForm from './pages/Tasks/TaskForm'
import OpportunitiesList from './pages/Opportunities/OpportunitiesList'
import OpportunityDetail from './pages/Opportunities/OpportunityDetail'
import OpportunityForm from './pages/Opportunities/OpportunityForm'
import EmployeesList from './pages/Employees/EmployeesList'
import EmployeeDetail from './pages/Employees/EmployeeDetail'
import EmployeeForm from './pages/Employees/EmployeeForm'
import ProductsList from './pages/Products/ProductsList'
import ProductDetail from './pages/Products/ProductDetail'
import ProductForm from './pages/Products/ProductForm'
import { fetchEnums } from './lib/enums'

function App() {
  // Fetch enum definitions from backend on app initialization
  useEffect(() => {
    fetchEnums()
  }, [])
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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

            {/* Activities routes */}
            <Route path="activities" element={<ActivitiesList />} />
            <Route path="activities/new" element={<ActivityForm />} />
            <Route path="activities/:id" element={<ActivityDetail />} />
            <Route path="activities/:id/edit" element={<ActivityForm />} />

            {/* Issues routes */}
            <Route path="issues" element={<IssuesList />} />
            <Route path="issues/new" element={<IssueForm />} />
            <Route path="issues/:id" element={<IssueDetail />} />
            <Route path="issues/:id/edit" element={<IssueForm />} />

            {/* Tasks routes */}
            <Route path="tasks" element={<TasksList />} />
            <Route path="tasks/new" element={<TaskForm />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="tasks/:id/edit" element={<TaskForm />} />

            {/* Opportunities routes */}
            <Route path="opportunities" element={<OpportunitiesList />} />
            <Route path="opportunities/new" element={<OpportunityForm />} />
            <Route path="opportunities/:id" element={<OpportunityDetail />} />
            <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
            
            {/* Employees routes */}
            <Route path="employees" element={<EmployeesList />} />
            <Route path="employees/new" element={<EmployeeForm />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="employees/:id/edit" element={<EmployeeForm />} />
            
            {/* Products routes */}
            <Route path="products" element={<ProductsList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
