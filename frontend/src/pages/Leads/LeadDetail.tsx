import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import TaskList from '../../components/TaskList'
import Timeline from '../../components/Timeline'
import api from '../../lib/api'
import { useConvertLead, useDeleteLead, useLead } from '../../lib/hooks/leads'
import type { Account, Contact, Task, Activity } from '../../types'

const escapeODataValue = (value: string) => value.replace(/'/g, "''")

interface ConversionResult {
  accountId: number
  contactId: number
  accountReused: boolean
  contactReused: boolean
}

type ConvertLeadPayload = {
  AccountName?: string
  ExistingAccountID?: number
  ExistingContactID?: number
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [overrideAccountName, setOverrideAccountName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showConvertOptions, setShowConvertOptions] = useState(false)
  const [conversionMessage, setConversionMessage] = useState('')
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [selectedAccountOption, setSelectedAccountOption] = useState<'new' | string>('new')
  const [selectedContactOption, setSelectedContactOption] = useState<'new' | string>('new')

  // Always call hooks before any conditional returns
  const { data: lead, isLoading, error } = useLead(
    id,
    'ConvertedAccount,ConvertedContact',
  )
  const deleteMutation = useDeleteLead(id || '')
  const convertMutation = useConvertLead(id || '')

  const {
    data: leadTasksData,
    isLoading: isLoadingLeadTasks,
    error: leadTasksError,
  } = useQuery({
    queryKey: ['lead', id, 'tasks'],
    queryFn: async () => {
      const filter = encodeURIComponent(`LeadID eq ${id} and Status ne 3 and Status ne 5`)
      const response = await api.get(
        `/Tasks?$filter=${filter}&$orderby=DueDate asc&$top=5&$expand=Lead,Employee,Account,Contact`,
      )
      return response.data
    },
    enabled: Boolean(id),
  })

  const {
    data: leadActivitiesData,
    isLoading: isLoadingLeadActivities,
    error: leadActivitiesError,
  } = useQuery({
    queryKey: ['lead', id, 'activities'],
    queryFn: async () => {
      const filter = encodeURIComponent(`LeadID eq ${id}`)
      const response = await api.get(
        `/Activities?$filter=${filter}&$orderby=ActivityTime desc&$top=5&$expand=Lead,Employee,Account,Contact`,
      )
      return response.data
    },
    enabled: Boolean(id),
  })

  const leadIsConverted = lead?.Status === 'Converted' || Boolean(lead?.ConvertedAccountID)

  const hasAccountSearchContext =
    Boolean(lead?.Company?.trim()) || Boolean(lead?.Email?.trim()) || Boolean(lead?.Phone?.trim())
  const shouldFetchAccountMatches =
    Boolean(showConvertOptions && lead && !leadIsConverted && hasAccountSearchContext)

  const accountMatchesQuery = useQuery<Account[]>({
    queryKey: ['lead-convert-account-matches', id, lead?.Company, lead?.Email, lead?.Phone],
    queryFn: async () => {
      if (!lead) {
        return []
      }

      const params = new URLSearchParams()
      params.set('$top', '10')
      params.set('$orderby', 'UpdatedAt desc')

      const filters: string[] = []

      if (lead.Company?.trim()) {
        filters.push(`contains(Name, '${escapeODataValue(lead.Company.trim())}')`)
      }
      if (lead.Email?.trim()) {
        filters.push(`Email eq '${escapeODataValue(lead.Email.trim())}'`)
      }
      if (lead.Phone?.trim()) {
        filters.push(`Phone eq '${escapeODataValue(lead.Phone.trim())}'`)
      }

      if (filters.length > 0) {
        params.set('$filter', filters.map((part) => `(${part})`).join(' or '))
      }

      const response = await api.get(`/Accounts?${params.toString()}`)
      const data = response.data as { items?: Account[] }
      return data.items ?? []
    },
    enabled: shouldFetchAccountMatches,
    staleTime: 5 * 60 * 1000,
  })

  const hasContactSearchContext =
    Boolean(lead?.Email?.trim()) ||
    Boolean(lead?.Phone?.trim()) ||
    Boolean(lead?.Name?.trim()) ||
    Boolean(lead?.Company?.trim())
  const shouldFetchContactMatches =
    Boolean(showConvertOptions && lead && !leadIsConverted && hasContactSearchContext)

  const contactMatchesQuery = useQuery<Contact[]>({
    queryKey: [
      'lead-convert-contact-matches',
      id,
      lead?.Name,
      lead?.Email,
      lead?.Phone,
      lead?.Company,
    ],
    queryFn: async () => {
      if (!lead) {
        return []
      }

      const params = new URLSearchParams()
      params.set('$top', '10')
      params.set('$orderby', 'UpdatedAt desc')
      params.set('$expand', 'Account')

      const filters: string[] = []

      if (lead.Email?.trim()) {
        filters.push(`Email eq '${escapeODataValue(lead.Email.trim())}'`)
      }
      if (lead.Phone?.trim()) {
        filters.push(`Phone eq '${escapeODataValue(lead.Phone.trim())}'`)
      }
      if (lead.Name?.trim()) {
        const nameParts = lead.Name.trim().split(/\s+/)
        if (nameParts[0]) {
          filters.push(`contains(FirstName, '${escapeODataValue(nameParts[0])}')`)
        }
        if (nameParts.length > 1) {
          const lastName = nameParts.slice(1).join(' ')
          filters.push(`contains(LastName, '${escapeODataValue(lastName)}')`)
        }
      }
      if (lead.Company?.trim()) {
        filters.push(`contains(Account/Name, '${escapeODataValue(lead.Company.trim())}')`)
      }

      if (filters.length > 0) {
        params.set('$filter', filters.map((part) => `(${part})`).join(' or '))
      }

      const response = await api.get(`/Contacts?${params.toString()}`)
      const data = response.data as { items?: Contact[] }
      return data.items ?? []
    },
    enabled: shouldFetchContactMatches,
    staleTime: 5 * 60 * 1000,
  })

  const accountMatches = accountMatchesQuery.data ?? []
  const contactMatches = contactMatchesQuery.data ?? []

  const resetConversionChoices = () => {
    setSelectedAccountOption('new')
    setSelectedContactOption('new')
    setOverrideAccountName('')
  }

  const handleToggleConvertOptions = () => {
    setShowConvertOptions((prev) => {
      const next = !prev
      if (!next) {
        resetConversionChoices()
      }
      return next
    })
  }

  const handleAccountSelection = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setSelectedAccountOption(value)
    if (value !== 'new') {
      setOverrideAccountName('')
    }
  }

  const handleContactSelection = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setSelectedContactOption(value)
    if (value !== 'new') {
      const parsedContactId = Number.parseInt(value, 10)
      const matchingContact = contactMatches.find((match) => match.ID === parsedContactId)
      if (matchingContact) {
        setSelectedAccountOption(String(matchingContact.AccountID))
      }
    }
  }

  const handleCancelConvert = () => {
    resetConversionChoices()
    setShowConvertOptions(false)
  }


  if (!id) {
    return (
      <div className="text-center py-12 text-error-600 dark:text-error-400">
        Lead identifier is missing.
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading lead...</div>
  }

  if (error || !lead) {
    return (
      <div className="text-center py-12 text-error-600 dark:text-error-400">
        Unable to load lead details.
      </div>
    )
  }

  const isConverted = leadIsConverted
  const openTasks = (leadTasksData?.items as Task[]) || []
  const recentActivities = (leadActivitiesData?.items as Activity[]) || []
  const tasksErrorMessage = leadTasksError as Error | null
  const activitiesErrorMessage = leadActivitiesError as Error | null
  const quickTaskTitle = `Follow up with ${lead.Name}`
  const quickTaskUrl = `/tasks/new?leadId=${id}&title=${encodeURIComponent(quickTaskTitle)}`
  const quickActivityUrl = `/activities/new?leadId=${id}`

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => navigate('/leads'),
    })
  }

  const handleConvert = () => {
    const payload: ConvertLeadPayload = {}
    if (selectedAccountOption === 'new') {
      const trimmedOverride = overrideAccountName.trim()
      if (trimmedOverride) {
        payload.AccountName = trimmedOverride
      }
    } else {
      const parsedAccountId = Number.parseInt(selectedAccountOption, 10)
      if (!Number.isNaN(parsedAccountId)) {
        payload.ExistingAccountID = parsedAccountId
      }
    }

    if (selectedContactOption !== 'new') {
      const parsedContactId = Number.parseInt(selectedContactOption, 10)
      if (!Number.isNaN(parsedContactId)) {
        payload.ExistingContactID = parsedContactId
        if (!payload.ExistingAccountID) {
          const matchingContact = contactMatches.find((match) => match.ID === parsedContactId)
          if (matchingContact) {
            payload.ExistingAccountID = matchingContact.AccountID
          }
        }
      }
    }

    const requestBody = Object.keys(payload).length > 0 ? payload : undefined

    convertMutation.mutate(requestBody, {
      onSuccess: (data) => {
        const accountActionWord = data.AccountReused ? 'Reused' : 'Created'
        const contactActionWord = data.ContactReused ? 'reused' : 'created'

        setConversionMessage(
          `Lead converted successfully. ${accountActionWord} account #${data.AccountID} and ${contactActionWord} contact #${data.ContactID}.`,
        )
        setConversionResult({
          accountId: data.AccountID,
          contactId: data.ContactID,
          accountReused: data.AccountReused,
          contactReused: data.ContactReused,
        })
        resetConversionChoices()
        setShowConvertOptions(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{lead.Name}</h1>
            <span className={`badge ${isConverted ? 'badge-success' : 'badge-secondary'}`}>
              {lead.Status}
            </span>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Captured {new Date(lead.CreatedAt).toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Owner:{' '}
            {lead.OwnerEmployee ? (
              <Link
                to={`/employees/${lead.OwnerEmployee.ID}`}
                className="text-primary-600 hover:underline"
              >
                {lead.OwnerEmployee.FirstName} {lead.OwnerEmployee.LastName}
              </Link>
            ) : (
              <span className="text-gray-700 dark:text-gray-300">Unassigned</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={`/leads/${id}/edit`} className="btn btn-primary">
            Edit Lead
          </Link>
          {!isConverted && (
            <Button variant="secondary" onClick={handleToggleConvertOptions}>
              {showConvertOptions ? 'Cancel Convert' : 'Convert Lead'}
            </Button>
          )}
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete
          </Button>
        </div>
      </div>

      {(conversionMessage || conversionResult) && (
        <div className="card border border-success-200 dark:border-success-800 bg-success-50/80 dark:bg-success-900/10 p-4 space-y-2">
          {conversionMessage && (
            <p className="text-success-700 dark:text-success-300">{conversionMessage}</p>
          )}
          {conversionResult && (
            <p className="text-sm text-success-700 dark:text-success-300">
              This conversion {conversionResult.accountReused ? 'reused' : 'created'} account{' '}
              <Link
                to={`/accounts/${conversionResult.accountId}`}
                className="text-primary-600 hover:underline"
              >
                #{conversionResult.accountId}
              </Link>{' '}
              and {conversionResult.contactReused ? 'reused' : 'created'} contact{' '}
              <Link
                to={`/contacts/${conversionResult.contactId}`}
                className="text-primary-600 hover:underline"
              >
                #{conversionResult.contactId}
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {showConvertOptions && !isConverted && (
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Convert to Account &amp; Contact
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose whether to reuse existing records or create new ones. Account overrides apply
              only when creating a new account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="convert-account-option" className="label">
                Account Handling
              </label>
              <select
                id="convert-account-option"
                className="input"
                value={selectedAccountOption}
                onChange={handleAccountSelection}
                disabled={convertMutation.isPending}
              >
                <option value="new">
                  {`Create new account (${lead.Company || lead.Name})`}
                </option>
                {accountMatchesQuery.isPending && (
                  <option value="" disabled>
                    Loading matching accounts...
                  </option>
                )}
                {!accountMatchesQuery.isPending &&
                  shouldFetchAccountMatches &&
                  accountMatches.length === 0 && (
                    <option value="" disabled>
                      No matching accounts found
                    </option>
                  )}
                {accountMatches.map((account) => (
                  <option key={account.ID} value={String(account.ID)}>
                    {`Reuse account #${account.ID} — ${account.Name}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {hasAccountSearchContext
                  ? 'Suggestions are based on the lead company, email, and phone.'
                  : 'Add company, email, or phone details to see account suggestions.'}
              </p>
              {accountMatchesQuery.isError && (
                <p className="text-xs text-error-600 dark:text-error-400">
                  Unable to load account suggestions.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="convert-contact-option" className="label">
                Contact Handling
              </label>
              <select
                id="convert-contact-option"
                className="input"
                value={selectedContactOption}
                onChange={handleContactSelection}
                disabled={convertMutation.isPending}
              >
                <option value="new">{`Create new contact (${lead.Name})`}</option>
                {contactMatchesQuery.isPending && (
                  <option value="" disabled>
                    Loading matching contacts...
                  </option>
                )}
                {!contactMatchesQuery.isPending &&
                  shouldFetchContactMatches &&
                  contactMatches.length === 0 && (
                    <option value="" disabled>
                      No matching contacts found
                    </option>
                  )}
                {contactMatches.map((contact) => (
                  <option key={contact.ID} value={String(contact.ID)}>
                    {`Reuse contact #${contact.ID} — ${contact.FirstName} ${contact.LastName}${
                      contact.Account ? ` (${contact.Account.Name})` : ''
                    }`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Selecting an existing contact automatically links the conversion to that account.
              </p>
              {contactMatchesQuery.isError && (
                <p className="text-xs text-error-600 dark:text-error-400">
                  Unable to load contact suggestions.
                </p>
              )}
            </div>
          </div>

          <Input
            label="Account Name Override"
            placeholder={lead.Company || lead.Name}
            value={overrideAccountName}
            onChange={(event) => setOverrideAccountName(event.target.value)}
            disabled={selectedAccountOption !== 'new' || convertMutation.isPending}
          />
          {selectedAccountOption !== 'new' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Account name overrides are disabled when reusing an existing account.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={handleConvert} disabled={convertMutation.isPending}>
              {convertMutation.isPending ? 'Converting...' : 'Convert Lead'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancelConvert}
              disabled={convertMutation.isPending}
            >
              Cancel
            </Button>
          </div>
          {convertMutation.error && (
            <p className="text-sm text-error-600 dark:text-error-400">
              {(convertMutation.error as Error).message || 'Unable to convert lead.'}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lead Details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Owner</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {lead.OwnerEmployee ? (
                  <Link
                    to={`/employees/${lead.OwnerEmployee.ID}`}
                    className="text-primary-600 hover:underline"
                  >
                    {lead.OwnerEmployee.FirstName} {lead.OwnerEmployee.LastName}
                  </Link>
                ) : (
                  'Unassigned'
                )}
              </dd>
            </div>
            {lead.Company && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Company</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.Company}</dd>
              </div>
            )}
            {lead.Title && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.Title}</dd>
              </div>
            )}
            {lead.Email && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  <a href={`mailto:${lead.Email}`} className="text-primary-600 hover:underline">
                    {lead.Email}
                  </a>
                </dd>
              </div>
            )}
            {lead.Phone && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.Phone}</dd>
              </div>
            )}
            {lead.Website && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Website</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  <a
                    href={lead.Website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {lead.Website}
                  </a>
                </dd>
              </div>
            )}
            {lead.Source && (
              <div>
                <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Source</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.Source}</dd>
              </div>
            )}
          </dl>
          {lead.Notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</h3>
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{lead.Notes}</p>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Conversion Status</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <div>
              Status:{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{lead.Status}</span>
            </div>
            {lead.ConvertedAt && (
              <div>Converted: {new Date(lead.ConvertedAt).toLocaleString()}</div>
            )}
            {lead.ConvertedAccount && (
              <div>
                Account:{' '}
                <Link to={`/accounts/${lead.ConvertedAccount.ID}`} className="text-primary-600 hover:underline">
                  {lead.ConvertedAccount.Name}
                </Link>
              </div>
            )}
            {lead.ConvertedContact && (
              <div>
                Contact:{' '}
                <Link to={`/contacts/${lead.ConvertedContact.ID}`} className="text-primary-600 hover:underline">
                  {lead.ConvertedContact.FirstName} {lead.ConvertedContact.LastName}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Open Tasks</h2>
            <Link to={quickTaskUrl} className="btn btn-primary text-sm">
              New Task
            </Link>
          </div>
          {isLoadingLeadTasks ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading tasks...</p>
          ) : tasksErrorMessage ? (
            <p className="text-sm text-error-600 dark:text-error-400">
              Unable to load tasks: {tasksErrorMessage.message}
            </p>
          ) : (
            <TaskList
              tasks={openTasks}
              emptyMessage="No open tasks for this lead"
              renderTitle={(task: Task) => (
                <Link to={`/tasks/${task.ID}`} className="text-primary-600 hover:underline">
                  {task.Title}
                </Link>
              )}
            />
          )}
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activities</h2>
            <Link to={quickActivityUrl} className="btn btn-secondary text-sm">
              Log Activity
            </Link>
          </div>
          {isLoadingLeadActivities ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading activities...</p>
          ) : activitiesErrorMessage ? (
            <p className="text-sm text-error-600 dark:text-error-400">
              Unable to load activities: {activitiesErrorMessage.message}
            </p>
          ) : (
            <Timeline
              activities={recentActivities}
              emptyMessage="No recent activity for this lead"
              renderSubject={(activity: Activity) => (
                <Link to={`/activities/${activity.ID}`} className="text-primary-600 hover:underline">
                  {activity.Subject}
                </Link>
              )}
            />
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="card border border-error-200 dark:border-error-800 bg-error-50/80 dark:bg-error-900/10 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-error-600 dark:text-error-400">Delete Lead</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Lead'}
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
          </div>
          {deleteMutation.error && (
            <p className="text-sm text-error-600 dark:text-error-400">
              {(deleteMutation.error as Error).message || 'Failed to delete lead.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
