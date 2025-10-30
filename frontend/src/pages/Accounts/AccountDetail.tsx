import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/api'
import { Account } from '../../types'

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: account, isLoading, error } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const response = await api.get(`/Accounts(${id})?$expand=Contacts,Issues`)
      return response.data as Account
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
        <Link to={`/accounts/${id}/edit`} className="btn btn-primary">
          Edit Account
        </Link>
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
    </div>
  )
}
