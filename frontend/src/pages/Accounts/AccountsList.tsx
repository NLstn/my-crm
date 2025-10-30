import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { Account } from '../../types'

export default function AccountsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/Accounts?$expand=Contacts,Issues&$count=true')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading accounts...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading accounts: {(error as Error).message}
      </div>
    )
  }

  const accounts = data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {data?.count || accounts.length} total accounts
          </p>
        </div>
        <Link to="/accounts/new" className="btn btn-primary">
          Create Account
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {accounts.map((account: Account) => (
          <Link
            key={account.ID}
            to={`/accounts/${account.ID}`}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {account.Name}
                </h3>
                {account.Industry && (
                  <span className="badge badge-primary mt-2">{account.Industry}</span>
                )}
                <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {account.Email && <div>📧 {account.Email}</div>}
                  {account.Phone && <div>📞 {account.Phone}</div>}
                  {account.City && account.Country && (
                    <div>📍 {account.City}, {account.Country}</div>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>{account.Contacts?.length || 0} contacts</div>
                <div>{account.Issues?.length || 0} issues</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No accounts found</p>
          <Link to="/accounts/new" className="btn btn-primary mt-4 inline-block">
            Create your first account
          </Link>
        </div>
      )}
    </div>
  )
}
