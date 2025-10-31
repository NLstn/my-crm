import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { Employee } from '../../types'

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const { data: employee } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await api.get(`/Employees(${id})`)
      return response.data as Employee
    },
    enabled: isEdit,
  })

  const getInitialFormData = (): Partial<Employee> => {
    if (employee) {
      return {
        FirstName: employee.FirstName || '',
        LastName: employee.LastName || '',
        Email: employee.Email || '',
        Phone: employee.Phone || '',
        Department: employee.Department || '',
        Position: employee.Position || '',
        HireDate: employee.HireDate ? employee.HireDate.split('T')[0] : '',
        Notes: employee.Notes || '',
      }
    }
    return {
      FirstName: '',
      LastName: '',
      Email: '',
      Phone: '',
      Department: '',
      Position: '',
      HireDate: '',
      Notes: '',
    }
  }

  const [formData, setFormData] = useState<Partial<Employee>>(getInitialFormData())

  // Reset form data when employee ID changes
  useEffect(() => {
    setFormData(getInitialFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      if (isEdit) {
        return api.patch(`/Employees(${id})`, data)
      } else {
        return api.post('/Employees', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['employee', id] })
      }
      navigate(isEdit ? `/employees/${id}` : '/employees')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Employee' : 'Create Employee'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="FirstName" className="label">
              First Name *
            </label>
            <input
              type="text"
              id="FirstName"
              name="FirstName"
              value={formData.FirstName}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="LastName" className="label">
              Last Name *
            </label>
            <input
              type="text"
              id="LastName"
              name="LastName"
              value={formData.LastName}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="Email" className="label">
              Email
            </label>
            <input
              type="email"
              id="Email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="Phone" className="label">
              Phone
            </label>
            <input
              type="tel"
              id="Phone"
              name="Phone"
              value={formData.Phone}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="Department" className="label">
              Department
            </label>
            <input
              type="text"
              id="Department"
              name="Department"
              value={formData.Department}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="Position" className="label">
              Position
            </label>
            <input
              type="text"
              id="Position"
              name="Position"
              value={formData.Position}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="HireDate" className="label">
              Hire Date
            </label>
            <input
              type="date"
              id="HireDate"
              name="HireDate"
              value={formData.HireDate}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="Notes" className="label">
              Notes
            </label>
            <textarea
              id="Notes"
              name="Notes"
              value={formData.Notes}
              onChange={handleChange}
              rows={4}
              className="input"
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn btn-primary"
          >
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>

        {mutation.isError && (
          <div className="text-error-600 dark:text-error-400 text-sm">
            Error: {(mutation.error as Error).message}
          </div>
        )}
      </form>
    </div>
  )
}
