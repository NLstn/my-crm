import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { Opportunity, Account, Contact, Employee, OPPORTUNITY_STAGES } from '../../types'
import { Button, Input, Textarea } from '../../components/ui'

export default function OpportunityForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const accountIdFromQuery = searchParams.get('accountId')
  const contactIdFromQuery = searchParams.get('contactId')

  const stageOptions = OPPORTUNITY_STAGES()
  const defaultStage = stageOptions[0]?.value ?? 1

  const { data: opportunity } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const response = await api.get(`/Opportunities(${id})`)
      return response.data as Opportunity
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

  const getInitialFormData = (): Partial<Opportunity> => {
    if (opportunity) {
      return {
        AccountID: opportunity.AccountID,
        ContactID: opportunity.ContactID,
        OwnerEmployeeID: opportunity.OwnerEmployeeID,
        Name: opportunity.Name,
        Amount: opportunity.Amount,
        Probability: opportunity.Probability,
        ExpectedCloseDate: opportunity.ExpectedCloseDate,
        Stage: opportunity.Stage,
        Description: opportunity.Description || '',
      }
    }

    return {
      AccountID: accountIdFromQuery ? parseInt(accountIdFromQuery, 10) : 0,
      ContactID: contactIdFromQuery ? parseInt(contactIdFromQuery, 10) : undefined,
      OwnerEmployeeID: undefined,
      Name: '',
      Amount: 0,
      Probability: 50,
      ExpectedCloseDate: undefined,
      Stage: defaultStage,
      Description: '',
    }
  }

  const [formData, setFormData] = useState<Partial<Opportunity>>(getInitialFormData())

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
  }, [id, opportunity?.ID])

  useEffect(() => {
    if (!selectedAccountId && formData.ContactID) {
      setFormData(prev => ({
        ...prev,
        ContactID: undefined,
      }))
    }
  }, [selectedAccountId, formData.ContactID])

  useEffect(() => {
    if (!formData.ContactID) return

    const accountContacts = contactsData?.items as Contact[] | undefined
    if (!accountContacts) return

    const contactMatchesAccount = accountContacts.some(contact => contact.ID === formData.ContactID)

    if (!contactMatchesAccount) {
      setFormData(prev => ({
        ...prev,
        ContactID: undefined,
      }))
    }
  }, [contactsData, formData.ContactID])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Opportunity>) => {
      const cleanData: Partial<Opportunity> = { ...data }

      if (!cleanData.ContactID) {
        delete cleanData.ContactID
      }
      if (!cleanData.OwnerEmployeeID) {
        delete cleanData.OwnerEmployeeID
      }
      if (!cleanData.ExpectedCloseDate) {
        delete cleanData.ExpectedCloseDate
      }

      if (isEdit) {
        return api.patch(`/Opportunities(${id})`, cleanData)
      }
      return api.post('/Opportunities', cleanData)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['opportunity', id] })
        navigate(`/opportunities/${id}`)
      } else {
        const created = response.data as Opportunity
        navigate(`/opportunities/${created.ID}`)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let parsedValue: string | number | undefined = value

    if (['AccountID', 'ContactID', 'OwnerEmployeeID', 'Stage'].includes(name)) {
      parsedValue = value ? parseInt(value, 10) : undefined
    }

    if (name === 'Probability') {
      parsedValue = value ? parseInt(value, 10) : undefined
    }

    if (name === 'Amount') {
      parsedValue = value ? parseFloat(value) : undefined
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue,
    }))
  }

  const accounts = (accountsData?.items as Account[]) || []
  const contacts = selectedAccountId ? ((contactsData?.items as Contact[]) || []) : []
  const employees = (employeesData?.items as Employee[]) || []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Opportunity' : 'Create Opportunity'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track pipeline details, ownership, and forecasted close dates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Opportunity Name"
              type="text"
              name="Name"
              value={formData.Name || ''}
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
              value={formData.AccountID || ''}
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
              className="input"
              disabled={!selectedAccountId}
            >
              <option value="">Select a contact</option>
              {contacts.map((contact: Contact) => (
                <option key={contact.ID} value={contact.ID}>
                  {contact.FirstName} {contact.LastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Amount *"
              type="number"
              name="Amount"
              min="0"
              step="0.01"
              value={formData.Amount ?? ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Input
              label="Probability (%) *"
              type="number"
              name="Probability"
              min="0"
              max="100"
              value={formData.Probability ?? ''}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="Stage" className="label">
              Stage *
            </label>
            <select
              id="Stage"
              name="Stage"
              value={formData.Stage || defaultStage}
              onChange={handleChange}
              required
              className="input"
            >
              {stageOptions.map(stage => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="OwnerEmployeeID" className="label">
              Owner
            </label>
            <select
              id="OwnerEmployeeID"
              name="OwnerEmployeeID"
              value={formData.OwnerEmployeeID || ''}
              onChange={handleChange}
              className="input"
            >
              <option value="">Unassigned</option>
              {employees.map((employee: Employee) => (
                <option key={employee.ID} value={employee.ID}>
                  {employee.FirstName} {employee.LastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Expected Close Date"
              type="date"
              name="ExpectedCloseDate"
              value={formData.ExpectedCloseDate ? new Date(formData.ExpectedCloseDate).toISOString().split('T')[0] : ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <Textarea
            label="Description"
            name="Description"
            value={formData.Description || ''}
            onChange={handleChange}
            rows={4}
            placeholder="Provide context, next steps, or key stakeholders for this opportunity."
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate(isEdit ? `/opportunities/${id}` : '/opportunities')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Opportunity'}
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-error-600 dark:text-error-400 text-sm">
            Failed to save opportunity. Please review the form and try again.
          </p>
        )}
      </form>
    </div>
  )
}
