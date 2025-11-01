import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api from '../lib/api'

type StatusType = 'success' | 'error'

export interface CsvStatus {
  type: StatusType
  message: string
}

export interface BulkRowError {
  row: number
  field: string
  message: string
}

interface UseCsvUploadOptions {
  importAction: string
  entityLabel: string
  queryKey?: QueryKey
  formatSuccessMessage?: (importedCount: number) => string
  formatErrorMessage?: () => string
  onStatusChange?: (status: CsvStatus | null) => void
}

interface ImportResponse {
  imported: number
}

export function useCsvUpload(options: UseCsvUploadOptions) {
  const {
    importAction,
    entityLabel,
    queryKey,
    formatSuccessMessage,
    formatErrorMessage,
    onStatusChange,
  } = options

  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [rowErrors, setRowErrors] = useState<BulkRowError[]>([])

  const importMutation = useMutation({
    mutationFn: async (csvText: string) => {
      const response = await api.post(importAction, { Csv: csvText })
      return response.data as ImportResponse
    },
    onSuccess: (result) => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey })
      }

      setRowErrors([])
      setSelectedFile(null)

      const message = formatSuccessMessage
        ? formatSuccessMessage(result.imported)
        : `Imported ${result.imported} ${entityLabel.toLowerCase()}${result.imported === 1 ? '' : 's'} successfully.`

      onStatusChange?.({ type: 'success', message })
    },
    onError: (err: unknown) => {
      let message = formatErrorMessage
        ? formatErrorMessage()
        : `Failed to import ${entityLabel.toLowerCase()} data. Please review the CSV file and try again.`

      const details: BulkRowError[] = []
      if ((err as AxiosError)?.isAxiosError) {
        const axiosError = err as AxiosError<{ message?: string; details?: BulkRowError[] }>
        const data = axiosError.response?.data

        if (data?.message) {
          message = data.message
        }

        if (Array.isArray(data?.details)) {
          for (const detail of data.details) {
            if (
              detail &&
              typeof detail.row === 'number' &&
              typeof detail.field === 'string' &&
              typeof detail.message === 'string'
            ) {
              details.push(detail)
            }
          }
        }
      }

      setRowErrors(details)
      onStatusChange?.({ type: 'error', message })
    },
  })

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setRowErrors([])
    onStatusChange?.(null)
  }

  const submit = async () => {
    if (!selectedFile || importMutation.isPending) {
      if (!selectedFile) {
        onStatusChange?.({ type: 'error', message: 'Select a CSV file before importing.' })
      }
      return
    }

    try {
      const csvText = await selectedFile.text()
      setRowErrors([])
      onStatusChange?.(null)
      importMutation.mutate(csvText)
    } catch {
      onStatusChange?.({
        type: 'error',
        message: 'Unable to read the selected file. Please try again or choose a different CSV file.',
      })
    }
  }

  return {
    selectedFile,
    handleFileInputChange,
    submit,
    isUploading: importMutation.isPending,
    rowErrors,
  }
}
