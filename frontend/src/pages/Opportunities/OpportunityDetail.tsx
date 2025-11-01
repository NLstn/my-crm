import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Opportunity, opportunityStageToString, taskStatusToString } from '../../types'
import { Button } from '../../components/ui'
import { useCurrency } from '../../contexts/CurrencyContext'

const CLOSED_WON_STAGE = 6
const CLOSED_LOST_STAGE = 7

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

const formatDate = (value?: string) => {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString()
}

const formatDateTime = (value?: string) => {
  if (!value) return 'Not recorded'
  return new Date(value).toLocaleString()
}

const getTaskBadgeClass = (status: number) => {
  const statusLabel = taskStatusToString(status)
  if (statusLabel === 'Completed') {
    return 'badge-success'
  }
  if (statusLabel === 'Cancelled') {
    return 'badge-error'
  }
  if (statusLabel === 'Deferred') {
    return 'badge-warning'
  }
  return 'badge-secondary'
}

const isTaskOpen = (status: number) => {
  const statusLabel = taskStatusToString(status)
  return statusLabel !== 'Completed' && statusLabel !== 'Cancelled'
}

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'open' | 'completed'>('open')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')
  const { currencyCode, formatCurrency } = useCurrency()

  const { data: opportunity, isLoading, error } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const response = await api.get(
        `/Opportunities(${id})?$expand=Account,Contact,Owner,ClosedBy,LineItems($expand=Product),StageHistory($orderby=ChangedAt desc;$expand=ChangedBy),Activities($expand=Contact,Employee),Tasks($expand=Contact,Employee)`,
      )
      return response.data as Opportunity
    },
  })

  const tasks = useMemo(() => {
    if (!opportunity?.Tasks) {
      return []
    }

    return [...opportunity.Tasks]
      .filter(task => task.OpportunityID === opportunity.ID)
      .sort((a, b) => new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime())
  }, [opportunity])

  const activities = useMemo(() => {
    if (!opportunity?.Activities) {
      return []
    }

    return [...opportunity.Activities]
      .filter(activity => activity.OpportunityID === opportunity.ID)
      .sort((a, b) => new Date(b.ActivityTime).getTime() - new Date(a.ActivityTime).getTime())
  }, [opportunity])

  const stageHistoryEntries = useMemo(() => {
    if (!opportunity?.StageHistory) {
      return []
    }

    return [...opportunity.StageHistory].sort(
      (a, b) => new Date(b.ChangedAt).getTime() - new Date(a.ChangedAt).getTime(),
    )
  }, [opportunity])

  const activityTypes = useMemo(() => {
    const types = new Set<string>()
    activities.forEach(activity => {
      if (activity.ActivityType) {
        types.add(activity.ActivityType)
      }
    })
    return Array.from(types).sort()
  }, [activities])

  const filteredTasks = useMemo(() => {
    if (taskStatusFilter === 'all') {
      return tasks
    }

    if (taskStatusFilter === 'open') {
      return tasks.filter(task => isTaskOpen(task.Status))
    }

    return tasks.filter(task => taskStatusToString(task.Status) === 'Completed')
  }, [tasks, taskStatusFilter])

  const filteredActivities = useMemo(() => {
    if (activityTypeFilter === 'all') {
      return activities
    }

    return activities.filter(activity => activity.ActivityType === activityTypeFilter)
  }, [activities, activityTypeFilter])

  const taskCreateUrl = useMemo(() => {
    if (!opportunity) {
      return ''
    }

    const params = new URLSearchParams({
      accountId: opportunity.AccountID.toString(),
      opportunityId: opportunity.ID.toString(),
    })

    if (opportunity.ContactID) {
      params.set('contactId', opportunity.ContactID.toString())
    }

    params.set('title', `Follow up on ${opportunity.Name}`)

    if (opportunity.Owner) {
      params.set('owner', `${opportunity.Owner.FirstName} ${opportunity.Owner.LastName}`)
    }

    return `/tasks/new?${params.toString()}`
  }, [opportunity])

  const activityCreateUrl = useMemo(() => {
    if (!opportunity) {
      return ''
    }

    const params = new URLSearchParams({
      accountId: opportunity.AccountID.toString(),
      opportunityId: opportunity.ID.toString(),
    })

    if (opportunity.ContactID) {
      params.set('contactId', opportunity.ContactID.toString())
    }

    return `/activities/new?${params.toString()}`
  }, [opportunity])

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/Opportunities(${id})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      navigate('/opportunities')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading opportunity...</div>
  }

  if (error || !opportunity) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400">
        Error loading opportunity
      </div>
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const lineItems = opportunity.LineItems ?? []
  const opportunityCurrency = opportunity.CurrencyCode || currencyCode
  const dealTotal = lineItems.reduce((sum, item) => sum + (item.Total ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {opportunity.Name}
            </h1>
            <span className="badge badge-primary">
              {formatCurrency(opportunity.Amount, opportunityCurrency)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className={`badge ${getStageBadgeClass(opportunity.Stage)}`}>
              {opportunityStageToString(opportunity.Stage)}
            </span>
            <span className="badge badge-secondary">
              {opportunity.Probability}% probability
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Expected close: {formatDate(opportunity.ExpectedCloseDate)}
            </span>
            {(opportunity.Stage === CLOSED_WON_STAGE || opportunity.Stage === CLOSED_LOST_STAGE) && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Closed on: {formatDate(opportunity.ClosedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/opportunities/${id}/edit`} className="btn btn-primary">
            Edit Opportunity
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Opportunity Overview
          </h2>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Account</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunity.Account ? (
                  <Link to={`/accounts/${opportunity.AccountID}`} className="text-primary-600 hover:underline">
                    {opportunity.Account.Name}
                  </Link>
                ) : (
                  'Not linked'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Primary Contact</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunity.Contact ? (
                  <Link to={`/contacts/${opportunity.Contact.ID}`} className="text-primary-600 hover:underline">
                    {opportunity.Contact.FirstName} {opportunity.Contact.LastName}
                  </Link>
                ) : (
                  'Not selected'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Owner</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunity.Owner ? (
                  <Link to={`/employees/${opportunity.Owner.ID}`} className="text-primary-600 hover:underline">
                    {opportunity.Owner.FirstName} {opportunity.Owner.LastName}
                  </Link>
                ) : (
                  'Unassigned'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Stage</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunityStageToString(opportunity.Stage)}
              </dd>
            </div>
            {(opportunity.Stage === CLOSED_WON_STAGE || opportunity.Stage === CLOSED_LOST_STAGE) && (
              <>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Closed On</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {formatDate(opportunity.ClosedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Close Reason</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {opportunity.CloseReason && opportunity.CloseReason.trim() !== ''
                      ? opportunity.CloseReason
                      : 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Closed By</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {opportunity.ClosedBy ? (
                      <Link to={`/employees/${opportunity.ClosedBy.ID}`} className="text-primary-600 hover:underline">
                        {opportunity.ClosedBy.FirstName} {opportunity.ClosedBy.LastName}
                      </Link>
                    ) : opportunity.ClosedByEmployeeID ? (
                      `Employee #${opportunity.ClosedByEmployeeID}`
                    ) : (
                      'Not recorded'
                    )}
                  </dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Amount</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {formatCurrency(opportunity.Amount, opportunityCurrency)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Probability</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {opportunity.Probability}%
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Expected Close Date</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {formatDate(opportunity.ExpectedCloseDate)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notes & Timeline
          </h2>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</h3>
            <p className="mt-2 text-gray-900 dark:text-gray-100">
              {opportunity.Description ? opportunity.Description : 'No additional notes recorded yet.'}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <h3 className="text-gray-600 dark:text-gray-400">Created</h3>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date(opportunity.CreatedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-gray-600 dark:text-gray-400">Last Updated</h3>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date(opportunity.UpdatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stage History</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor how this opportunity has progressed through the pipeline.
            </p>
          </div>
        </div>

        {stageHistoryEntries.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No stage changes recorded yet.
          </p>
        ) : (
          <ol className="relative border-l border-gray-200 dark:border-gray-700">
            {stageHistoryEntries.map(history => {
              const stageLabel = opportunityStageToString(history.Stage)
              const previousStageLabel =
                history.PreviousStage != null
                  ? opportunityStageToString(history.PreviousStage)
                  : undefined

              return (
                <li key={history.ID} className="relative pl-6 pb-6 last:pb-0">
                  <span className="absolute left-0 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary-500 dark:bg-primary-400" />
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${getStageBadgeClass(history.Stage)}`}>
                        {stageLabel}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDateTime(history.ChangedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {previousStageLabel
                        ? `Moved from ${previousStageLabel} to ${stageLabel}.`
                        : `Initial stage captured as ${stageLabel}.`}
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {history.ChangedBy ? (
                        <>
                          Updated by{' '}
                          <Link
                            to={`/employees/${history.ChangedBy.ID}`}
                            className="text-primary-600 hover:underline"
                          >
                            {history.ChangedBy.FirstName} {history.ChangedBy.LastName}
                          </Link>
                        </>
                      ) : history.ChangedByEmployeeID ? (
                        <>Updated by Employee #{history.ChangedByEmployeeID}</>
                      ) : (
                        'Updated automatically'
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Opportunity Tasks</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track follow-up work tied to this deal.</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="taskStatusFilter"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  Status
                </label>
                <select
                  id="taskStatusFilter"
                  name="taskStatusFilter"
                  value={taskStatusFilter}
                  onChange={event => setTaskStatusFilter(event.target.value as 'all' | 'open' | 'completed')}
                  className="input"
                >
                  <option value="open">Open</option>
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {taskCreateUrl && (
                <Link to={taskCreateUrl} className="btn btn-secondary text-sm">
                  Add Task
                </Link>
              )}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tasks.length === 0
                ? 'No tasks have been created for this opportunity yet.'
                : 'No tasks match the selected status.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredTasks.map(task => (
                <li
                  key={task.ID}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        to={`/tasks/${task.ID}`}
                        className="font-semibold text-primary-600 hover:underline"
                      >
                        {task.Title}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Due {formatDate(task.DueDate)}
                        {task.Owner ? ` · Owner: ${task.Owner}` : ''}
                        {task.Contact
                          ? ` · Contact: ${task.Contact.FirstName} ${task.Contact.LastName}`
                          : ''}
                      </p>
                      {task.Description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {task.Description}
                        </p>
                      )}
                    </div>
                    <span className={`badge ${getTaskBadgeClass(task.Status)}`}>
                      {taskStatusToString(task.Status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Opportunity Activities</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review touchpoints recorded for this opportunity.</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="activityTypeFilter"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400"
                >
                  Type
                </label>
                <select
                  id="activityTypeFilter"
                  name="activityTypeFilter"
                  value={activityTypeFilter}
                  onChange={event => setActivityTypeFilter(event.target.value)}
                  className="input"
                >
                  <option value="all">All</option>
                  {activityTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {activityCreateUrl && (
                <Link to={activityCreateUrl} className="btn btn-secondary text-sm">
                  Log Activity
                </Link>
              )}
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activities.length === 0
                ? 'No activities have been logged for this opportunity yet.'
                : 'No activities match the selected type.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredActivities.map(activity => (
                <li
                  key={activity.ID}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {activity.Subject}
                        </span>
                        <span className="badge badge-secondary">{activity.ActivityType}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(activity.ActivityTime)}
                        {activity.Employee
                          ? ` · ${activity.Employee.FirstName} ${activity.Employee.LastName}`
                          : ''}
                        {activity.Contact
                          ? ` · Contact: ${activity.Contact.FirstName} ${activity.Contact.LastName}`
                          : ''}
                      </p>
                      {activity.Outcome && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Outcome: {activity.Outcome}
                        </p>
                      )}
                      {activity.Notes && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line line-clamp-3">
                          {activity.Notes}
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/activities/${activity.ID}`}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Line Items</h2>
          {lineItems.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Deal total:{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(dealTotal, opportunityCurrency)}
              </span>
            </div>
          )}
        </div>

        {lineItems.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No line items have been added for this opportunity yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {lineItems.map(item => {
                  const itemCurrency = item.CurrencyCode || opportunityCurrency
                  const discountParts: string[] = []
                  if (item.DiscountAmount > 0) {
                    discountParts.push(formatCurrency(item.DiscountAmount, itemCurrency))
                  }
                  if (item.DiscountPercent > 0) {
                    discountParts.push(`${item.DiscountPercent}%`)
                  }

                  return (
                    <tr key={item.ID} className="text-sm text-gray-900 dark:text-gray-100">
                      <td className="px-4 py-3">
                        {item.Product ? item.Product.Name : `Product #${item.ProductID}`}
                      </td>
                      <td className="px-4 py-3">{item.Quantity}</td>
                      <td className="px-4 py-3">{formatCurrency(item.UnitPrice, itemCurrency)}</td>
                      <td className="px-4 py-3">
                        {discountParts.length > 0 ? discountParts.join(' + ') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(item.Total, itemCurrency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Opportunity
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Are you sure you want to delete "{opportunity.Name}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Opportunity'}
              </Button>
            </div>
            {deleteMutation.isError && (
              <p className="text-error-600 dark:text-error-400 text-sm">
                Error deleting opportunity. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
