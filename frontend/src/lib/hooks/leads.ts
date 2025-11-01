import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { mergeODataQuery } from '../odataUtils'
import type { Lead } from '../../types'

export type LeadPayload = Partial<Pick<Lead,
  | 'Name'
  | 'Email'
  | 'Phone'
  | 'Company'
  | 'Title'
  | 'Website'
  | 'Source'
  | 'Status'
  | 'Notes'
  | 'OwnerEmployeeID'
>>

export const leadKeys = {
  all: ['leads'] as const,
  list: (query: string) => ['leads', query] as const,
  detail: (id: string | number) => ['lead', id] as const,
}

export function useLeads(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leadKeys.list(query),
    queryFn: async () => {
      const response = await api.get(`/Leads${query}`)
      return response.data
    },
    enabled: options?.enabled ?? true,
  })
}

export function useLead(id?: string, expand?: string) {
  return useQuery({
    queryKey: leadKeys.detail(id ?? 'new'),
    queryFn: async () => {
      const expandSet = new Set(
        expand
          ?.split(',')
          .map(part => part.trim())
          .filter(Boolean),
      )
      expandSet.add('OwnerEmployee')
      const expandParam = Array.from(expandSet).join(',')
      const expandQuery = mergeODataQuery('', { '$expand': expandParam })
      const response = await api.get(`/Leads(${id})${expandQuery}`)
      return response.data as Lead
    },
    enabled: Boolean(id),
  })
}

export function useLeadMutation(id?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LeadPayload) => {
      if (id) {
        return api.patch(`/Leads(${id})`, payload)
      }
      return api.post('/Leads', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
      if (id) {
        queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) })
      }
    },
  })
}

export function useDeleteLead(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/Leads(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

export function useConvertLead(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { AccountName?: string }) => {
      const body = payload ?? {}
      const response = await api.post(`/Leads(${id})/CRM.ConvertLead`, body)
      return response.data as { LeadID: number; AccountID: number; ContactID: number }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function buildLeadQuery(searchQuery: string, extraParams?: Record<string, string>) {
  return mergeODataQuery(searchQuery, {
    $count: 'true',
    $expand: 'ConvertedAccount,ConvertedContact,OwnerEmployee',
    ...extraParams,
  })
}
