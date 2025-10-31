import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { mergeODataQuery } from '../../lib/odataUtils'
import { Employee } from '../../types'
import EntitySearch, { PaginationControls } from '../../components/EntitySearch'

export default function EmployeesList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Build OData query
  const odataQuery = mergeODataQuery(searchQuery, {})

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', odataQuery],
    queryFn: async () => {
      const response = await api.get(`/Employees${odataQuery}`)
      return response.data
    },
  })

  const employees = data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Employees</h1>
        </div>
        <Link to="/employees/new" className="btn btn-primary">
          Create Employee
        </Link>
      </div>

      <EntitySearch
        searchPlaceholder="Search employees..."
        sortOptions={[
          { label: 'First Name (A-Z)', value: 'FirstName asc' },
          { label: 'First Name (Z-A)', value: 'FirstName desc' },
          { label: 'Last Name (A-Z)', value: 'LastName asc' },
          { label: 'Last Name (Z-A)', value: 'LastName desc' },
          { label: 'Newest First', value: 'CreatedAt desc' },
          { label: 'Oldest First', value: 'CreatedAt asc' },
        ]}
        filterOptions={[
          {
            label: 'Department',
            key: 'Department',
            type: 'text',
          },
          {
            label: 'Position',
            key: 'Position',
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
          Loading employees...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading employees: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {employees.map((employee: Employee) => (
              <Link
                key={employee.ID}
                to={`/employees/${employee.ID}`}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {employee.FirstName} {employee.LastName}
                    </h3>
                    {employee.Position && (
                      <span className="badge badge-primary mt-2">{employee.Position}</span>
                    )}
                    <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {employee.Email && <div>📧 {employee.Email}</div>}
                      {employee.Phone && <div>📞 {employee.Phone}</div>}
                      {employee.Department && <div>🏢 {employee.Department}</div>}
                    </div>
                  </div>
                  {employee.HireDate && (
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <div>Hired: {new Date(employee.HireDate).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {employees.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No employees found</p>
              <Link to="/employees/new" className="btn btn-primary mt-4 inline-block">
                Create your first employee
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
