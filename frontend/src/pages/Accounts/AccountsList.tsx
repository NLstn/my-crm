import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { mergeODataQuery } from '../../lib/odataUtils'
import { Account } from '../../types'
import EntitySearch, { PaginationControls } from '../../components/EntitySearch'

export default function AccountsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Merge search query with expand parameter
  const odataQuery = mergeODataQuery(searchQuery, { '$expand': 'Contacts,Issues' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts', odataQuery],
    queryFn: async () => {
      const response = await api.get(`/Accounts${odataQuery}`)
      return response.data
    },
  })

  const accounts = data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
        </div>
        <Link to="/accounts/new" className="btn btn-primary">
          Create Account
        </Link>
      </div>

      <EntitySearch
        searchPlaceholder="Search accounts..."
        sortOptions={[
          { label: 'Name (A-Z)', value: 'Name asc' },
          { label: 'Name (Z-A)', value: 'Name desc' },
          { label: 'Newest First', value: 'CreatedAt desc' },
          { label: 'Oldest First', value: 'CreatedAt asc' },
        ]}
        filterOptions={[
          {
            label: 'Industry',
            key: 'Industry',
            type: 'text',
          },
          {
            label: 'Country',
            key: 'Country',
            type: 'text',
          },
        ]}
        onQueryChange={setSearchQuery}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          Loading accounts...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading accounts: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
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

          {/* Pagination Controls Below Results */}
          <PaginationControls
            totalCount={data?.count || 0}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}
    </div>
  )
}
