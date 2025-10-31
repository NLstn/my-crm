import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { mergeODataQuery } from '../../lib/odataUtils'
import { Issue, issueStatusToString, issuePriorityToString } from '../../types'
import EntitySearch, { PaginationControls } from '../../components/EntitySearch'

export default function IssuesList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Merge search query with expand parameter
  const odataQuery = mergeODataQuery(searchQuery, { '$expand': 'Account,Contact' })

  const { data, isLoading, error } = useQuery({
    queryKey: ['issues', odataQuery],
    queryFn: async () => {
      const response = await api.get(`/Issues${odataQuery}`)
      return response.data
    },
  })

  const issues = data?.items || []

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Issues</h1>
        </div>
        <Link to="/issues/new" className="btn btn-primary">
          Create Issue
        </Link>
      </div>

      <EntitySearch
        searchPlaceholder="Search issues..."
        sortOptions={[
          { label: 'Newest First', value: 'CreatedAt desc' },
          { label: 'Oldest First', value: 'CreatedAt asc' },
          { label: 'Title (A-Z)', value: 'Title asc' },
          { label: 'Title (Z-A)', value: 'Title desc' },
          { label: 'Priority (High to Low)', value: 'Priority desc' },
          { label: 'Priority (Low to High)', value: 'Priority asc' },
        ]}
        filterOptions={[
          {
            label: 'Status',
            key: 'Status',
            type: 'select',
            options: [
              { label: 'New', value: '1' },
              { label: 'In Progress', value: '2' },
              { label: 'Pending', value: '3' },
              { label: 'Resolved', value: '4' },
              { label: 'Closed', value: '5' },
            ],
          },
          {
            label: 'Priority',
            key: 'Priority',
            type: 'select',
            options: [
              { label: 'Low', value: '1' },
              { label: 'Medium', value: '2' },
              { label: 'High', value: '3' },
              { label: 'Critical', value: '4' },
            ],
          },
        ]}
        onQueryChange={setSearchQuery}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          Loading issues...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading issues: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {issues.map((issue: Issue) => (
              <Link
                key={issue.ID}
                to={`/issues/${issue.ID}`}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {issue.Title}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <span className={`badge ${getStatusBadgeClass(issue.Status)}`}>
                        {issueStatusToString(issue.Status)}
                      </span>
                      <span className={`badge ${getPriorityBadgeClass(issue.Priority)}`}>
                        {issuePriorityToString(issue.Priority)}
                      </span>
                    </div>
                    {issue.Account && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        🏢 {issue.Account.Name}
                      </p>
                    )}
                    {issue.Contact && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        👤 {issue.Contact.FirstName} {issue.Contact.LastName}
                      </p>
                    )}
                    {issue.AssignedTo && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ✓ Assigned to {issue.AssignedTo}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <div>{new Date(issue.CreatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {issues.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No issues found</p>
              <Link to="/issues/new" className="btn btn-primary mt-4 inline-block">
                Create your first issue
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
