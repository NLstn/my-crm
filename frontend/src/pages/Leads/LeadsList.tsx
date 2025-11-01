import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import EntitySearch, { PaginationControls } from '../../components/EntitySearch'
import api from '../../lib/api'
import type { Employee, Lead } from '../../types'
import { buildLeadQuery, useLeads } from '../../lib/hooks/leads'
import { Button, Input } from '@/components/ui'
import type { AxiosError } from 'axios'

const statusBadgeVariant: Record<string, string> = {
  New: 'badge-primary',
  Contacted: 'badge-secondary',
  Qualified: 'badge-warning',
  Converted: 'badge-success',
  Disqualified: 'badge-error',
}

interface BulkRowError {
  row: number
  field: string
  message: string
}

export default function LeadsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pageMessage, setPageMessage] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<BulkRowError[]>([])
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null)

  const odataQuery = useMemo(() => buildLeadQuery(searchQuery), [searchQuery])

  const { data, isLoading, error } = useLeads(odataQuery)

  const queryClient = useQueryClient()

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'lead-list'],
    queryFn: async () => {
      const response = await api.get('/Employees', {
        params: {
          $select: 'ID,FirstName,LastName',
          $orderby: 'FirstName asc',
        },
      })
      return response.data
    },
  })

  const leads = (data?.items as Lead[]) || []
  const totalCount = data?.count || 0
  const employees = useMemo(
    () => ((employeesData?.items as Employee[]) || []),
    [employeesData],
  )

  const ownerOptions = useMemo(
    () =>
      employees.map(employee => ({
        label: `${employee.FirstName} ${employee.LastName}`,
        value: employee.ID.toString(),
      })),
    [employees],
  )

  const sortOptions = useMemo(
    () => [
      { label: 'Newest First', value: 'CreatedAt desc' },
      { label: 'Oldest First', value: 'CreatedAt asc' },
      { label: 'Name (A-Z)', value: 'Name asc' },
      { label: 'Name (Z-A)', value: 'Name desc' },
      {
        label: 'Owner (A-Z)',
        value: 'OwnerEmployee/LastName asc,OwnerEmployee/FirstName asc',
      },
      {
        label: 'Owner (Z-A)',
        value: 'OwnerEmployee/LastName desc,OwnerEmployee/FirstName desc',
      },
    ],
    [],
  )

  const filterOptions = useMemo(
    () => [
      {
        label: 'Status',
        key: 'Status',
        type: 'select' as const,
        options: [
          { label: 'New', value: 'New' },
          { label: 'Contacted', value: 'Contacted' },
          { label: 'Qualified', value: 'Qualified' },
          { label: 'Converted', value: 'Converted' },
          { label: 'Disqualified', value: 'Disqualified' },
        ],
      },
      {
        label: 'Source',
        key: 'Source',
        type: 'text' as const,
      },
      {
        label: 'Owner',
        key: 'OwnerEmployeeID',
        type: 'select' as const,
        options: ownerOptions,
        valueType: 'number' as const,
      },
    ],
    [ownerOptions],
  )

  const importMutation = useMutation({
    mutationFn: async (csvText: string) => {
      const response = await api.post('/ImportLeadsCSV', { Csv: csvText })
      return response.data as { imported: number }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setPageMessage(`Imported ${result.imported} lead${result.imported === 1 ? '' : 's'} successfully.`)
      setPageError(null)
      setImportErrors([])
      setImportErrorMessage(null)
      setSelectedFile(null)
      setIsImportDialogOpen(false)
    },
    onError: (err: unknown) => {
      let message = 'Failed to import leads. Please verify the CSV file and try again.'
      const details: BulkRowError[] = []
      if ((err as AxiosError)?.isAxiosError) {
        const axiosError = err as AxiosError<{ message?: string; details?: BulkRowError[] }>
        const data = axiosError.response?.data
        if (data?.message) {
          message = data.message
        }
        if (Array.isArray(data?.details)) {
          for (const detail of data.details) {
            if (detail && typeof detail.row === 'number' && typeof detail.field === 'string' && typeof detail.message === 'string') {
              details.push(detail)
            }
          }
        }
      }
      setImportErrorMessage(message)
      setImportErrors(details)
    },
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ExportLeadsCSV', undefined, { responseType: 'blob' })
      return response.data as Blob
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setPageMessage('Lead export started. Your download should begin shortly.')
      setPageError(null)
    },
    onError: () => {
      setPageError('Failed to export leads. Please try again.')
    },
  })

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleImportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile || importMutation.isPending) {
      return
    }
    const csvText = await selectedFile.text()
    setImportErrorMessage(null)
    setImportErrors([])
    importMutation.mutate(csvText)
  }

  const openImportDialog = () => {
    setImportErrorMessage(null)
    setImportErrors([])
    setSelectedFile(null)
    setIsImportDialogOpen(true)
  }

  const closeImportDialog = () => {
    if (importMutation.isPending) {
      return
    }
    setIsImportDialogOpen(false)
    setSelectedFile(null)
    setImportErrorMessage(null)
    setImportErrors([])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Capture and manage prospects before converting them into accounts.
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Streamline bulk imports and exports in the{' '}
            <Link
              to="/settings/data"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Migration Cockpit
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button type="button" onClick={openImportDialog}>
            Import CSV
          </Button>
          <Link to="/leads/new" className="btn btn-primary text-center">
            Add Lead
          </Link>
          <Link to="/accounts/new" className="btn btn-secondary text-center">
            New Account from Scratch
          </Link>
        </div>
      </div>

      {pageMessage && (
        <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-success-700 dark:border-success-800 dark:bg-success-950 dark:text-success-200">
          {pageMessage}
        </div>
      )}

      {pageError && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-200">
          {pageError}
        </div>
      )}

      <EntitySearch
        searchPlaceholder="Search leads by name, company, or email..."
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onQueryChange={(query) => setSearchQuery(query)}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />

      {isLoading && (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading leads...</div>
      )}

      {error && (
        <div className="text-center py-12 text-error-600 dark:text-error-400">
          Error loading leads: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {leads.map((lead) => {
              const badgeClass = statusBadgeVariant[lead.Status] ?? 'badge-secondary'
              return (
                <Link
                  key={lead.ID}
                  to={`/leads/${lead.ID}`}
                  className="card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {lead.Name}
                        </h3>
                        <span className={`badge ${badgeClass}`}>{lead.Status}</span>
                      </div>
                      {lead.Company && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{lead.Company}</p>
                      )}
                      <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          👤 Owner:{' '}
                          {lead.OwnerEmployee ? (
                            <span className="text-gray-900 dark:text-gray-100">
                              {lead.OwnerEmployee.FirstName} {lead.OwnerEmployee.LastName}
                            </span>
                          ) : (
                            <span className="italic">Unassigned</span>
                          )}
                        </div>
                        {lead.Email && <div>📧 {lead.Email}</div>}
                        {lead.Phone && <div>📞 {lead.Phone}</div>}
                        {lead.Source && <div>🗂️ Source: {lead.Source}</div>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 text-left md:text-right">
                      <div>Created {new Date(lead.CreatedAt).toLocaleDateString()}</div>
                      {lead.ConvertedAccountID && lead.ConvertedAccount ? (
                        <div className="text-success-600 dark:text-success-400">
                          Converted to {lead.ConvertedAccount.Name}
                        </div>
                      ) : (
                        <div>Not converted</div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {leads.length === 0 && (
            <div className="card p-12 text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">No leads found</p>
              <Link to="/leads/new" className="btn btn-primary inline-block">
                Capture your first lead
              </Link>
            </div>
          )}

          <PaginationControls
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </>
      )}

      {isImportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Import Leads from CSV</h2>
              <Button type="button" variant="secondary" onClick={closeImportDialog} disabled={importMutation.isPending}>
                Close
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Provide a CSV file with lead information. Include a header row with Name and optional details like Email, Phone, and Status.
            </p>
            {importErrorMessage && (
              <div className="rounded-md border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-800 dark:bg-error-950 dark:text-error-200">
                {importErrorMessage}
              </div>
            )}
            {importErrors.length > 0 && (
              <div className="rounded-md border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700 dark:border-warning-800 dark:bg-warning-950 dark:text-warning-200">
                <p className="font-semibold">Validation errors</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {importErrors.map((validationError) => (
                    <li key={`${validationError.row}-${validationError.field}`}>
                      Row {validationError.row}: {validationError.field} {validationError.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form className="space-y-4" onSubmit={handleImportSubmit}>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                required
                disabled={importMutation.isPending}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={closeImportDialog} disabled={importMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedFile || importMutation.isPending}>
                  {importMutation.isPending ? 'Uploading…' : 'Start Import'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
