import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Opportunity, opportunityStageToString } from '../../types'
import { Button } from '../../components/ui'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
})

const getStageBadgeClass = (stage: number) => {
  switch (stage) {
    case 6:
      return 'badge-success'
    case 7:
      return 'badge-error'
    case 5:
      return 'badge-warning'
    case 4:
      return 'badge-primary'
    default:
      return 'badge-secondary'
  }
}

const formatDate = (value?: string) => {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString()
}

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: opportunity, isLoading, error } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const response = await api.get(`/Opportunities(${id})?$expand=Account,Contact,Owner`)
      return response.data as Opportunity
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Opportunities(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      navigate('/opportunities')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading opportunity...</div>
  }

  if (error || !opportunity) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading opportunity
      </div>
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {opportunity.Name}
            </h1>
            <span className="badge badge-primary">
              {currencyFormatter.format(opportunity.Amount)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className={`badge ${getStageBadgeClass(opportunity.Stage)}`}>
              {opportunityStageToString(opportunity.Stage)}
            </span>
            <span className="badge badge-secondary">
              {opportunity.Probability}% probability
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Expected close: {formatDate(opportunity.ExpectedCloseDate)}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/opportunities/${id}/edit`} className="btn btn-primary">
            Edit Opportunity
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Opportunity Overview
          </h2>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Account</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunity.Account ? (
                  <Link to={`/accounts/${opportunity.AccountID}`} className="text-primary-600 hover:underline">
                    {opportunity.Account.Name}
                  </Link>
                ) : (
                  'Not linked'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Primary Contact</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunity.Contact ? (
                  <Link to={`/contacts/${opportunity.Contact.ID}`} className="text-primary-600 hover:underline">
                    {opportunity.Contact.FirstName} {opportunity.Contact.LastName}
                  </Link>
                ) : (
                  'Not selected'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Owner</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunity.Owner ? (
                  <Link to={`/employees/${opportunity.Owner.ID}`} className="text-primary-600 hover:underline">
                    {opportunity.Owner.FirstName} {opportunity.Owner.LastName}
                  </Link>
                ) : (
                  'Unassigned'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Stage</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunityStageToString(opportunity.Stage)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Amount</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {currencyFormatter.format(opportunity.Amount)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Probability</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunity.Probability}%
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Expected Close Date</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {formatDate(opportunity.ExpectedCloseDate)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notes & Timeline
          </h2>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</h3>
            <p className="mt-2 text-gray-900 dark:text-gray-100">
              {opportunity.Description ? opportunity.Description : 'No additional notes recorded yet.'}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <h3 className="text-gray-600 dark:text-gray-400">Created</h3>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date(opportunity.CreatedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-gray-600 dark:text-gray-400">Last Updated</h3>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date(opportunity.UpdatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Opportunity
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Are you sure you want to delete "{opportunity.Name}"? This action cannot be undone.
              </p>
            </div>
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Opportunity'}
              </Button>
            </div>
            {deleteMutation.isError && (
              <p className="text-error-600 dark:text-error-400 text-sm">
                Error deleting opportunity. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
