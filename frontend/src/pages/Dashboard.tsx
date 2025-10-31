import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import {
  fetchActivityMetrics,
  fetchAtRiskAccounts,
  fetchIssueSlaMetrics,
  fetchPipelineMetrics,
  fetchProductRevenueMetrics,
} from '../lib/dashboard'
import type {
  ActivityCompletionMetric,
  AtRiskAccountMetric,
  DashboardFilters,
  Employee,
  IssueSLABreachMetric,
  PipelineStageMetric,
  ProductRevenueMetric,
} from '../types'

const TIME_RANGE_OPTIONS = [
  {
    value: '30',
    label: 'Last 30 days',
    getRange: () => {
      const end = new Date()
      const start = new Date(end)
      start.setDate(end.getDate() - 30)
      return { start, end }
    },
  },
  {
    value: '90',
    label: 'Last 90 days',
    getRange: () => {
      const end = new Date()
      const start = new Date(end)
      start.setDate(end.getDate() - 90)
      return { start, end }
    },
  },
  {
    value: 'year',
    label: 'This year',
    getRange: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), 0, 1)
      return { start, end }
    },
  },
  {
    value: 'all',
    label: 'All time',
    getRange: () => ({ start: undefined, end: undefined }),
  },
] as const

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<(typeof TIME_RANGE_OPTIONS)[number]['value']>('90')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')

  const computedRange = useMemo(() => {
    const option = TIME_RANGE_OPTIONS.find((item) => item.value === timeRange)
    if (!option) {
      return { startIso: undefined as string | undefined, endIso: undefined as string | undefined }
    }
    const { start, end } = option.getRange()
    return {
      startIso: start ? start.toISOString() : undefined,
      endIso: end ? end.toISOString() : undefined,
    }
  }, [timeRange])

  const dashboardFilters = useMemo<DashboardFilters>(() => {
    const filters: DashboardFilters = {}
    if (computedRange.startIso) {
      filters.startDate = computedRange.startIso
    }
    if (computedRange.endIso) {
      filters.endDate = computedRange.endIso
    }
    if (ownerFilter !== 'all') {
      filters.ownerId = Number(ownerFilter)
    }
    return filters
  }, [computedRange.startIso, computedRange.endIso, ownerFilter])

  const filterKey = [dashboardFilters.startDate ?? null, dashboardFilters.endDate ?? null, dashboardFilters.ownerId ?? null] as const

  const employeesQuery = useQuery({
    queryKey: ['dashboard-owners'],
    queryFn: async () => {
      const response = await api.get('/Employees?$select=ID,FirstName,LastName&$orderby=FirstName')
      return (response.data.items ?? []) as Employee[]
    },
  })

  const pipelineQuery = useQuery({
    queryKey: ['pipeline-by-stage', ...filterKey],
    queryFn: () => fetchPipelineMetrics(dashboardFilters),
  })

  const issuesQuery = useQuery({
    queryKey: ['sla-breaches', ...filterKey],
    queryFn: () => fetchIssueSlaMetrics(dashboardFilters),
  })

  const activitiesQuery = useQuery({
    queryKey: ['activities-completed', ...filterKey],
    queryFn: () => fetchActivityMetrics(dashboardFilters),
  })

  const productRevenueQuery = useQuery({
    queryKey: ['product-revenue', ...filterKey],
    queryFn: () => fetchProductRevenueMetrics(dashboardFilters),
  })

  const atRiskQuery = useQuery({
    queryKey: ['at-risk-accounts', ...filterKey],
    queryFn: () => fetchAtRiskAccounts(dashboardFilters),
  })

  const pipelineData = useMemo<PipelineStageMetric[]>(() => pipelineQuery.data ?? [], [pipelineQuery.data])
  const slaMetrics = useMemo<IssueSLABreachMetric[]>(() => issuesQuery.data ?? [], [issuesQuery.data])
  const activityMetrics = useMemo<ActivityCompletionMetric[]>(() => activitiesQuery.data ?? [], [activitiesQuery.data])
  const productRevenue = useMemo<ProductRevenueMetric[]>(() => productRevenueQuery.data ?? [], [productRevenueQuery.data])
  const atRiskAccounts = useMemo<AtRiskAccountMetric[]>(() => atRiskQuery.data ?? [], [atRiskQuery.data])

  const totalPipelineValue = useMemo(
    () => pipelineData.reduce((sum, stage) => sum + stage.TotalValue, 0),
    [pipelineData],
  )

  const totalSlaBreaches = useMemo(
    () => slaMetrics.reduce((sum, item) => sum + item.Count, 0),
    [slaMetrics],
  )

  const totalActivities = useMemo(
    () => activityMetrics.reduce((sum, item) => sum + item.Count, 0),
    [activityMetrics],
  )

  const totalRevenue = useMemo(
    () => productRevenue.reduce((sum, item) => sum + item.TotalRevenue, 0),
    [productRevenue],
  )

  const leadingStage = useMemo<PipelineStageMetric | undefined>(() => {
    if (pipelineData.length === 0) return undefined
    return pipelineData.reduce((current, candidate) => {
      if (!current || candidate.TotalValue > current.TotalValue) {
        return candidate
      }
      return current
    }, undefined as PipelineStageMetric | undefined)
  }, [pipelineData])

  const highestPriority = useMemo<IssueSLABreachMetric | undefined>(() => {
    if (slaMetrics.length === 0) return undefined
    return slaMetrics.reduce((current, candidate) => {
      if (!current || candidate.Count > current.Count) {
        return candidate
      }
      return current
    }, undefined as IssueSLABreachMetric | undefined)
  }, [slaMetrics])

  const topActivityType = useMemo<ActivityCompletionMetric | undefined>(() => {
    if (activityMetrics.length === 0) return undefined
    return activityMetrics.reduce((current, candidate) => {
      if (!current || candidate.Count > current.Count) {
        return candidate
      }
      return current
    }, undefined as ActivityCompletionMetric | undefined)
  }, [activityMetrics])

  const topProduct = useMemo<ProductRevenueMetric | undefined>(() => {
    if (productRevenue.length === 0) return undefined
    return productRevenue[0]
  }, [productRevenue])

  const timeRangeLabel = TIME_RANGE_OPTIONS.find((option) => option.value === timeRange)?.label ?? 'All time'

  const isMetricsLoading =
    pipelineQuery.isLoading ||
    issuesQuery.isLoading ||
    activitiesQuery.isLoading ||
    productRevenueQuery.isLoading ||
    atRiskQuery.isLoading

  const metricsError =
    pipelineQuery.error ||
    issuesQuery.error ||
    activitiesQuery.error ||
    productRevenueQuery.error ||
    atRiskQuery.error

  const errorMessage = metricsError instanceof Error ? metricsError.message : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Sales, support, and product performance at a glance.</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Filters</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Slice KPIs by timeframe and relationship owner.</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
              <span className="mb-1 font-medium">Time range</span>
              <select
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-400 dark:focus:ring-primary-900/40"
                value={timeRange}
                onChange={(event) => setTimeRange(event.target.value as (typeof TIME_RANGE_OPTIONS)[number]['value'])}
              >
                {TIME_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
              <span className="mb-1 font-medium">Owner</span>
              <select
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-primary-400 dark:focus:ring-primary-900/40"
                value={ownerFilter}
                disabled={employeesQuery.isLoading}
                onChange={(event) => setOwnerFilter(event.target.value)}
              >
                <option value="all">All owners</option>
                {(employeesQuery.data ?? []).map((employee) => (
                  <option key={employee.ID} value={employee.ID}>
                    {employee.FirstName} {employee.LastName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="card border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
          <p className="text-sm text-error-600 dark:text-error-400">
            {errorMessage || 'Error loading dashboard data. Please try refreshing the page.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pipeline value"
          value={currencyFormatter.format(totalPipelineValue)}
          subtitle={leadingStage ? `Largest stage: ${leadingStage.Stage}` : 'No pipeline data'}
          timeRange={timeRangeLabel}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="SLA breaches"
          value={numberFormatter.format(totalSlaBreaches)}
          subtitle={highestPriority ? `Most impacted: ${highestPriority.Priority}` : 'No SLA breaches'}
          timeRange={timeRangeLabel}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="Activities completed"
          value={numberFormatter.format(totalActivities)}
          subtitle={topActivityType ? `Top activity: ${topActivityType.Type}` : 'No completed activities'}
          timeRange={timeRangeLabel}
          isLoading={isMetricsLoading}
        />
        <MetricCard
          title="Product revenue"
          value={currencyFormatter.format(totalRevenue)}
          subtitle={topProduct ? `Top product: ${topProduct.ProductName}` : 'No closed revenue'}
          timeRange={timeRangeLabel}
          isLoading={isMetricsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pipeline by stage</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Distribution of pipeline value across your sales stages.</p>
          <div className="mt-4 space-y-4">
            {isMetricsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-500">Loading pipeline metrics…</p>
            ) : pipelineData.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No opportunities found for the selected filters.</p>
            ) : (
              pipelineData.map((stage) => {
                const percentage = totalPipelineValue > 0 ? Math.min(100, Math.max(0, (stage.TotalValue / totalPipelineValue) * 100)) : 0
                return (
                  <div key={stage.Stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{stage.Stage}</span>
                      <span>
                        {currencyFormatter.format(stage.TotalValue)} · {numberFormatter.format(stage.OpportunityCount)} deals
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-primary-500 dark:bg-primary-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SLA breaches by priority</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding issues past due.</p>
          <div className="mt-4 space-y-3">
            {isMetricsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-500">Loading SLA metrics…</p>
            ) : slaMetrics.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No SLA breaches detected for this period.</p>
            ) : (
              slaMetrics.map((item) => (
                <div key={item.Priority} className="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 dark:border-warning-800 dark:bg-warning-900/20">
                  <span className="text-sm font-medium text-warning-800 dark:text-warning-200">{item.Priority}</span>
                  <span className="text-sm font-semibold text-warning-700 dark:text-warning-100">{numberFormatter.format(item.Count)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity mix</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed activities for the selected period.</p>
          <div className="mt-4 space-y-3">
            {isMetricsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-500">Loading activity metrics…</p>
            ) : activityMetrics.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No completed activities recorded.</p>
            ) : (
              activityMetrics.map((activity) => (
                <div key={activity.Type} className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-800 dark:bg-primary-900/20">
                  <span className="text-sm font-medium text-primary-800 dark:text-primary-200">{activity.Type}</span>
                  <span className="text-sm font-semibold text-primary-700 dark:text-primary-100">{numberFormatter.format(activity.Count)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Revenue by product</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Closed won opportunities grouped by product.</p>
          <div className="mt-4 space-y-4">
            {isMetricsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-500">Loading revenue metrics…</p>
            ) : productRevenue.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No revenue booked for the selected filters.</p>
            ) : (
              productRevenue.slice(0, 6).map((product) => (
                <div key={product.ProductID} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{product.ProductName}</span>
                    <span>{numberFormatter.format(product.DealCount)} deals</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-secondary-700 dark:text-secondary-200">
                    <span className="font-semibold">{currencyFormatter.format(product.TotalRevenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">At-risk accounts</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Accounts needing attention due to stalled engagement or high support load.</p>
        <div className="mt-4 space-y-4">
          {isMetricsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-500">Loading account health indicators…</p>
          ) : atRiskAccounts.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No accounts flagged for the selected filters.</p>
          ) : (
            atRiskAccounts.map((account: AtRiskAccountMetric) => (
              <div key={account.AccountID} className="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to={`/accounts/${account.AccountID}`}
                    className="text-base font-semibold text-primary-600 underline-offset-2 hover:underline dark:text-primary-300"
                  >
                    {account.AccountName}
                  </Link>
                  <span className="badge badge-error">{numberFormatter.format(account.OpenIssueCount)} open issues</span>
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{account.RiskReasons}</p>
                {account.LastActivityAt ? (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Last activity {dateFormatter.format(new Date(account.LastActivityAt))}
                    {typeof account.DaysSinceLastActivity === 'number'
                      ? ` · ${numberFormatter.format(account.DaysSinceLastActivity)} days ago`
                      : ''}
                  </p>
                ) : (
                  typeof account.DaysSinceLastActivity === 'number' && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      No recorded activities · {numberFormatter.format(account.DaysSinceLastActivity)} days inactive
                    </p>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link to="/accounts/new" className="btn btn-primary text-center">
            Create Account
          </Link>
          <Link to="/contacts/new" className="btn btn-primary text-center">
            Add Contact
          </Link>
          <Link to="/issues/new" className="btn btn-primary text-center">
            Create Issue
          </Link>
        </div>
      </div>
    </div>
  )
}

type MetricCardProps = {
  title: string
  value: string
  subtitle: string
  timeRange: string
  isLoading: boolean
}

function MetricCard({ title, value, subtitle, timeRange, isLoading }: MetricCardProps) {
  return (
    <div className="card p-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</span>
        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{isLoading ? '…' : value}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">{isLoading ? 'Loading…' : subtitle}</span>
        <span className="text-xs text-gray-500 dark:text-gray-500">{timeRange}</span>
      </div>
    </div>
  )
}
