import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export type MigrationJobStatus = 'pending' | 'running' | 'completed' | 'failed'
export type MigrationJobOperation = 'import' | 'export'

export interface MigrationJob {
  ID: number
  Entity: string
  Operation: MigrationJobOperation
  Status: MigrationJobStatus
  FileName?: string | null
  CreatedAt: string
  UpdatedAt: string
  StartedAt?: string | null
  CompletedAt?: string | null
  ResultMessage?: string | null
  ErrorMessage?: string | null
  ImportedCount?: number | null
  ExportedCount?: number | null
}

export function useMigrationJobs() {
  return useQuery<MigrationJob[]>({
    queryKey: ['migration-jobs'],
    queryFn: async () => {
      const response = await api.get('/MigrationJobs?$orderby=CreatedAt desc&$top=20')
      const items = Array.isArray(response.data.items) ? response.data.items : []
      return items as MigrationJob[]
    },
    refetchInterval: 5000,
  })
}
