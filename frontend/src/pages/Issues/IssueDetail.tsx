import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/api'
import { Issue } from '../../types'

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const response = await api.get(`/Issues(${id})?$expand=Account,Contact`)
      return response.data as Issue
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading issue...</div>
  }

  if (error || !issue) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading issue
      </div>
    )
  }

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {issue.Title}
          </h1>
          <div className="flex gap-2 mt-3">
            <span className={`badge ${getStatusBadgeClass(issue.Status)}`}>
              {issue.Status}
            </span>
            <span className={`badge ${getPriorityBadgeClass(issue.Priority)}`}>
              {issue.Priority}
            </span>
          </div>
        </div>
        <Link to={`/issues/${id}/edit`} className="btn btn-primary">
          Edit Issue
        </Link>
      </div>

      {/* Issue details */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Issue Information
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issue.Account && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Account</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                <Link to={`/accounts/${issue.AccountID}`} className="text-primary-600 hover:underline">
                  {issue.Account.Name}
                </Link>
              </dd>
            </>
          )}
          {issue.Contact && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                <Link to={`/contacts/${issue.ContactID}`} className="text-primary-600 hover:underline">
                  {issue.Contact.FirstName} {issue.Contact.LastName}
                </Link>
              </dd>
            </>
          )}
          {issue.AssignedTo && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned To</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{issue.AssignedTo}</dd>
            </>
          )}
          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</dt>
          <dd className="text-sm text-gray-900 dark:text-gray-100">
            {new Date(issue.CreatedAt).toLocaleString()}
          </dd>
          <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</dt>
          <dd className="text-sm text-gray-900 dark:text-gray-100">
            {new Date(issue.UpdatedAt).toLocaleString()}
          </dd>
          {issue.DueDate && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Date</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(issue.DueDate).toLocaleDateString()}
              </dd>
            </>
          )}
          {issue.ResolvedAt && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(issue.ResolvedAt).toLocaleString()}
              </dd>
            </>
          )}
          {issue.Description && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 md:col-span-2">Description</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 md:col-span-2 whitespace-pre-wrap">
                {issue.Description}
              </dd>
            </>
          )}
          {issue.Resolution && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 md:col-span-2">Resolution</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 md:col-span-2 whitespace-pre-wrap">
                {issue.Resolution}
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}
