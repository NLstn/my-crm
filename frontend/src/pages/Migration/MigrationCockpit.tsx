import { useState } from 'react'
import { useMutation, type QueryKey } from '@tanstack/react-query'
import { Button, Input } from '@/components/ui'
import api from '../../lib/api'
import { useCsvUpload, type CsvStatus } from '../../hooks/useCsvUpload'

type MigrationEntity = {
  key: string
  label: string
  description: string
  successNoun: string
  importAction: string
  exportAction: string
  sampleTemplateHref: string
  queryKey?: QueryKey
}

type StatusMessage = CsvStatus | null

const MIGRATION_ENTITIES: MigrationEntity[] = [
  {
    key: 'accounts',
    label: 'Accounts',
    description: 'Import or export customer account records in bulk, including company details and contact information.',
    successNoun: 'account',
    importAction: '/ImportAccountsCSV',
    exportAction: '/ExportAccountsCSV',
    sampleTemplateHref: '/templates/accounts-sample.csv',
    queryKey: ['accounts'],
  },
  {
    key: 'contacts',
    label: 'Contacts',
    description: 'Manage people associated with your accounts. Imports support primary contact flags and email addresses.',
    successNoun: 'contact',
    importAction: '/ImportContactsCSV',
    exportAction: '/ExportContactsCSV',
    sampleTemplateHref: '/templates/contacts-sample.csv',
    queryKey: ['contacts'],
  },
  {
    key: 'leads',
    label: 'Leads',
    description: 'Bring in prospect lists or export marketing outreach data, including lifecycle status updates.',
    successNoun: 'lead',
    importAction: '/ImportLeadsCSV',
    exportAction: '/ExportLeadsCSV',
    sampleTemplateHref: '/templates/leads-sample.csv',
    queryKey: ['leads'],
  },
]

function MigrationTile({ entity }: { entity: MigrationEntity }) {
  const [status, setStatus] = useState<StatusMessage>(null)

  const { selectedFile, handleFileInputChange, submit, isUploading, rowErrors } = useCsvUpload({
    importAction: entity.importAction,
    entityLabel: entity.label,
    queryKey: entity.queryKey,
    formatSuccessMessage: (count) =>
      `Imported ${count} ${entity.successNoun}${count === 1 ? '' : 's'} successfully.`,
    formatErrorMessage: () =>
      `Failed to import ${entity.label.toLowerCase()} data. Please review the CSV file and try again.`,
    onStatusChange: setStatus,
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(entity.exportAction, undefined, { responseType: 'blob' })
      return response.data as Blob
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${entity.key}-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setStatus({
        type: 'success',
        message: `${entity.label} export started. Your download should begin shortly.`,
      })
    },
    onError: () => {
      setStatus({
        type: 'error',
        message: `Failed to export ${entity.label.toLowerCase()}. Please try again.`,
      })
    },
  })

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{entity.label}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{entity.description}</p>
      </div>

      {status && (
        <div
          className={`rounded-md border p-4 text-sm ${
            status.type === 'success'
              ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-950 dark:text-success-200'
              : 'border-error-200 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-200'
          }`}
        >
          {status.message}
        </div>
      )}

      {rowErrors.length > 0 && (
        <div className="rounded-md border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-200">
          <p className="font-semibold">Validation errors</p>
          <ul className="mt-2 space-y-1 pl-4">
            {rowErrors.map((error) => (
              <li key={`${error.row}-${error.field}`}>
                Row {error.row}: {error.field} {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            disabled={isUploading}
          />
          <Button onClick={submit} disabled={isUploading}>
            {isUploading ? 'Uploading…' : 'Start Import'}
          </Button>
        </div>
        {selectedFile && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Selected file: {selectedFile.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="secondary"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
        </Button>
        <a
          href={entity.sampleTemplateHref}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          download
        >
          Download sample CSV
        </a>
      </div>
    </section>
  )
}

export default function MigrationCockpit() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Migration Cockpit</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Centralize imports and exports for core CRM entities. Use the sample templates to format your CSV files before
          uploading.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {MIGRATION_ENTITIES.map((entity) => (
          <MigrationTile key={entity.key} entity={entity} />
        ))}
      </div>
    </div>
  )
}
