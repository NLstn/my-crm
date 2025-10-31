import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Account } from '../../types'
import { Button } from '../../components/ui'

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: account, isLoading, error } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const response = await api.get(`/Accounts(${id})?$expand=Contacts,Issues`)
      return response.data as Account
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Accounts(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      navigate('/accounts')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading account...</div>
  }

  if (error || !account) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading account
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
            {account.Name}
          </h1>
          {account.Industry && (
            <span className="badge badge-primary mt-2">{account.Industry}</span>
          )}
        </div>
        <div className="flex gap-3">
          <Link to={`/accounts/${id}/edit`} className="btn btn-primary">
            Edit Account
          </Link>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Account details */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Account Information
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {account.Email && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{account.Email}</dd>
            </>
          )}
          {account.Phone && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{account.Phone}</dd>
            </>
          )}
          {account.Website && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Website</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                <a href={account.Website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {account.Website}
                </a>
              </dd>
            </>
          )}
          {account.Address && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {account.Address}
                {account.City && `, ${account.City}`}
                {account.State && `, ${account.State}`}
                {account.PostalCode && ` ${account.PostalCode}`}
                {account.Country && `, ${account.Country}`}
              </dd>
            </>
          )}
          {account.Description && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 md:col-span-2">Description</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 md:col-span-2">{account.Description}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Contacts */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Contacts ({account.Contacts?.length || 0})
          </h2>
          <Link to={`/contacts/new?accountId=${id}`} className="btn btn-secondary text-sm">
            Add Contact
          </Link>
        </div>
        {account.Contacts && account.Contacts.length > 0 ? (
          <div className="space-y-3">
            {account.Contacts.map((contact) => (
              <Link
                key={contact.ID}
                to={`/contacts/${contact.ID}`}
                className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {contact.FirstName} {contact.LastName}
                      {contact.IsPrimary && (
                        <span className="ml-2 badge badge-primary text-xs">Primary</span>
                      )}
                    </p>
                    {contact.Title && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contact.Title}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                    {contact.Email && <div>{contact.Email}</div>}
                    {contact.Phone && <div>{contact.Phone}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">No contacts yet</p>
        )}
      </div>

      {/* Issues */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Issues ({account.Issues?.length || 0})
          </h2>
          <Link to={`/issues/new?accountId=${id}`} className="btn btn-secondary text-sm">
            Create Issue
          </Link>
        </div>
        {account.Issues && account.Issues.length > 0 ? (
          <div className="space-y-3">
            {account.Issues.map((issue) => (
              <Link
                key={issue.ID}
                to={`/issues/${issue.ID}`}
                className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{issue.Title}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`badge ${
                        issue.Status === 'New' ? 'badge-primary' :
                        issue.Status === 'Resolved' ? 'badge-success' :
                        'badge-warning'
                      }`}>
                        {issue.Status}
                      </span>
                      <span className={`badge ${
                        issue.Priority === 'Critical' ? 'badge-error' :
                        issue.Priority === 'High' ? 'badge-warning' :
                        'badge-primary'
                      }`}>
                        {issue.Priority}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">No issues yet</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Account
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{account.Name}"? This action cannot be undone.
              {(account.Contacts?.length || 0) > 0 && (
                <span className="block mt-2 text-warning-600 dark:text-warning-400">
                  Warning: This account has {account.Contacts?.length} contact(s).
                </span>
              )}
              {(account.Issues?.length || 0) > 0 && (
                <span className="block mt-1 text-warning-600 dark:text-warning-400">
                  Warning: This account has {account.Issues?.length} issue(s).
                </span>
              )}
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
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
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
