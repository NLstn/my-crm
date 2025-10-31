import api from './api'
import type {
  ActivityCompletionMetric,
  AtRiskAccountMetric,
  DashboardFilters,
  IssueSLABreachMetric,
  PipelineStageMetric,
  ProductRevenueMetric,
} from '../types'

const buildQuery = (filters: DashboardFilters) => {
  const params = new URLSearchParams()

  if (filters.startDate) {
    params.set('startDate', filters.startDate)
  }
  if (filters.endDate) {
    params.set('endDate', filters.endDate)
  }
  if (typeof filters.ownerId === 'number') {
    params.set('ownerId', String(filters.ownerId))
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export const fetchPipelineMetrics = async (filters: DashboardFilters) => {
  const response = await api.get(`/GetPipelineValueByStage${buildQuery(filters)}`)
  return (response.data.items ?? []) as PipelineStageMetric[]
}

export const fetchIssueSlaMetrics = async (filters: DashboardFilters) => {
  const response = await api.get(`/GetIssuesBreachingSLA${buildQuery(filters)}`)
  return (response.data.items ?? []) as IssueSLABreachMetric[]
}

export const fetchActivityMetrics = async (filters: DashboardFilters) => {
  const response = await api.get(`/GetActivitiesCompleted${buildQuery(filters)}`)
  return (response.data.items ?? []) as ActivityCompletionMetric[]
}

export const fetchProductRevenueMetrics = async (filters: DashboardFilters) => {
  const response = await api.get(`/GetProductRevenue${buildQuery(filters)}`)
  return (response.data.items ?? []) as ProductRevenueMetric[]
}

export const fetchAtRiskAccounts = async (filters: DashboardFilters) => {
  const response = await api.get(`/GetAtRiskAccounts${buildQuery(filters)}`)
  return (response.data.items ?? []) as AtRiskAccountMetric[]
}
