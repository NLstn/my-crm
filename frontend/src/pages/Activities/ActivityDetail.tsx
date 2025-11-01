import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import type { Activity } from '../../types'
import { Button } from '../../components/ui'

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: activity, isLoading, error } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const response = await api.get(`/Activities(${id})?$expand=Account,Contact,Employee,Lead`)
      return response.data as Activity
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Activities(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      navigate('/activities')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading activity...</div>
  }

  if (error || !activity) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading activity
      </div>
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {activity.Subject}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {new Date(activity.ActivityTime).toLocaleString()} &bull; {activity.ActivityType}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={`/activities/${id}/edit`} className="btn btn-primary">
            Edit Activity
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
          {activity.Account && activity.AccountID && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Account</div>
              <Link to={`/accounts/${activity.AccountID}`} className="text-primary-600 hover:underline">
                {activity.Account.Name}
              </Link>
            </div>
          )}
          {activity.Lead && activity.LeadID && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Lead</div>
              <Link to={`/leads/${activity.LeadID}`} className="text-primary-600 hover:underline">
                {activity.Lead.Name}
              </Link>
            </div>
          )}
          {activity.Contact && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Contact</div>
              <Link to={`/contacts/${activity.ContactID}`} className="text-primary-600 hover:underline">
                {activity.Contact.FirstName} {activity.Contact.LastName}
              </Link>
            </div>
          )}
          {activity.Employee && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Owner</div>
              <div>{activity.Employee.FirstName} {activity.Employee.LastName}</div>
            </div>
          )}
          {activity.Outcome && (
            <div>
              <div className="font-medium text-gray-600 dark:text-gray-400">Outcome</div>
              <div>{activity.Outcome}</div>
            </div>
          )}
        </div>

        {activity.Notes && (
          <div>
            <div className="font-medium text-gray-600 dark:text-gray-400 mb-2">Notes</div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{activity.Notes}</p>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Activity
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{activity.Subject}"? This action cannot be undone.
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Activity'}
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
