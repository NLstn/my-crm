import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import type { Task } from '../../types'
import { taskStatusToString } from '../../types'
import { Button } from '../../components/ui'

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await api.get(`/Tasks(${id})?$expand=Account,Contact,Employee,Lead`)
      return response.data as Task
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Tasks(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      navigate('/tasks')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading task...</div>
  }

  if (error || !task) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading task
      </div>
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const statusBadgeClass = (status: number) => {
    switch (status) {
      case 3:
        return 'badge badge-success'
      case 2:
        return 'badge badge-warning'
      case 5:
        return 'badge badge-error'
      default:
        return 'badge badge-primary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {task.Title}
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <span className={statusBadgeClass(task.Status)}>
              {taskStatusToString(task.Status)}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Due {new Date(task.DueDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/tasks/${id}/edit`} className="btn btn-primary">
            Edit Task
          </Link>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          {task.Account && task.AccountID && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Account</div>
              <Link to={`/accounts/${task.AccountID}`} className="text-primary-600 hover:underline">
                {task.Account.Name}
              </Link>
            </div>
          )}
          {task.Lead && task.LeadID && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Lead</div>
              <Link to={`/leads/${task.LeadID}`} className="text-primary-600 hover:underline">
                {task.Lead.Name}
              </Link>
            </div>
          )}
          {task.Contact && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Contact</div>
              <Link to={`/contacts/${task.ContactID}`} className="text-primary-600 hover:underline">
                {task.Contact.FirstName} {task.Contact.LastName}
              </Link>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-600 dark:text-gray-400">Owner</div>
            <div>{task.Owner}</div>
          </div>
          {task.Employee && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Assigned Employee</div>
              <div>{task.Employee.FirstName} {task.Employee.LastName}</div>
            </div>
          )}
          {task.CompletedAt && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Completed</div>
              <div>{new Date(task.CompletedAt).toLocaleString()}</div>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-600 dark:text-gray-400">Created</div>
            <div>{new Date(task.CreatedAt).toLocaleString()}</div>
          </div>
          <div>
            <div className="font-medium text-gray-600 dark:text-gray-400">Last Updated</div>
            <div>{new Date(task.UpdatedAt).toLocaleString()}</div>
          </div>
        </div>

        {task.Description && (
          <div>
            <div className="font-medium text-gray-600 dark:text-gray-400 mb-2">Description</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{task.Description}</p>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Task
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{task.Title}"? This action cannot be undone.
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Task'}
              </Button>
            </div>
            {deleteMutation.isError && (
              <p className="text-error-600 dark:text-error-400 text-sm mt-4">
                Error: {(deleteMutation.error as Error).message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
