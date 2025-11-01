import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { GlobalSearchResult } from '../components/searchTypes'

const globalSearchKeys = {
  all: ['globalSearch'] as const,
  query: (term: string, limit: number) => ['globalSearch', term, limit] as const,
}

export function useGlobalSearch(query: string, limit = 5) {
  const trimmedQuery = query.trim()

  return useQuery<GlobalSearchResult[]>({
    queryKey: globalSearchKeys.query(trimmedQuery, limit),
    queryFn: async () => {
      const response = await api.get('/GlobalSearch()', {
        params: {
          query: trimmedQuery,
          limit,
        },
      })

      return (response.data?.items ?? []) as GlobalSearchResult[]
    },
    enabled: trimmedQuery.length > 0,
    staleTime: 30_000,
  })
}
