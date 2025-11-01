import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import EntitySearch, { PaginationControls } from '../../components/EntitySearch'
import api from '../../lib/api'
import type { Employee, Lead } from '../../types'
import { buildLeadQuery, useLeads } from '../../lib/hooks/leads'

const statusBadgeVariant: Record<string, string> = {
  New: 'badge-primary',
  Contacted: 'badge-secondary',
  Qualified: 'badge-warning',
  Converted: 'badge-success',
  Disqualified: 'badge-error',
}

export default function LeadsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const odataQuery = useMemo(() => buildLeadQuery(searchQuery), [searchQuery])

  const { data, isLoading, error } = useLeads(odataQuery)

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'lead-list'],
    queryFn: async () => {
      const response = await api.get('/Employees', {
        params: {
          $select: 'ID,FirstName,LastName',
          $orderby: 'FirstName asc',
        },
      })
      return response.data
    },
  })

  const leads = (data?.items as Lead[]) || []
  const totalCount = data?.count || 0
  const employees = useMemo(
    () => ((employeesData?.items as Employee[]) || []),
    [employeesData],
  )

  const ownerOptions = useMemo(
    () =>
      employees.map(employee => ({
        label: `${employee.FirstName} ${employee.LastName}`,
        value: employee.ID.toString(),
      })),
    [employees],
  )

  const sortOptions = useMemo(
    () => [
      { label: 'Newest First', value: 'CreatedAt desc' },
      { label: 'Oldest First', value: 'CreatedAt asc' },
      { label: 'Name (A-Z)', value: 'Name asc' },
      { label: 'Name (Z-A)', value: 'Name desc' },
      {
        label: 'Owner (A-Z)',
        value: 'OwnerEmployee/LastName asc,OwnerEmployee/FirstName asc',
      },
      {
        label: 'Owner (Z-A)',
        value: 'OwnerEmployee/LastName desc,OwnerEmployee/FirstName desc',
      },
    ],
    [],
  )

  const filterOptions = useMemo(
    () => [
      {
        label: 'Status',
        key: 'Status',
        type: 'select' as const,
        options: [
          { label: 'New', value: 'New' },
          { label: 'Contacted', value: 'Contacted' },
          { label: 'Qualified', value: 'Qualified' },
          { label: 'Converted', value: 'Converted' },
          { label: 'Disqualified', value: 'Disqualified' },
        ],
      },
      {
        label: 'Source',
        key: 'Source',
        type: 'text' as const,
      },
      {
        label: 'Owner',
        key: 'OwnerEmployeeID',
        type: 'select' as const,
        options: ownerOptions,
        valueType: 'number' as const,
      },
    ],
    [ownerOptions],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Capture and manage prospects before converting them into accounts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/leads/new" className="btn btn-primary text-center">
            Add Lead
          </Link>
          <Link to="/accounts/new" className="btn btn-secondary text-center">
            New Account from Scratch
          </Link>
        </div>
      </div>

      <EntitySearch
        searchPlaceholder="Search leads by name, company, or email..."
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onQueryChange={(query) => setSearchQuery(query)}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />

      {isLoading && (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading leads...</div>
      )}

      {error && (
        <div className="text-center py-12 text-error-600 dark:text-error-400">
          Error loading leads: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {leads.map((lead) => {
              const badgeClass = statusBadgeVariant[lead.Status] ?? 'badge-secondary'
              return (
                <Link
                  key={lead.ID}
                  to={`/leads/${lead.ID}`}
                  className="card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {lead.Name}
                        </h3>
                        <span className={`badge ${badgeClass}`}>{lead.Status}</span>
                      </div>
                      {lead.Company && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{lead.Company}</p>
                      )}
                      <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          👤 Owner:{' '}
                          {lead.OwnerEmployee ? (
                            <span className="text-gray-900 dark:text-gray-100">
                              {lead.OwnerEmployee.FirstName} {lead.OwnerEmployee.LastName}
                            </span>
                          ) : (
                            <span className="italic">Unassigned</span>
                          )}
                        </div>
                        {lead.Email && <div>📧 {lead.Email}</div>}
                        {lead.Phone && <div>📞 {lead.Phone}</div>}
                        {lead.Source && <div>🗂️ Source: {lead.Source}</div>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 text-left md:text-right">
                      <div>Created {new Date(lead.CreatedAt).toLocaleDateString()}</div>
                      {lead.ConvertedAccountID && lead.ConvertedAccount ? (
                        <div className="text-success-600 dark:text-success-400">
                          Converted to {lead.ConvertedAccount.Name}
                        </div>
                      ) : (
                        <div>Not converted</div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {leads.length === 0 && (
            <div className="card p-12 text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">No leads found</p>
              <Link to="/leads/new" className="btn btn-primary inline-block">
                Capture your first lead
              </Link>
            </div>
          )}

          <PaginationControls
            totalCount={totalCount}
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
