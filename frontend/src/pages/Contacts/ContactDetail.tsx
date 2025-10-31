import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Contact, opportunityStageToString } from '../../types'
import { Button } from '../../components/ui'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
})

const getOpportunityStageBadge = (stage: number) => {
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

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: contact, isLoading, error } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const response = await api.get(`/Contacts(${id})?$expand=Account,Opportunities($expand=Account,Owner)`)
      return response.data as Contact
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Contacts(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      navigate('/contacts')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading contact...</div>
  }

  if (error || !contact) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading contact
      </div>
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const quickActivityUrl = `/activities/new?accountId=${contact.AccountID}&contactId=${contact.ID}`
  const quickTaskUrl = `/tasks/new?accountId=${contact.AccountID}&contactId=${contact.ID}&title=${encodeURIComponent(`Follow up with ${contact.FirstName}`)}`

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {contact.FirstName} {contact.LastName}
          </h1>
          {contact.Title && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">{contact.Title}</p>
          )}
          {contact.IsPrimary && (
            <span className="badge badge-primary mt-2">Primary Contact</span>
          )}
        </div>
        <div className="flex gap-3">
          <Link to={`/contacts/${id}/edit`} className="btn btn-primary">
            Edit Contact
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
              Log Activity
            </Link>
            <Link to={quickTaskUrl} className="btn btn-primary text-sm">
              Create Follow-up Task
            </Link>
          </div>
        </div>
      </div>

      {/* Contact details */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Contact Information
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contact.Account && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Account</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                <Link to={`/accounts/${contact.AccountID}`} className="text-primary-600 hover:underline">
                  {contact.Account.Name}
                </Link>
              </dd>
            </>
          )}
          {contact.Email && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                <a href={`mailto:${contact.Email}`} className="text-primary-600 hover:underline">
                  {contact.Email}
                </a>
              </dd>
            </>
          )}
          {contact.Phone && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{contact.Phone}</dd>
            </>
          )}
          {contact.Mobile && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Mobile</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{contact.Mobile}</dd>
            </>
          )}
          {contact.Notes && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 md:col-span-2">Notes</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 md:col-span-2">{contact.Notes}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Opportunities */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Opportunities ({contact.Opportunities?.length || 0})
          </h2>
          <Link
            to={`/opportunities/new?accountId=${contact.AccountID}&contactId=${id}`}
            className="btn btn-secondary text-sm"
          >
            Log Opportunity
          </Link>
        </div>
        {contact.Opportunities && contact.Opportunities.length > 0 ? (
          <div className="space-y-3">
            {contact.Opportunities.map((opportunity) => (
              <Link
                key={opportunity.ID}
                to={`/opportunities/${opportunity.ID}`}
                className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {opportunity.Name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className={`badge ${getOpportunityStageBadge(opportunity.Stage)}`}>
                        {opportunityStageToString(opportunity.Stage)}
                      </span>
                      <span className="badge badge-primary">
                        {currencyFormatter.format(opportunity.Amount)}
                      </span>
                      <span className="badge badge-secondary">{opportunity.Probability}% probability</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-left md:text-right">
                    {opportunity.ExpectedCloseDate ? (
                      <>Expected close {new Date(opportunity.ExpectedCloseDate).toLocaleDateString()}</>
                    ) : (
                      'Expected close TBD'
                    )}
                    {opportunity.Account && (
                      <div className="mt-1">
                        🏢 {opportunity.Account.Name}
                      </div>
                    )}
                    {opportunity.Owner && (
                      <div className="mt-1">
                        👥 {opportunity.Owner.FirstName} {opportunity.Owner.LastName}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            No opportunities linked to this contact yet
          </p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Contact
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{contact.FirstName} {contact.LastName}"? This action cannot be undone.
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Contact'}
              </Button>
            </div>
            {deleteMutation.isError && (
              <p className="text-error-600 dark:text-error-400 text-sm mt-4">
                Failed to delete contact. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
