import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { Account } from '../../types'

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

  const [formData, setFormData] = useState<Partial<Account>>({
    Name: account?.Name || '',
    Industry: account?.Industry || '',
    Website: account?.Website || '',
    Phone: account?.Phone || '',
    Email: account?.Email || '',
    Address: account?.Address || '',
    City: account?.City || '',
    State: account?.State || '',
    Country: account?.Country || '',
    PostalCode: account?.PostalCode || '',
    Description: account?.Description || '',
  })

  const mutation = useMutation({
    mutationFn: async (data: Partial<Account>) => {
      if (isEdit) {
        return api.patch(`/Accounts(${id})`, data)
      } else {
        return api.post('/Accounts', data)
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
          {isEdit ? 'Edit Account' : 'Create Account'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="Name" className="label">
              Account Name *
            </label>
            <input
              type="text"
              id="Name"
              name="Name"
              value={formData.Name}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="Industry" className="label">
              Industry
            </label>
            <input
              type="text"
              id="Industry"
              name="Industry"
              value={formData.Industry}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="Website" className="label">
              Website
            </label>
            <input
              type="url"
              id="Website"
              name="Website"
              value={formData.Website}
              onChange={handleChange}
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

          <div className="md:col-span-2">
            <label htmlFor="Address" className="label">
              Address
            </label>
            <input
              type="text"
              id="Address"
              name="Address"
              value={formData.Address}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="City" className="label">
              City
            </label>
            <input
              type="text"
              id="City"
              name="City"
              value={formData.City}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="State" className="label">
              State/Province
            </label>
            <input
              type="text"
              id="State"
              name="State"
              value={formData.State}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="Country" className="label">
              Country
            </label>
            <input
              type="text"
              id="Country"
              name="Country"
              value={formData.Country}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="PostalCode" className="label">
              Postal Code
            </label>
            <input
              type="text"
              id="PostalCode"
              name="PostalCode"
              value={formData.PostalCode}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="Description" className="label">
              Description
            </label>
            <textarea
              id="Description"
              name="Description"
              value={formData.Description}
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
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
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
