import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import type { Activity, Account, Contact, Employee } from '../../types'
import { Button, Input, Textarea } from '../../components/ui'

const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Note', 'Onsite Visit', 'Follow-up']

export default function ActivityForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const accountIdFromQuery = searchParams.get('accountId')
  const contactIdFromQuery = searchParams.get('contactId')

  const { data: activity } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const response = await api.get(`/Activities(${id})`)
      return response.data as Activity
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

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/Employees')
      return response.data
    },
  })

  const getInitialFormData = (): Partial<Activity> => {
    if (activity) {
      return {
        AccountID: activity.AccountID,
        ContactID: activity.ContactID || undefined,
        EmployeeID: activity.EmployeeID || undefined,
        Subject: activity.Subject,
        ActivityType: activity.ActivityType,
        Outcome: activity.Outcome || '',
        Notes: activity.Notes || '',
        ActivityTime: activity.ActivityTime,
      }
    }

    const now = new Date()
    const defaultTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString()

    return {
      AccountID: accountIdFromQuery ? parseInt(accountIdFromQuery) : 0,
      ContactID: contactIdFromQuery ? parseInt(contactIdFromQuery) : undefined,
      EmployeeID: undefined,
      Subject: '',
      ActivityType: ACTIVITY_TYPES[0],
      Outcome: '',
      Notes: '',
      ActivityTime: defaultTime,
    }
  }

  const [formData, setFormData] = useState<Partial<Activity>>(getInitialFormData())

  const selectedAccountId = formData.AccountID

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', selectedAccountId],
    queryFn: async () => {
      const response = await api.get('/Contacts', {
        params: {
          $filter: `AccountID eq ${selectedAccountId}`,
        },
      })
      return response.data
    },
    enabled: Boolean(selectedAccountId),
  })

  useEffect(() => {
    setFormData(getInitialFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activity])

  useEffect(() => {
    if (!selectedAccountId && formData.ContactID) {
      setFormData(prev => ({
        ...prev,
        ContactID: undefined,
      }))
    }
  }, [selectedAccountId, formData.ContactID])

  useEffect(() => {
    if (!formData.ContactID) {
      return
    }

    const contacts = contactsData?.items as Contact[] | undefined
    if (!contacts) {
      return
    }

    const contactBelongsToAccount = contacts.some(contact => contact.ID === formData.ContactID)
    if (!contactBelongsToAccount) {
      setFormData(prev => ({
        ...prev,
        ContactID: undefined,
      }))
    }
  }, [contactsData, formData.ContactID])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Activity>) => {
      const cleanData = { ...data }
      if (!cleanData.ContactID) {
        delete cleanData.ContactID
      }
      if (!cleanData.EmployeeID) {
        delete cleanData.EmployeeID
      }
      if (cleanData.ActivityTime) {
        const isoValue = new Date(cleanData.ActivityTime).toISOString()
        cleanData.ActivityTime = isoValue
      }

      if (isEdit) {
        return api.patch(`/Activities(${id})`, cleanData)
      }

      return api.post('/Activities', cleanData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['activity', id] })
      }

      if (variables.AccountID) {
        queryClient.invalidateQueries({ queryKey: ['account', variables.AccountID.toString()] })
      }

      if (!isEdit && accountIdFromQuery) {
        navigate(`/accounts/${accountIdFromQuery}`)
        return
      }

      navigate(isEdit ? `/activities/${id}` : '/activities')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value: string | number | undefined = e.target.value

    if (e.target.name === 'AccountID' || e.target.name === 'ContactID' || e.target.name === 'EmployeeID') {
      value = value ? parseInt(value) : undefined
    }

    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  const accounts = accountsData?.items || []
  const contacts = selectedAccountId ? ((contactsData?.items as Contact[]) || []) : []
  const employees = (employeesData?.items as Employee[]) || []

  const activityTimeValue = formData.ActivityTime
    ? new Date(formData.ActivityTime).toISOString().slice(0, 16)
    : ''

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Activity' : 'Log Activity'}
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
            <label htmlFor="ContactID" className="label">
              Contact
            </label>
            <select
              id="ContactID"
              name="ContactID"
              value={formData.ContactID || ''}
              onChange={handleChange}
              disabled={!formData.AccountID}
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
            <label htmlFor="EmployeeID" className="label">
              Owner
            </label>
            <select
              id="EmployeeID"
              name="EmployeeID"
              value={formData.EmployeeID || ''}
              onChange={handleChange}
              className="input"
            >
              <option value="">None</option>
              {employees.map((employee: Employee) => (
                <option key={employee.ID} value={employee.ID}>
                  {employee.FirstName} {employee.LastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Subject"
              type="text"
              name="Subject"
              value={formData.Subject}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="ActivityType" className="label">
              Activity Type *
            </label>
            <select
              id="ActivityType"
              name="ActivityType"
              value={formData.ActivityType}
              onChange={handleChange}
              required
              className="input"
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Activity Time"
              type="datetime-local"
              name="ActivityTime"
              value={activityTimeValue}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Input
              label="Outcome"
              type="text"
              name="Outcome"
              value={formData.Outcome}
              onChange={handleChange}
            />
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
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Activity' : 'Save Activity'}
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
