import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Issue, issueStatusToString, issuePriorityToString } from '../../types'
import { Button } from '../../components/ui'

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const response = await api.get(`/Issues(${id})?$expand=Account,Contact`)
      return response.data as Issue
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Issues(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      navigate('/issues')
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

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const getStatusBadgeClass = (status: number) => {
    switch (status) {
      case 1: return 'badge-primary' // New
      case 2: return 'badge-warning' // InProgress
      case 4: return 'badge-success' // Resolved
      case 5: return 'badge-success' // Closed
      default: return 'badge-primary'
    }
  }

  const getPriorityBadgeClass = (priority: number) => {
    switch (priority) {
      case 4: return 'badge-error' // Critical
      case 3: return 'badge-warning' // High
      case 2: return 'badge-primary' // Medium
      case 1: return 'badge-primary' // Low
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
              {issueStatusToString(issue.Status)}
            </span>
            <span className={`badge ${getPriorityBadgeClass(issue.Priority)}`}>
              {issuePriorityToString(issue.Priority)}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/issues/${id}/edit`} className="btn btn-primary">
            Edit Issue
          </Link>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Issue
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{issue.Title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Issue'}
              </Button>
            </div>
            {deleteMutation.isError && (
              <p className="text-error-600 dark:text-error-400 text-sm mt-4">
                Failed to delete issue. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
