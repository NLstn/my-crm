import { useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Button, Input } from '@/components/ui'
import api from '@/lib/api'
import { useMigrationJobs, type MigrationJob } from '@/hooks/useMigrationJobs'

type MigrationEntity = {
  key: string
  label: string
  description: string
  importAction: string
  exportAction: string
  sampleTemplateHref?: string
}

type StatusType = 'success' | 'error'

const MIGRATION_ENTITIES: MigrationEntity[] = [
  {
    key: 'accounts',
    label: 'Accounts',
    description: 'Import or export customer account records in bulk, including company details and contact information.',
    importAction: '/ImportAccountsCSV',
    exportAction: '/ExportAccountsCSV',
    sampleTemplateHref: '/templates/accounts-sample.csv',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    description: 'Manage people associated with your accounts. Imports support primary contact flags and email addresses.',
    importAction: '/ImportContactsCSV',
    exportAction: '/ExportContactsCSV',
    sampleTemplateHref: '/templates/contacts-sample.csv',
  },
  {
    key: 'leads',
    label: 'Leads',
    description: 'Bring in prospect lists or export marketing outreach data, including lifecycle status updates.',
    importAction: '/ImportLeadsCSV',
    exportAction: '/ExportLeadsCSV',
    sampleTemplateHref: '/templates/leads-sample.csv',
  },
  {
    key: 'activities',
    label: 'Activities',
    description: 'Track calls, meetings, and follow-ups tied to accounts, leads, or opportunities.',
    importAction: '/ImportActivitiesCSV',
    exportAction: '/ExportActivitiesCSV',
    sampleTemplateHref: '/templates/activities-sample.csv',
  },
  {
    key: 'issues',
    label: 'Issues',
    description: 'Queue support tickets and capture updates for customer incidents in one place.',
    importAction: '/ImportIssuesCSV',
    exportAction: '/ExportIssuesCSV',
    sampleTemplateHref: '/templates/issues-sample.csv',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    description: 'Bulk manage action items assigned to employees with due dates and completion state.',
    importAction: '/ImportTasksCSV',
    exportAction: '/ExportTasksCSV',
    sampleTemplateHref: '/templates/tasks-sample.csv',
  },
  {
    key: 'opportunities',
    label: 'Opportunities',
    description: 'Move pipeline stages forward by importing deals and exporting current forecasts.',
    importAction: '/ImportOpportunitiesCSV',
    exportAction: '/ExportOpportunitiesCSV',
    sampleTemplateHref: '/templates/opportunities-sample.csv',
  },
  {
    key: 'opportunity-line-items',
    label: 'Opportunity Line Items',
    description: 'Sync product line items for each opportunity with quantities, price, and discount data.',
    importAction: '/ImportOpportunityLineItemsCSV',
    exportAction: '/ExportOpportunityLineItemsCSV',
    sampleTemplateHref: '/templates/opportunity-line-items-sample.csv',
  },
  {
    key: 'employees',
    label: 'Employees',
    description: 'Maintain the list of internal users available for assignment or ownership.',
    importAction: '/ImportEmployeesCSV',
    exportAction: '/ExportEmployeesCSV',
    sampleTemplateHref: '/templates/employees-sample.csv',
  },
  {
    key: 'products',
    label: 'Products',
    description: 'Keep your product catalog synchronized for quoting and revenue tracking.',
    importAction: '/ImportProductsCSV',
    exportAction: '/ExportProductsCSV',
    sampleTemplateHref: '/templates/products-sample.csv',
  },
]

function extractErrorMessage(error: unknown, fallback: string) {
  if ((error as AxiosError)?.isAxiosError) {
    const axiosError = error as AxiosError<{ message?: string }>
    return axiosError.response?.data?.message ?? fallback
  }
  return fallback
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString()
}

function MigrationTile({ entity, onJobCreated }: { entity: MigrationEntity; onJobCreated: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [statusType, setStatusType] = useState<StatusType | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setStatusType(null)
    setStatusMessage(null)
  }

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const csvText = await file.text()
      const response = await api.post(entity.importAction, {
        Csv: csvText,
        FileName: file.name,
      })
      return response.data as MigrationJob
    },
    onSuccess: (job) => {
      setSelectedFile(null)
      setStatusType('success')
      setStatusMessage(`Import queued. Task #${job.ID} will process your ${entity.label.toLowerCase()} CSV.`)
      onJobCreated()
    },
    onError: (error) => {
      setStatusType('error')
      setStatusMessage(extractErrorMessage(error, `Unable to queue ${entity.label.toLowerCase()} import.`))
    },
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(entity.exportAction)
      return response.data as MigrationJob
    },
    onSuccess: (job) => {
      setStatusType('success')
      setStatusMessage(`Export queued. Task #${job.ID} will generate the ${entity.label.toLowerCase()} CSV.`)
      onJobCreated()
    },
    onError: (error) => {
      setStatusType('error')
      setStatusMessage(extractErrorMessage(error, `Unable to queue ${entity.label.toLowerCase()} export.`))
    },
  })

  const handleStartImport = () => {
    if (!selectedFile) {
      setStatusType('error')
      setStatusMessage('Select a CSV file before importing.')
      return
    }
    setStatusType(null)
    setStatusMessage(null)
    importMutation.mutate(selectedFile)
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{entity.label}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{entity.description}</p>
      </div>

      {statusMessage && statusType && (
        <div
          className={`rounded-md border p-4 text-sm ${
            statusType === 'success'
              ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-950 dark:text-success-200'
              : 'border-error-200 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-200'
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input type="file" accept=".csv" onChange={handleFileChange} disabled={importMutation.isPending} />
          <Button onClick={handleStartImport} disabled={importMutation.isPending}>
            {importMutation.isPending ? 'Uploading…' : 'Start Import'}
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
          {exportMutation.isPending ? 'Queuing…' : 'Export CSV'}
        </Button>
        {entity.sampleTemplateHref && (
          <a
            href={entity.sampleTemplateHref}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            download
          >
            Download sample CSV
          </a>
        )}
      </div>
    </section>
  )
}

function MigrationTasks({
  jobs,
  isLoading,
  onDownload,
  downloadState,
}: {
  jobs: MigrationJob[]
  isLoading: boolean
  onDownload: (job: MigrationJob) => void
  downloadState: {
    isDownloading: boolean
    jobId: number | null
    error: string | null
  }
}) {
  const statusBadgeClasses: Record<MigrationJob['Status'], string> = {
    pending:
      'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-200',
    running:
      'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-200',
    completed:
      'border-success-200 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-950 dark:text-success-200',
    failed:
      'border-error-200 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-200',
  }

  return (
    <div className="card space-y-4 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Migration tasks</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Jobs run asynchronously so you can keep working while imports and exports complete.
        </p>
      </div>

      {downloadState.error && (
        <div className="rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-200">
          {downloadState.error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Operation
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Message
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Started
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Completed
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Loading tasks…
                </td>
              </tr>
            )}
            {!isLoading && jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  No migration activity yet. Queue an import or export to see it here.
                </td>
              </tr>
            )}
            {jobs.map((job) => {
              const message = job.ResultMessage || job.ErrorMessage || '—'
              const operationLabel = job.Operation === 'import' ? 'Import' : 'Export'
              const counts = job.Operation === 'import' ? job.ImportedCount : job.ExportedCount
              const countText = counts ? `${counts} records` : '—'
              return (
                <tr key={job.ID}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    #{job.ID} · {job.Entity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {operationLabel}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClasses[job.Status]}`}>
                      {job.Status.charAt(0).toUpperCase() + job.Status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="space-y-1">
                      <p>{message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{countText}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(job.StartedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(job.CompletedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {job.Operation === 'export' && job.Status === 'completed' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onDownload(job)}
                        disabled={downloadState.isDownloading && downloadState.jobId === job.ID}
                        className="px-3 py-1 text-sm"
                      >
                        {downloadState.isDownloading && downloadState.jobId === job.ID ? 'Downloading…' : 'Download'}
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function MigrationCockpit() {
  const queryClient = useQueryClient()
  const { data: jobs = [], isLoading } = useMigrationJobs()
  const [downloadState, setDownloadState] = useState<{
    isDownloading: boolean
    jobId: number | null
    error: string | null
  }>({ isDownloading: false, jobId: null, error: null })

  const downloadMutation = useMutation({
    mutationFn: async (job: MigrationJob) => {
      const response = await api.post('/DownloadMigrationJobResult', { JobID: job.ID }, { responseType: 'blob' })
      return { job, blob: response.data as Blob }
    },
    onMutate: (job) => {
      setDownloadState({ isDownloading: true, jobId: job.ID, error: null })
    },
    onSuccess: ({ job, blob }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const filename = job.FileName || `${job.Entity}-export-${job.ID}.csv`
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setDownloadState({ isDownloading: false, jobId: null, error: null })
    },
    onError: (error) => {
      setDownloadState({
        isDownloading: false,
        jobId: null,
        error: extractErrorMessage(error, 'Failed to download the export file. Please try again.'),
      })
    },
  })

  const handleJobCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['migration-jobs'] })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Migration Cockpit</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Import and export CRM data as CSV files. Jobs run asynchronously, and results appear in the task list below.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {MIGRATION_ENTITIES.map((entity) => (
          <MigrationTile key={entity.key} entity={entity} onJobCreated={handleJobCreated} />
        ))}
      </div>

      <MigrationTasks
        jobs={jobs}
        isLoading={isLoading}
        downloadState={downloadState}
        onDownload={(job) => downloadMutation.mutate(job)}
      />
    </div>
  )
}
