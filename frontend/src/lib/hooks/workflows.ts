import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { mergeODataQuery } from '../odataUtils'
import type { WorkflowExecution, WorkflowRule } from '../../types'

export const workflowKeys = {
  all: ['workflowRules'] as const,
  list: (query: string) => ['workflowRules', query] as const,
  detail: (id: string | number) => ['workflowRule', id] as const,
  executionsAll: ['workflowExecutions'] as const,
  executions: (query: string) => ['workflowExecutions', query] as const,
}

export interface WorkflowRulePayload {
  Name: string
  Description?: string
  EntityType: string
  TriggerType: string
  TriggerConfig?: Record<string, unknown>
  ActionType: string
  ActionConfig?: Record<string, unknown>
  IsActive?: boolean
}

export interface WorkflowRuleUpdatePayload extends Partial<WorkflowRulePayload> {}

export function useWorkflowRules(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: workflowKeys.list(query),
    queryFn: async () => {
      const response = await api.get(`/WorkflowRules${query}`)
      return response.data as { items: WorkflowRule[]; count?: number }
    },
    enabled: options?.enabled ?? true,
  })
}

export function useWorkflowExecutions(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: workflowKeys.executions(query),
    queryFn: async () => {
      const response = await api.get(`/WorkflowExecutions${query}`)
      return response.data as { items: WorkflowExecution[]; count?: number }
    },
    enabled: options?.enabled ?? true,
  })
}

export function useCreateWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: WorkflowRulePayload) => {
      const response = await api.post('/WorkflowRules', payload)
      return response.data as WorkflowRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all })
      queryClient.invalidateQueries({ queryKey: workflowKeys.executionsAll })
    },
  })
}

export function useUpdateWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string | number; payload: WorkflowRuleUpdatePayload }) => {
      const response = await api.patch(`/WorkflowRules(${id})`, payload)
      return response.data as WorkflowRule
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all })
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: workflowKeys.executionsAll })
    },
  })
}

export function useDeleteWorkflowRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/WorkflowRules(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all })
      queryClient.invalidateQueries({ queryKey: workflowKeys.executionsAll })
    },
  })
}

export function buildWorkflowRulesQuery(searchQuery: string, extraParams?: Record<string, string>) {
  return mergeODataQuery(searchQuery, {
    $orderby: 'CreatedAt desc',
    ...extraParams,
  })
}

export function buildWorkflowExecutionsQuery(searchQuery: string, extraParams?: Record<string, string>) {
  return mergeODataQuery(searchQuery, {
    $orderby: 'CreatedAt desc',
    $expand: 'WorkflowRule',
    ...extraParams,
  })
}
