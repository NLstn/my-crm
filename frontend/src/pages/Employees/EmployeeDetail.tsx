import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Employee } from '../../types'

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await api.get(`/Employees(${id})`)
      return response.data as Employee
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Employees(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      navigate('/employees')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading employee...</div>
  }

  if (error || !employee) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading employee
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
            {employee.FirstName} {employee.LastName}
          </h1>
          {employee.Position && (
            <span className="badge badge-primary mt-2">{employee.Position}</span>
          )}
        </div>
        <div className="flex gap-3">
          <Link to={`/employees/${id}/edit`} className="btn btn-primary">
            Edit Employee
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Employee details */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Employee Information
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employee.Email && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{employee.Email}</dd>
            </>
          )}
          {employee.Phone && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{employee.Phone}</dd>
            </>
          )}
          {employee.Department && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Department</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{employee.Department}</dd>
            </>
          )}
          {employee.HireDate && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Hire Date</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(employee.HireDate).toLocaleDateString()}
              </dd>
            </>
          )}
          {employee.Notes && (
            <>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 md:col-span-2">Notes</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 md:col-span-2">{employee.Notes}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Employee
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{employee.FirstName} {employee.LastName}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Employee'}
              </button>
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
