import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { Account, Employee } from '../../types'
import { Button, Input, Textarea } from '../../components/ui'

export default function AccountForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const { data: account } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const response = await api.get(`/Accounts(${id})`)
      return response.data as Account
    },
    enabled: isEdit,
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/Employees')
      return response.data
    },
  })

  const getInitialFormData = (): Partial<Account> => {
    if (account) {
      return {
        Name: account.Name || '',
        Industry: account.Industry || '',
        Website: account.Website || '',
        Phone: account.Phone || '',
        Email: account.Email || '',
        Address: account.Address || '',
        City: account.City || '',
        State: account.State || '',
        Country: account.Country || '',
        PostalCode: account.PostalCode || '',
        Description: account.Description || '',
        EmployeeID: account.EmployeeID || undefined,
      }
    }
    return {
      Name: '',
      Industry: '',
      Website: '',
      Phone: '',
      Email: '',
      Address: '',
      City: '',
      State: '',
      Country: '',
      PostalCode: '',
      Description: '',
      EmployeeID: undefined,
    }
  }

  const [formData, setFormData] = useState<Partial<Account>>(getInitialFormData())

  // Reset form data when account ID changes
  useEffect(() => {
    setFormData(getInitialFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Account>) => {
      // Clean up the data before sending
      const cleanData = { ...data }
      if (!cleanData.EmployeeID) {
        delete cleanData.EmployeeID
      }

      if (isEdit) {
        return api.patch(`/Accounts(${id})`, cleanData)
      } else {
        return api.post('/Accounts', cleanData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['account', id] })
      }
      navigate(isEdit ? `/accounts/${id}` : '/accounts')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value: string | number | undefined = e.target.value
    
    if (e.target.name === 'EmployeeID') {
      value = value ? parseInt(value) : undefined
    }

    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Account' : 'Create Account'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Account Name"
              type="text"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Input
              label="Industry"
              type="text"
              name="Industry"
              value={formData.Industry}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Website"
              type="url"
              name="Website"
              value={formData.Website}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Email"
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Phone"
              type="tel"
              name="Phone"
              value={formData.Phone}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Address"
              type="text"
              name="Address"
              value={formData.Address}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="City"
              type="text"
              name="City"
              value={formData.City}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="State/Province"
              type="text"
              name="State"
              value={formData.State}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Country"
              type="text"
              name="Country"
              value={formData.Country}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Postal Code"
              type="text"
              name="PostalCode"
              value={formData.PostalCode}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="EmployeeID" className="label">
              Responsible Employee
            </label>
            <select
              id="EmployeeID"
              name="EmployeeID"
              value={formData.EmployeeID || ''}
              onChange={handleChange}
              className="input"
            >
              <option value="">None</option>
              {(employeesData?.items || []).map((employee: Employee) => (
                <option key={employee.ID} value={employee.ID}>
                  {employee.FirstName} {employee.LastName}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Description"
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
          </Button>
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
