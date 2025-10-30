import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { Issue } from '../../types'

export default function IssuesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const response = await api.get('/Issues?$expand=Account,Contact&$count=true&$orderby=CreatedAt desc')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading issues...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading issues: {(error as Error).message}
      </div>
    )
  }

  const issues = data?.items || []

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'New': return 'badge-primary'
      case 'InProgress': return 'badge-warning'
      case 'Resolved': return 'badge-success'
      case 'Closed': return 'badge-success'
      default: return 'badge-primary'
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'badge-error'
      case 'High': return 'badge-warning'
      case 'Medium': return 'badge-primary'
      case 'Low': return 'badge-primary'
      default: return 'badge-primary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Issues</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {data?.count || issues.length} total issues
          </p>
        </div>
        <Link to="/issues/new" className="btn btn-primary">
          Create Issue
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {issues.map((issue: Issue) => (
          <Link
            key={issue.ID}
            to={`/issues/${issue.ID}`}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {issue.Title}
                </h3>
                <div className="flex gap-2 mt-2">
                  <span className={`badge ${getStatusBadgeClass(issue.Status)}`}>
                    {issue.Status}
                  </span>
                  <span className={`badge ${getPriorityBadgeClass(issue.Priority)}`}>
                    {issue.Priority}
                  </span>
                </div>
                {issue.Account && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    🏢 {issue.Account.Name}
                  </p>
                )}
                {issue.Contact && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    👤 {issue.Contact.FirstName} {issue.Contact.LastName}
                  </p>
                )}
                {issue.AssignedTo && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ✓ Assigned to {issue.AssignedTo}
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>{new Date(issue.CreatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {issues.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No issues found</p>
          <Link to="/issues/new" className="btn btn-primary mt-4 inline-block">
            Create your first issue
          </Link>
        </div>
      )}
    </div>
  )
}
