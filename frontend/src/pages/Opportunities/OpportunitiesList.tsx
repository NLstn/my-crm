import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { mergeODataQuery } from '../../lib/odataUtils'
import { Opportunity, OPPORTUNITY_STAGES, opportunityStageToString } from '../../types'
import EntitySearch, { PaginationControls } from '../../components/EntitySearch'

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

export default function OpportunitiesList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const stageOptions = OPPORTUNITY_STAGES()

  const odataQuery = mergeODataQuery(searchQuery, {
    '$expand': 'Account,Contact,Owner',
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['opportunities', odataQuery],
    queryFn: async () => {
      const response = await api.get(`/Opportunities${odataQuery}`)
      return response.data
    },
  })

  const opportunities = (data?.items as Opportunity[]) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Opportunities</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor your sales pipeline, forecast revenue, and track upcoming closes.
          </p>
        </div>
        <Link to="/opportunities/new" className="btn btn-primary">
          Create Opportunity
        </Link>
      </div>

      <EntitySearch
        searchPlaceholder="Search opportunities..."
        sortOptions={[
          { label: 'Newest First', value: 'CreatedAt desc' },
          { label: 'Oldest First', value: 'CreatedAt asc' },
          { label: 'Amount (High to Low)', value: 'Amount desc' },
          { label: 'Amount (Low to High)', value: 'Amount asc' },
          { label: 'Expected Close (Soonest)', value: 'ExpectedCloseDate asc' },
          { label: 'Expected Close (Latest)', value: 'ExpectedCloseDate desc' },
        ]}
        filterOptions={[
          {
            label: 'Stage',
            key: 'Stage',
            type: 'select',
            options: stageOptions.map(stage => ({
              label: stage.label,
              value: stage.value.toString(),
            })),
          },
        ]}
        onQueryChange={setSearchQuery}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          Loading opportunities...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading opportunities: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {opportunities.map((opportunity) => (
              <Link
                key={opportunity.ID}
                to={`/opportunities/${opportunity.ID}`}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {opportunity.Name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`badge ${getStageBadgeClass(opportunity.Stage)}`}>
                        {opportunityStageToString(opportunity.Stage)}
                      </span>
                      <span className="badge badge-primary">
                        {currencyFormatter.format(opportunity.Amount)}
                      </span>
                      <span className="badge badge-secondary">
                        {opportunity.Probability}% probability
                      </span>
                    </div>
                    {opportunity.Account && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        🏢 {opportunity.Account.Name}
                      </p>
                    )}
                    {opportunity.Contact && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        👤 {opportunity.Contact.FirstName} {opportunity.Contact.LastName}
                      </p>
                    )}
                    {opportunity.Owner && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        👥 Owned by {opportunity.Owner.FirstName} {opportunity.Owner.LastName}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      {opportunity.ExpectedCloseDate
                        ? `Expected close ${new Date(opportunity.ExpectedCloseDate).toLocaleDateString()}`
                        : 'Expected close TBD'}
                    </div>
                    <div className="mt-1">
                      Updated {new Date(opportunity.UpdatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {opportunities.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No opportunities match your filters yet.
              </p>
              <Link to="/opportunities/new" className="btn btn-primary mt-4 inline-block">
                Create your first opportunity
              </Link>
            </div>
          )}

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
