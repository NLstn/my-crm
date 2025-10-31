import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { Issue, Account, Contact, ISSUE_STATUSES, ISSUE_PRIORITIES } from '../../types'
import { Button, Input, Textarea } from '../../components/ui'

export default function IssueForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const accountIdFromQuery = searchParams.get('accountId')

  const { data: issue } = useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const response = await api.get(`/Issues(${id})`)
      return response.data as Issue
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

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await api.get('/Contacts')
      return response.data
    },
  })

  const getInitialFormData = (): Partial<Issue> => {
    if (issue) {
      return {
        AccountID: issue.AccountID,
        ContactID: issue.ContactID || undefined,
        Title: issue.Title,
        Description: issue.Description || '',
        Status: issue.Status,
        Priority: issue.Priority,
        AssignedTo: issue.AssignedTo || '',
        Resolution: issue.Resolution || '',
        DueDate: issue.DueDate || undefined,
      }
    }
    return {
      AccountID: accountIdFromQuery ? parseInt(accountIdFromQuery) : 0,
      ContactID: undefined,
      Title: '',
      Description: '',
      Status: 'New',
      Priority: 'Medium',
      AssignedTo: '',
      Resolution: '',
      DueDate: undefined,
    }
  }

  const [formData, setFormData] = useState<Partial<Issue>>(getInitialFormData())

  // Reset form data when issue ID changes
  useEffect(() => {
    setFormData(getInitialFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Issue>) => {
      // Clean up the data before sending
      const cleanData = { ...data }
      if (!cleanData.ContactID) {
        delete cleanData.ContactID
      }
      if (!cleanData.DueDate) {
        delete cleanData.DueDate
      }

      if (isEdit) {
        return api.patch(`/Issues(${id})`, cleanData)
      } else {
        return api.post('/Issues', cleanData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['issue', id] })
      }
      navigate(isEdit ? `/issues/${id}` : '/issues')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value: string | number | undefined = e.target.value

    if (e.target.name === 'AccountID' || e.target.name === 'ContactID') {
      value = value ? parseInt(value) : undefined
    }

    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  const accounts = accountsData?.items || []
  const contacts = contactsData?.items || []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Issue' : 'Create Issue'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Title"
              type="text"
              name="Title"
              value={formData.Title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
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
            <label htmlFor="ContactID" className="label">
              Contact (Optional)
            </label>
            <select
              id="ContactID"
              name="ContactID"
              value={formData.ContactID || ''}
              onChange={handleChange}
              className="input"
            >
              <option value="">None</option>
              {contacts.map((contact: Contact) => (
                <option key={contact.ID} value={contact.ID}>
                  {contact.FirstName} {contact.LastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="Status" className="label">
              Status *
            </label>
            <select
              id="Status"
              name="Status"
              value={formData.Status}
              onChange={handleChange}
              required
              className="input"
            >
              {ISSUE_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="Priority" className="label">
              Priority *
            </label>
            <select
              id="Priority"
              name="Priority"
              value={formData.Priority}
              onChange={handleChange}
              required
              className="input"
            >
              {ISSUE_PRIORITIES.map(priority => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="AssignedTo" className="label">
              Assigned To
            </label>
            <input
              type="text"
              id="AssignedTo"
              name="AssignedTo"
              value={formData.AssignedTo}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <Input
              label="Due Date"
              type="date"
              name="DueDate"
              value={formData.DueDate ? new Date(formData.DueDate).toISOString().split('T')[0] : ''}
              onChange={handleChange}
            />
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

          <div className="md:col-span-2">
            <Textarea
              label="Resolution"
              name="Resolution"
              value={formData.Resolution}
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
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Issue' : 'Create Issue'}
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
