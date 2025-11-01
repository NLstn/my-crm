import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import type { Task, Account, Contact, Employee, Opportunity } from '../../types'
import { TASK_STATUSES } from '../../types'
import { Button, Input, Textarea } from '../../components/ui'

export default function TaskForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const accountIdFromQuery = searchParams.get('accountId')
  const contactIdFromQuery = searchParams.get('contactId')
  const titleFromQuery = searchParams.get('title')
  const ownerFromQuery = searchParams.get('owner')
  const opportunityIdFromQuery = searchParams.get('opportunityId')

  const { data: task } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await api.get(`/Tasks(${id})`)
      return response.data as Task
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

  const getInitialFormData = (): Partial<Task> => {
    if (task) {
      return {
        AccountID: task.AccountID,
        ContactID: task.ContactID || undefined,
        EmployeeID: task.EmployeeID || undefined,
        OpportunityID: task.OpportunityID || undefined,
        Title: task.Title,
        Description: task.Description || '',
        Owner: task.Owner,
        Status: task.Status,
        DueDate: task.DueDate,
        CompletedAt: task.CompletedAt || undefined,
      }
    }

    const defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 3)
    const dueDateValue = new Date(defaultDueDate.getTime() - defaultDueDate.getTimezoneOffset() * 60000).toISOString()

    return {
      AccountID: accountIdFromQuery ? parseInt(accountIdFromQuery) : 0,
      ContactID: contactIdFromQuery ? parseInt(contactIdFromQuery) : undefined,
      EmployeeID: undefined,
      OpportunityID: opportunityIdFromQuery ? parseInt(opportunityIdFromQuery) : undefined,
      Title: titleFromQuery || '',
      Description: '',
      Owner: ownerFromQuery || '',
      Status: 1,
      DueDate: dueDateValue,
      CompletedAt: undefined,
    }
  }

  const [formData, setFormData] = useState<Partial<Task>>(getInitialFormData())

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

  const { data: opportunitiesData } = useQuery({
    queryKey: ['account-opportunities', selectedAccountId],
    queryFn: async () => {
      const response = await api.get('/Opportunities', {
        params: {
          $filter: `AccountID eq ${selectedAccountId}`,
          $select: 'ID,Name,Stage',
          $orderby: 'ExpectedCloseDate desc',
        },
      })
      return response.data
    },
    enabled: Boolean(selectedAccountId),
  })

  useEffect(() => {
    setFormData(getInitialFormData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, task])

  useEffect(() => {
    if (!selectedAccountId && (formData.ContactID || formData.OpportunityID)) {
      setFormData(prev => ({
        ...prev,
        ContactID: undefined,
        OpportunityID: undefined,
      }))
    }
  }, [selectedAccountId, formData.ContactID, formData.OpportunityID])

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

  useEffect(() => {
    if (!formData.OpportunityID) {
      return
    }

    const opportunities = opportunitiesData?.items as Opportunity[] | undefined
    if (!opportunities) {
      return
    }

    const opportunityBelongsToAccount = opportunities.some(opportunity => opportunity.ID === formData.OpportunityID)
    if (!opportunityBelongsToAccount) {
      setFormData(prev => ({
        ...prev,
        OpportunityID: undefined,
      }))
    }
  }, [opportunitiesData, formData.OpportunityID])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const cleanData = { ...data }
      if (!cleanData.ContactID) {
        delete cleanData.ContactID
      }
      if (!cleanData.EmployeeID) {
        delete cleanData.EmployeeID
      }
      if (!cleanData.OpportunityID) {
        delete cleanData.OpportunityID
      }
      if (!cleanData.CompletedAt) {
        delete cleanData.CompletedAt
      }
      if (cleanData.DueDate) {
        cleanData.DueDate = new Date(cleanData.DueDate).toISOString()
      }
      if (cleanData.CompletedAt) {
        cleanData.CompletedAt = new Date(cleanData.CompletedAt).toISOString()
      }

      if (isEdit) {
        return api.patch(`/Tasks(${id})`, cleanData)
      }

      return api.post('/Tasks', cleanData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['task', id] })
      }

      if (variables.AccountID) {
        queryClient.invalidateQueries({ queryKey: ['account', variables.AccountID.toString()] })
      }

      if (variables.OpportunityID) {
        queryClient.invalidateQueries({ queryKey: ['opportunity', variables.OpportunityID.toString()] })
      }

      if (!isEdit && opportunityIdFromQuery) {
        navigate(`/opportunities/${opportunityIdFromQuery}`)
        return
      }

      if (!isEdit && accountIdFromQuery) {
        navigate(`/accounts/${accountIdFromQuery}`)
        return
      }

      navigate(isEdit ? `/tasks/${id}` : '/tasks')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value: string | number | undefined = e.target.value

    if (
      e.target.name === 'AccountID' ||
      e.target.name === 'ContactID' ||
      e.target.name === 'EmployeeID' ||
      e.target.name === 'Status' ||
      e.target.name === 'OpportunityID'
    ) {
      value = value ? parseInt(value) : undefined
    }

    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  const accounts = accountsData?.items || []
  const contacts = selectedAccountId ? ((contactsData?.items as Contact[]) || []) : []
  const opportunities = selectedAccountId ? ((opportunitiesData?.items as Opportunity[]) || []) : []
  const employees = (employeesData?.items as Employee[]) || []

  const dueDateValue = formData.DueDate
    ? new Date(formData.DueDate).toISOString().slice(0, 10)
    : ''

  const completedAtValue = formData.CompletedAt
    ? new Date(formData.CompletedAt).toISOString().slice(0, 10)
    : ''

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Task' : 'Create Task'}
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
            <label htmlFor="OpportunityID" className="label">
              Opportunity
            </label>
            <select
              id="OpportunityID"
              name="OpportunityID"
              value={formData.OpportunityID || ''}
              onChange={handleChange}
              disabled={!formData.AccountID}
              className="input"
            >
              <option value="">None</option>
              {opportunities.map((opportunity: Opportunity) => (
                <option key={opportunity.ID} value={opportunity.ID}>
                  {opportunity.Name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="EmployeeID" className="label">
              Assigned Employee
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
              label="Title"
              type="text"
              name="Title"
              value={formData.Title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Input
              label="Owner"
              type="text"
              name="Owner"
              value={formData.Owner}
              onChange={handleChange}
              required
            />
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
              {TASK_STATUSES().map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Due Date"
              type="date"
              name="DueDate"
              value={dueDateValue}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Input
              label="Completed Date"
              type="date"
              name="CompletedAt"
              value={completedAtValue}
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
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
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
