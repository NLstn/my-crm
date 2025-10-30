import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { Contact, Account } from '../../types'

export default function ContactForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const accountIdFromQuery = searchParams.get('accountId')

  const { data: contact } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const response = await api.get(`/Contacts(${id})`)
      return response.data as Contact
    },
    enabled: isEdit,
  })

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/Accounts')
      return response.data
    },
  })

  const getInitialFormData = (): Partial<Contact> => {
    if (contact) {
      return {
        AccountID: contact.AccountID,
        FirstName: contact.FirstName,
        LastName: contact.LastName,
        Title: contact.Title || '',
        Email: contact.Email || '',
        Phone: contact.Phone || '',
        Mobile: contact.Mobile || '',
        IsPrimary: contact.IsPrimary,
        Notes: contact.Notes || '',
      }
    }
    return {
      AccountID: accountIdFromQuery ? parseInt(accountIdFromQuery) : 0,
      FirstName: '',
      LastName: '',
      Title: '',
      Email: '',
      Phone: '',
      Mobile: '',
      IsPrimary: false,
      Notes: '',
    }
  }

  const [formData, setFormData] = useState<Partial<Contact>>(getInitialFormData())

  // Reset form data when contact ID changes
  useEffect(() => {
    setFormData(getInitialFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      if (isEdit) {
        return api.patch(`/Contacts(${id})`, data)
      } else {
        return api.post('/Contacts', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['contact', id] })
      }
      navigate(isEdit ? `/contacts/${id}` : '/contacts')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value

    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  const accounts = accountsData?.items || []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Contact' : 'Add Contact'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="AccountID" className="label">
              Account *
            </label>
            <select
              id="AccountID"
              name="AccountID"
              value={formData.AccountID}
              onChange={handleChange}
              required
              className="input"
            >
              <option value="">Select an account</option>
              {accounts.map((account: Account) => (
                <option key={account.ID} value={account.ID}>
                  {account.Name}
                </option>
              ))}
            </select>
          </div>

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

          <div className="md:col-span-2">
            <label htmlFor="Title" className="label">
              Title
            </label>
            <input
              type="text"
              id="Title"
              name="Title"
              value={formData.Title}
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
            <label htmlFor="Mobile" className="label">
              Mobile
            </label>
            <input
              type="tel"
              id="Mobile"
              name="Mobile"
              value={formData.Mobile}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="IsPrimary"
                checked={formData.IsPrimary}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Contact
              </span>
            </label>
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
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Contact' : 'Add Contact'}
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
