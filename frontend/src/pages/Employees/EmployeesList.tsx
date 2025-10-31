import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { Employee } from '../../types'

export default function EmployeesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/Employees?$count=true')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading employees...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading employees: {(error as Error).message}
      </div>
    )
  }

  const employees = data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Employees</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {data?.count || employees.length} total employees
          </p>
        </div>
        <Link to="/employees/new" className="btn btn-primary">
          Create Employee
        </Link>
      </div>

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
    </div>
  )
}
