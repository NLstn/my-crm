import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { Contact, Account } from '../../types'
import { Button, Input, Textarea } from '../../components/ui'

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
            <Input
              label="First Name"
              type="text"
              name="FirstName"
              value={formData.FirstName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Input
              label="Last Name"
              type="text"
              name="LastName"
              value={formData.LastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Title"
              type="text"
              name="Title"
              value={formData.Title}
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
              label="Mobile"
              type="tel"
              name="Mobile"
              value={formData.Mobile}
              onChange={handleChange}
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
            <Textarea
              label="Notes"
              name="Notes"
              value={formData.Notes}
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
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Contact' : 'Add Contact'}
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
