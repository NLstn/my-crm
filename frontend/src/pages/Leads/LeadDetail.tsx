import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useConvertLead, useDeleteLead, useLead } from '../../lib/hooks/leads'

interface ConversionResult {
  accountId: number
  contactId: number
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [overrideAccountName, setOverrideAccountName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showConvertOptions, setShowConvertOptions] = useState(false)
  const [conversionMessage, setConversionMessage] = useState('')
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)

  // Always call hooks before any conditional returns
  const { data: lead, isLoading, error } = useLead(id, 'ConvertedAccount,ConvertedContact')
  const deleteMutation = useDeleteLead(id || '')
  const convertMutation = useConvertLead(id || '')

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

  const isConverted = lead.Status === 'Converted' || Boolean(lead.ConvertedAccountID)

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => navigate('/leads'),
    })
  }

  const handleConvert = () => {
    convertMutation.mutate(
      overrideAccountName ? { AccountName: overrideAccountName } : undefined,
      {
        onSuccess: (data) => {
          setConversionMessage('Lead converted successfully.')
          setConversionResult({ accountId: data.AccountID, contactId: data.ContactID })
          setOverrideAccountName('')
          setShowConvertOptions(false)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{lead.Name}</h1>
            <span className={`badge ${isConverted ? 'badge-success' : 'badge-secondary'}`}>{lead.Status}</span>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Captured {new Date(lead.CreatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={`/leads/${id}/edit`} className="btn btn-primary">
            Edit Lead
          </Link>
          {!isConverted && (
            <Button variant="secondary" onClick={() => setShowConvertOptions((prev) => !prev)}>
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
              Account{' '}
              <Link to={`/accounts/${conversionResult.accountId}`} className="text-primary-600 hover:underline">
                #{conversionResult.accountId}
              </Link>{' '}
              and contact{' '}
              <Link to={`/contacts/${conversionResult.contactId}`} className="text-primary-600 hover:underline">
                #{conversionResult.contactId}
              </Link>{' '}
              were created from this lead.
            </p>
          )}
        </div>
      )}

      {showConvertOptions && !isConverted && (
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Convert to Account &amp; Contact</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Optionally override the account name before conversion. Leave blank to reuse the lead company or name.
            </p>
          </div>
          <Input
            label="Account Name Override"
            placeholder={lead.Company || lead.Name}
            value={overrideAccountName}
            onChange={(event) => setOverrideAccountName(event.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={handleConvert} disabled={convertMutation.isPending}>
              {convertMutation.isPending ? 'Converting...' : 'Convert Lead'}
            </Button>
            <Button variant="secondary" onClick={() => setShowConvertOptions(false)} disabled={convertMutation.isPending}>
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
                  <a href={lead.Website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
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
