import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import { Button, Input, Textarea } from '../../../components/ui'
import {
  buildWorkflowExecutionsQuery,
  buildWorkflowRulesQuery,
  useCreateWorkflowRule,
  useDeleteWorkflowRule,
  useUpdateWorkflowRule,
  useWorkflowExecutions,
  useWorkflowRules,
} from '../../../lib/hooks/workflows'
import type { WorkflowExecution, WorkflowRule } from '../../../types'

const leadStatusOptions = ['New', 'Contacted', 'Qualified', 'Converted', 'Disqualified']
const triggerOptions = [
  { value: 'LeadStatusChanged', label: 'Lead status changes' },
  { value: 'TaskOverdue', label: 'Task becomes overdue' },
]
const actionOptions = [
  { value: 'CreateFollowUpTask', label: 'Create follow-up task' },
  { value: 'SendNotification', label: 'Send notification' },
]
const notificationChannels = ['Email', 'InApp', 'Slack']

type FormMessage = { type: 'success' | 'error'; text: string } | null

type WorkflowFormState = {
  name: string
  description: string
  triggerType: 'LeadStatusChanged' | 'TaskOverdue'
  actionType: 'CreateFollowUpTask' | 'SendNotification'
  leadStatus: string
  graceMinutes: string
  taskTitle: string
  taskDescription: string
  taskOwner: string
  taskDueInDays: string
  accountIdField: string
  contactIdField: string
  notificationMessage: string
  notificationChannel: string
}

const INITIAL_FORM: WorkflowFormState = {
  name: '',
  description: '',
  triggerType: 'LeadStatusChanged',
  actionType: 'CreateFollowUpTask',
  leadStatus: 'Qualified',
  graceMinutes: '15',
  taskTitle: 'Follow up with qualified lead',
  taskDescription: 'Reach out within two days to schedule a discovery call.',
  taskOwner: 'Automation Bot',
  taskDueInDays: '2',
  accountIdField: 'ConvertedAccountID',
  contactIdField: 'ConvertedContactID',
  notificationMessage: 'Task is overdue and needs immediate attention.',
  notificationChannel: 'Email',
}

const statusBadgeClass: Record<string, string> = {
  Succeeded: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
  Failed: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200',
  Pending: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
}

export default function WorkflowSettingsPage() {
  const [formState, setFormState] = useState<WorkflowFormState>(INITIAL_FORM)
  const [formMessage, setFormMessage] = useState<FormMessage>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rulesQuery = useMemo(() => buildWorkflowRulesQuery(''), [])
  const executionsQuery = useMemo(
    () => buildWorkflowExecutionsQuery('', { $top: '20' }),
    [],
  )

  const { data: rulesData, isLoading: rulesLoading, error: rulesError } = useWorkflowRules(rulesQuery)
  const { data: executionData, isLoading: executionsLoading, error: executionsError } =
    useWorkflowExecutions(executionsQuery)

  const rules = (rulesData?.items as WorkflowRule[]) ?? []
  const executions = (executionData?.items as WorkflowExecution[]) ?? []

  const createRule = useCreateWorkflowRule()
  const updateRule = useUpdateWorkflowRule()
  const deleteRule = useDeleteWorkflowRule()

  const handleFormChange = (field: keyof WorkflowFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value
      setFormState((prev) => ({ ...prev, [field]: value }))
    }

  const resetForm = () => {
    setFormState(INITIAL_FORM)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormMessage(null)
    setIsSubmitting(true)

    try {
      const triggerConfig =
        formState.triggerType === 'LeadStatusChanged'
          ? { status: formState.leadStatus }
          : { graceMinutes: Number(formState.graceMinutes) || 0 }

      const actionConfig =
        formState.actionType === 'CreateFollowUpTask'
          ? {
              title: formState.taskTitle,
              description: formState.taskDescription,
              owner: formState.taskOwner,
              dueInDays: Number(formState.taskDueInDays) || 0,
              accountIdField: formState.accountIdField,
              contactIdField: formState.contactIdField,
            }
          : {
              message: formState.notificationMessage,
              channel: formState.notificationChannel,
            }

      const entityType = formState.triggerType === 'LeadStatusChanged' ? 'Lead' : 'Task'

      await createRule.mutateAsync({
        Name: formState.name,
        Description: formState.description,
        EntityType: entityType,
        TriggerType: formState.triggerType,
        TriggerConfig: triggerConfig,
        ActionType: formState.actionType,
        ActionConfig: actionConfig,
        IsActive: true,
      })

      setFormMessage({ type: 'success', text: 'Workflow rule created successfully.' })
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create workflow rule.'
      setFormMessage({ type: 'error', text: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleRule = (rule: WorkflowRule) => {
    updateRule.mutate({
      id: rule.ID,
      payload: { IsActive: !rule.IsActive },
    })
  }

  const handleDeleteRule = (rule: WorkflowRule) => {
    if (!window.confirm(`Delete workflow rule "${rule.Name}"?`)) {
      return
    }
    deleteRule.mutate(rule.ID)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workflow Automation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure automation rules that respond to CRM data changes and monitor execution history.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create workflow rule</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Combine triggers and actions to automate follow-up tasks and notifications.
            </p>
          </div>

          {formMessage && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                formMessage.type === 'success'
                  ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                  : 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200'
              }`}
            >
              {formMessage.text}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Rule name"
              name="name"
              value={formState.name}
              onChange={handleFormChange('name')}
              required
            />

            <Textarea
              label="Description"
              name="description"
              value={formState.description}
              onChange={handleFormChange('description')}
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="triggerType">
                  Trigger
                </label>
                <select
                  id="triggerType"
                  className="input"
                  value={formState.triggerType}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      triggerType: event.target.value as WorkflowFormState['triggerType'],
                    }))
                  }
                >
                  {triggerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="actionType">
                  Action
                </label>
                <select
                  id="actionType"
                  className="input"
                  value={formState.actionType}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      actionType: event.target.value as WorkflowFormState['actionType'],
                    }))
                  }
                >
                  {actionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formState.triggerType === 'LeadStatusChanged' ? (
              <div>
                <label className="label" htmlFor="leadStatus">
                  Target lead status
                </label>
                <select
                  id="leadStatus"
                  className="input"
                  value={formState.leadStatus}
                  onChange={handleFormChange('leadStatus')}
                >
                  {leadStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <Input
                label="Grace period (minutes)"
                name="graceMinutes"
                type="number"
                min="0"
                value={formState.graceMinutes}
                onChange={handleFormChange('graceMinutes')}
              />
            )}

            {formState.actionType === 'CreateFollowUpTask' ? (
              <div className="space-y-4">
                <Input
                  label="Task title"
                  name="taskTitle"
                  value={formState.taskTitle}
                  onChange={handleFormChange('taskTitle')}
                  required
                />
                <Textarea
                  label="Task description"
                  name="taskDescription"
                  value={formState.taskDescription}
                  onChange={handleFormChange('taskDescription')}
                  rows={3}
                />
                <Input
                  label="Task owner"
                  name="taskOwner"
                  value={formState.taskOwner}
                  onChange={handleFormChange('taskOwner')}
                  required
                />
                <Input
                  label="Due in (days)"
                  name="taskDueInDays"
                  type="number"
                  min="0"
                  value={formState.taskDueInDays}
                  onChange={handleFormChange('taskDueInDays')}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Account field"
                    name="accountIdField"
                    value={formState.accountIdField}
                    onChange={handleFormChange('accountIdField')}
                  />
                  <Input
                    label="Contact field"
                    name="contactIdField"
                    value={formState.contactIdField}
                    onChange={handleFormChange('contactIdField')}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  label="Notification message"
                  name="notificationMessage"
                  value={formState.notificationMessage}
                  onChange={handleFormChange('notificationMessage')}
                  rows={3}
                  required
                />
                <div>
                  <label className="label" htmlFor="notificationChannel">
                    Delivery channel
                  </label>
                  <select
                    id="notificationChannel"
                    className="input"
                    value={formState.notificationChannel}
                    onChange={handleFormChange('notificationChannel')}
                  >
                    {notificationChannels.map((channel) => (
                      <option key={channel} value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Create rule'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>
                Reset
              </Button>
            </div>
          </form>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Existing rules</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage workflow availability and remove obsolete rules.
              </p>
            </div>
            <span className="badge bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
              {rulesData?.count ?? rules.length} total
            </span>
          </div>

          {rulesLoading && (
            <div className="text-sm text-gray-600 dark:text-gray-400">Loading rules...</div>
          )}

          {rulesError && (
            <div className="text-sm text-error-600 dark:text-error-400">
              Error loading rules: {(rulesError as Error).message}
            </div>
          )}

          {!rulesLoading && !rulesError && (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trigger
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        No workflow rules configured yet.
                      </td>
                    </tr>
                  )}

                  {rules.map((rule) => (
                    <tr key={rule.ID}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{rule.Name}</div>
                        {rule.Description && (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{rule.Description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{rule.TriggerType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{rule.ActionType}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            rule.IsActive
                              ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {rule.IsActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={() => handleToggleRule(rule)}
                            disabled={updateRule.isPending}
                          >
                            {rule.IsActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="danger"
                            type="button"
                            onClick={() => handleDeleteRule(rule)}
                            disabled={deleteRule.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Execution history</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review the most recent workflow executions for auditing and troubleshooting.
            </p>
          </div>
          <span className="badge bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200">
            Showing last {executions.length}
          </span>
        </div>

        {executionsLoading && (
          <div className="text-sm text-gray-600 dark:text-gray-400">Loading execution history...</div>
        )}

        {executionsError && (
          <div className="text-sm text-error-600 dark:text-error-400">
            Error loading executions: {(executionsError as Error).message}
          </div>
        )}

        {!executionsLoading && !executionsError && (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rule
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trigger
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {executions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
                      No workflow executions yet.
                    </td>
                  </tr>
                )}

                {executions.map((execution) => (
                  <tr key={execution.ID}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {execution.WorkflowRule?.Name ?? `Rule #${execution.WorkflowRuleID}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Action: {execution.ActionType}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{execution.TriggerEvent}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {execution.EntityType} #{execution.EntityID}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusBadgeClass[execution.Status] ?? 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {execution.Status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {execution.ResultSummary ? (
                        <span>{execution.ResultSummary}</span>
                      ) : execution.ErrorMessage ? (
                        <span className="text-error-600 dark:text-error-400">{execution.ErrorMessage}</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No additional details</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300">
                      {execution.CompletedAt
                        ? new Date(execution.CompletedAt).toLocaleString()
                        : 'In progress'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
