import { FormEvent, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Employee, Issue, IssueUpdate, issueStatusToString, issuePriorityToString } from '../../types'
import { Button, Textarea } from '../../components/ui'

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newUpdateBody, setNewUpdateBody] = useState('')
  const [newUpdateEmployeeID, setNewUpdateEmployeeID] = useState('')

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const response = await api.get(`/Issues(${id})?$expand=Account,Contact,Employee,Updates($expand=Employee)`)
      return response.data as Issue
    },
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/Employees')
      return response.data
    },
  })

  const createUpdateMutation = useMutation({
    mutationFn: async (payload: { issueID: number; body: string; employeeID?: number }) => {
      const requestPayload: Record<string, unknown> = {
        IssueID: payload.issueID,
        Body: payload.body,
      }

      if (payload.employeeID) {
        requestPayload.EmployeeID = payload.employeeID
      }

      await api.post('/IssueUpdates', requestPayload)
    },
    onSuccess: () => {
      setNewUpdateBody('')
      setNewUpdateEmployeeID('')
      queryClient.invalidateQueries({ queryKey: ['issue', id] })
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

  const sortedUpdates = useMemo<IssueUpdate[]>(() => {
    const updates = issue?.Updates ?? []

    return [...updates].sort((a, b) => (
      new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
    ))
  }, [issue?.Updates])

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

  const employees = (employeesData?.items as Employee[] | undefined) ?? []

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const handleCreateUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!issue) {
      return
    }

    const trimmedBody = newUpdateBody.trim()
    if (!trimmedBody) {
      return
    }

    const employeeID = newUpdateEmployeeID ? parseInt(newUpdateEmployeeID, 10) : undefined

    createUpdateMutation.mutate({
      issueID: issue.ID,
      body: trimmedBody,
      employeeID,
    })
  }

  const isUpdateSubmitDisabled = createUpdateMutation.isPending || !newUpdateBody.trim()

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

  const activityParams = new URLSearchParams({ accountId: issue.AccountID.toString() })
  const taskParams = new URLSearchParams({
    accountId: issue.AccountID.toString(),
    title: `Follow up on ${issue.Title}`,
  })
  if (issue.ContactID) {
    activityParams.append('contactId', issue.ContactID.toString())
    taskParams.append('contactId', issue.ContactID.toString())
  }

  const quickActivityUrl = `/activities/new?${activityParams.toString()}`
  const quickTaskUrl = `/tasks/new?${taskParams.toString()}`

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

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to={quickActivityUrl} className="btn btn-secondary text-sm">
              Log Related Activity
            </Link>
            <Link to={quickTaskUrl} className="btn btn-primary text-sm">
              Create Follow-up Task
            </Link>
          </div>
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
          {issue.Employee && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Responsible Employee</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {issue.Employee.FirstName} {issue.Employee.LastName}
              </dd>
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

      <div className="card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Issue Timeline</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track updates to keep the team aligned on progress.
          </p>
        </div>

        {sortedUpdates.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No updates recorded yet. Share the latest status below.
          </p>
        ) : (
          <ol className="relative border-l border-gray-200 dark:border-gray-700">
            {sortedUpdates.map(update => (
              <li key={update.ID} className="relative pl-6 pb-6 last:pb-0">
                <span className="absolute left-0 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary-500 dark:bg-primary-400" />
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {update.Employee ? `${update.Employee.FirstName} ${update.Employee.LastName}` : 'Unknown author'}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(update.CreatedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {update.Body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <form onSubmit={handleCreateUpdate} className="space-y-4">
          <Textarea
            label="Add a new update"
            name="issue-update"
            value={newUpdateBody}
            onChange={event => setNewUpdateBody(event.target.value)}
            rows={4}
            placeholder="Share progress, notes, or next steps..."
            required
          />
          <div>
            <label htmlFor="update-employee" className="label">
              Author (Optional)
            </label>
            <select
              id="update-employee"
              name="update-employee"
              value={newUpdateEmployeeID}
              onChange={event => setNewUpdateEmployeeID(event.target.value)}
              className="input"
            >
              <option value="">Select an employee</option>
              {employees.map(employee => (
                <option key={employee.ID} value={employee.ID}>
                  {employee.FirstName} {employee.LastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isUpdateSubmitDisabled}
            >
              {createUpdateMutation.isPending ? 'Saving...' : 'Post Update'}
            </Button>
            {createUpdateMutation.isError && (
              <span className="text-sm text-error-600 dark:text-error-400">
                Failed to save update. Please try again.
              </span>
            )}
          </div>
        </form>
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
