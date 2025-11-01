import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { mergeODataQuery } from '../../lib/odataUtils'
import { Contact } from '../../types'
import EntitySearch, { PaginationControls } from '../../components/EntitySearch'
import { Button, Input } from '@/components/ui'
import type { AxiosError } from 'axios'

interface BulkRowError {
  row: number
  field: string
  message: string
}

export default function ContactsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pageMessage, setPageMessage] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<BulkRowError[]>([])
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null)

  // Merge search query with expand parameter
  const odataQuery = mergeODataQuery(searchQuery, { '$expand': 'Account' })

  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', odataQuery],
    queryFn: async () => {
      const response = await api.get(`/Contacts${odataQuery}`)
      return response.data
    },
  })

  const contacts = data?.items || []

  const importMutation = useMutation({
    mutationFn: async (csvText: string) => {
      const response = await api.post('/ImportContactsCSV', { Csv: csvText })
      return response.data as { imported: number }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setPageMessage(`Imported ${result.imported} contact${result.imported === 1 ? '' : 's'} successfully.`)
      setPageError(null)
      setImportErrors([])
      setImportErrorMessage(null)
      setSelectedFile(null)
      setIsImportDialogOpen(false)
    },
    onError: (err: unknown) => {
      let message = 'Failed to import contacts. Please review the CSV file and try again.'
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
      const response = await api.post('/ExportContactsCSV', undefined, { responseType: 'blob' })
      return response.data as Blob
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setPageMessage('Contact export started. Your download should begin shortly.')
      setPageError(null)
    },
    onError: () => {
      setPageError('Failed to export contacts. Please try again.')
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            For a dedicated import and export workspace visit the{' '}
            <Link
              to="/settings/data"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Migration Cockpit
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
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
          <Link to="/contacts/new" className="btn btn-primary text-center">
            Add Contact
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
        searchPlaceholder="Search contacts..."
        sortOptions={[
          { label: 'First Name (A-Z)', value: 'FirstName asc' },
          { label: 'First Name (Z-A)', value: 'FirstName desc' },
          { label: 'Last Name (A-Z)', value: 'LastName asc' },
          { label: 'Last Name (Z-A)', value: 'LastName desc' },
          { label: 'Newest First', value: 'CreatedAt desc' },
          { label: 'Oldest First', value: 'CreatedAt asc' },
        ]}
        filterOptions={[
          {
            label: 'Title',
            key: 'Title',
            type: 'text',
          },
        ]}
        onQueryChange={setSearchQuery}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          Loading contacts...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading contacts: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {contacts.map((contact: Contact) => (
              <Link
                key={contact.ID}
                to={`/contacts/${contact.ID}`}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {contact.FirstName} {contact.LastName}
                      {contact.IsPrimary && (
                        <span className="ml-2 badge badge-primary text-xs">Primary</span>
                      )}
                    </h3>
                    {contact.Title && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{contact.Title}</p>
                    )}
                    {contact.Account && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        🏢 {contact.Account.Name}
                      </p>
                    )}
                    <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {contact.Email && <div>📧 {contact.Email}</div>}
                      {contact.Phone && <div>📞 {contact.Phone}</div>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {contacts.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No contacts found</p>
              <Link to="/contacts/new" className="btn btn-primary mt-4 inline-block">
                Add your first contact
              </Link>
            </div>
          )}

          {/* Pagination Controls Below Results */}
          <PaginationControls
            totalCount={data?.count || 0}
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Import Contacts from CSV</h2>
              <Button type="button" variant="secondary" onClick={closeImportDialog} disabled={importMutation.isPending}>
                Close
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a CSV file containing contact details. Required headers include AccountID, FirstName, and LastName.
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
