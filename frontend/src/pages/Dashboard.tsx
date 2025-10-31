import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Opportunity, OPPORTUNITY_STAGES, opportunityStageToString } from '../types'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
})

const CLOSED_WON_STAGE = 6
const CLOSED_LOST_STAGE = 7

const isClosedStage = (stage: number) => stage === CLOSED_WON_STAGE || stage === CLOSED_LOST_STAGE

const getStageBadgeClass = (stage: number) => {
  switch (stage) {
    case CLOSED_WON_STAGE:
      return 'badge-success'
    case CLOSED_LOST_STAGE:
      return 'badge-error'
    case 5:
      return 'badge-warning'
    case 4:
      return 'badge-primary'
    default:
      return 'badge-secondary'
  }
}

export default function Dashboard() {
  // Fetch total accounts count
  const { data: accountsData, isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['accounts-count'],
    queryFn: async () => {
      const response = await api.get('/Accounts?$count=true&$top=0')
      return response.data
    },
  })

  // Fetch total contacts count
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useQuery({
    queryKey: ['contacts-count'],
    queryFn: async () => {
      const response = await api.get('/Contacts?$count=true&$top=0')
      return response.data
    },
  })

  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ['leads-active-count'],
    queryFn: async () => {
      const response = await api.get("/Leads?$filter=Status ne 'Converted' and Status ne 'Disqualified'&$count=true&$top=0")
      return response.data
    },
  })

  // Fetch open issues count (exclude Closed and Resolved)
  // Status values: 1=New, 2=InProgress, 3=Pending, 4=Resolved, 5=Closed
  const { data: issuesData, isLoading: issuesLoading, error: issuesError } = useQuery({
    queryKey: ['open-issues-count'],
    queryFn: async () => {
      const response = await api.get("/Issues?$filter=Status ne 4 and Status ne 5&$count=true&$top=0")
      return response.data
    },
  })

  // Fetch opportunity summaries
  const { data: opportunitiesData, isLoading: opportunitiesLoading, error: opportunitiesError } = useQuery({
    queryKey: ['opportunities-dashboard'],
    queryFn: async () => {
      const response = await api.get('/Opportunities?$expand=Account&$orderby=ExpectedCloseDate asc')
      return response.data
    },
  })

  const opportunities = (opportunitiesData?.items as Opportunity[]) || []
  const openOpportunities = opportunities.filter(opportunity => !isClosedStage(opportunity.Stage))
  const totalOpenPipeline = openOpportunities.reduce((sum, opportunity) => sum + opportunity.Amount, 0)

  const stageOptions = OPPORTUNITY_STAGES()
  const pipelineByStage = stageOptions
    .map(stage => ({
      stage,
      total: opportunities
        .filter(opportunity => opportunity.Stage === stage.value && !isClosedStage(stage.value))
        .reduce((sum, opportunity) => sum + opportunity.Amount, 0),
    }))
    .filter(item => item.total > 0)

  const now = new Date()
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + 45)
  const upcomingCloses = opportunities
    .filter(opportunity => {
      if (!opportunity.ExpectedCloseDate) {
        return false
      }
      const closeDate = new Date(opportunity.ExpectedCloseDate)
      return closeDate >= now && closeDate <= horizon && !isClosedStage(opportunity.Stage)
    })
    .sort((a, b) => new Date(a.ExpectedCloseDate || '').getTime() - new Date(b.ExpectedCloseDate || '').getTime())
    .slice(0, 5)

  const isLoading = accountsLoading || contactsLoading || leadsLoading || issuesLoading || opportunitiesLoading
  const hasError = accountsError || contactsError || leadsError || issuesError || opportunitiesError

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to your CRM system
        </p>
      </div>

      {hasError && (
        <div className="card p-4 bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800">
          <p className="text-error-600 dark:text-error-400">
            Error loading dashboard data. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Leads</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : leadsData?.count ?? 0}
          </p>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Excluding converted or disqualified records
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Accounts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : accountsData?.count ?? 0}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contacts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : contactsData?.count ?? 0}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Issues</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : issuesData?.count ?? 0}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Opportunities</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? '...' : openOpportunities.length}
          </p>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Pipeline value {isLoading ? '...' : currencyFormatter.format(totalOpenPipeline)}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <Link
            to="/leads/new"
            className="btn btn-primary text-center"
          >
            Capture Lead
          </Link>
          <Link
            to="/leads"
            className="btn btn-secondary text-center"
          >
            Manage Leads
          </Link>
          <Link
            to="/accounts/new"
            className="btn btn-primary text-center"
          >
            Create Account
          </Link>
          <Link
            to="/contacts/new"
            className="btn btn-primary text-center"
          >
            Add Contact
          </Link>
          <Link
            to="/issues/new"
            className="btn btn-primary text-center"
          >
            Create Issue
          </Link>
          <Link
            to="/opportunities/new"
            className="btn btn-primary text-center"
          >
            Log Opportunity
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pipeline by Stage
          </h2>
          {pipelineByStage.length > 0 ? (
            <ul className="space-y-3">
              {pipelineByStage.map(({ stage, total }) => (
                <li key={stage.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${getStageBadgeClass(stage.value)}`}>
                      {stage.label}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {opportunities.filter(opportunity => opportunity.Stage === stage.value).length} deals
                    </span>
                  </div>
                  <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {currencyFormatter.format(total)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No active pipeline yet. Create an opportunity to start tracking deals.
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Upcoming Closings (Next 45 Days)
          </h2>
          {upcomingCloses.length > 0 ? (
            <ul className="space-y-4">
              {upcomingCloses.map((opportunity) => (
                <li key={opportunity.ID} className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/opportunities/${opportunity.ID}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {opportunity.Name}
                    </Link>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {opportunity.Account ? opportunity.Account.Name : 'No account linked'}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className={`badge ${getStageBadgeClass(opportunity.Stage)}`}>
                        {opportunityStageToString(opportunity.Stage)}
                      </span>
                      <span>{currencyFormatter.format(opportunity.Amount)}</span>
                      <span>{opportunity.Probability}% probability</span>
                    </div>
                  </div>
                  <div className="text-sm text-right text-gray-600 dark:text-gray-400">
                    {new Date(opportunity.ExpectedCloseDate || '').toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No upcoming closes in the next 45 days. Update opportunity close dates to keep forecasts current.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
