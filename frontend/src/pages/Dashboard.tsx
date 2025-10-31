import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'

export default function Dashboard() {
  // Fetch total accounts count
  const { data: accountsData, isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['accounts-count'],
    queryFn: async () => {
      const response = await api.get('/Accounts?$count=true&$top=0')
      return response.data
    },
  })

  // Fetch total contacts count
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useQuery({
    queryKey: ['contacts-count'],
    queryFn: async () => {
      const response = await api.get('/Contacts?$count=true&$top=0')
      return response.data
    },
  })

  // Fetch open issues count (exclude Closed and Resolved)
  // Status values: 1=New, 2=InProgress, 3=Pending, 4=Resolved, 5=Closed
  const { data: issuesData, isLoading: issuesLoading, error: issuesError } = useQuery({
    queryKey: ['open-issues-count'],
    queryFn: async () => {
      const response = await api.get("/Issues?$filter=Status ne 4 and Status ne 5&$count=true&$top=0")
      return response.data
    },
  })

  const isLoading = accountsLoading || contactsLoading || issuesLoading
  const hasError = accountsError || contactsError || issuesError

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to your CRM system
        </p>
      </div>

      {hasError && (
        <div className="card p-4 bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800">
          <p className="text-error-600 dark:text-error-400">
            Error loading dashboard data. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Accounts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : accountsData?.count ?? 0}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contacts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : contactsData?.count ?? 0}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Issues</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : issuesData?.count ?? 0}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/accounts/new"
            className="btn btn-primary text-center"
          >
            Create Account
          </Link>
          <Link
            to="/contacts/new"
            className="btn btn-primary text-center"
          >
            Add Contact
          </Link>
          <Link
            to="/issues/new"
            className="btn btn-primary text-center"
          >
            Create Issue
          </Link>
        </div>
      </div>
    </div>
  )
}
