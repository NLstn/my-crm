import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Task } from '../types'
import { taskStatusToString } from '../types'
import type { TaskBucketKey, TaskBucketFilter } from './taskBuckets'
import { getTaskBuckets } from './taskBuckets'

interface TaskListProps {
  tasks: Task[]
  emptyMessage?: string
  renderTitle?: (task: Task) => ReactNode
  filter?: TaskBucketFilter
}


const statusBadgeClass = (status: number): string => {
  switch (status) {
    case 3:
      return 'badge badge-success'
    case 2:
      return 'badge badge-warning'
    case 4:
      return 'badge badge-primary'
    case 5:
      return 'badge badge-error'
    default:
      return 'badge badge-primary'
  }
}


const sectionStyles: Record<TaskBucketKey, { badge: string; heading: string; border: string }> = {
  overdue: {
    badge: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-200',
    heading: 'text-error-700 dark:text-error-300',
    border: 'border-error-200 dark:border-error-800',
  },
  dueSoon: {
    badge: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200',
    heading: 'text-warning-700 dark:text-warning-300',
    border: 'border-warning-200 dark:border-warning-800',
  },
  upcoming: {
    badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
    heading: 'text-primary-700 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-800',
  },
  completed: {
    badge: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-200',
    heading: 'text-success-700 dark:text-success-300',
    border: 'border-success-200 dark:border-success-800',
  },
}

export default function TaskList({
  tasks,
  emptyMessage = 'No tasks assigned',
  renderTitle,
  filter = 'all',
}: TaskListProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400 text-center py-4">{emptyMessage}</p>
    )
  }

  const buckets = getTaskBuckets(tasks)
  const sections: Array<{ key: TaskBucketKey; title: string; description?: string; tasks: Task[] }> = [
    {
      key: 'overdue',
      title: 'Overdue',
      description: 'Follow up immediately to get these back on track.',
      tasks: buckets.overdue,
    },
    {
      key: 'dueSoon',
      title: 'Due Soon',
      description: 'Coming up within the next few days.',
      tasks: buckets.dueSoon,
    },
    {
      key: 'upcoming',
      title: 'Upcoming',
      description: 'Scheduled later and not yet urgent.',
      tasks: buckets.upcoming,
    },
    {
      key: 'completed',
      title: 'Completed',
      description: 'Recently wrapped up tasks for reference.',
      tasks: buckets.completed,
    },
  ]

  const filteredSections = filter === 'all'
    ? sections
    : sections.filter(section => section.key === filter)

  const visibleSections = filteredSections.filter(section => section.tasks.length > 0)

  if (visibleSections.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400 text-center py-4">{emptyMessage}</p>
    )
  }

  return (
    <div className="space-y-6">
      {visibleSections.map(section => {
        const styles = sectionStyles[section.key]
        return (
          <section key={section.key} className="space-y-3">
            <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-2 ${styles.border}`}>
              <div className="flex items-center gap-3">
                <h2 className={`text-sm font-semibold uppercase tracking-wide ${styles.heading}`}>
                  {section.title}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}
                >
                  {section.tasks.length} {section.tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              {section.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{section.description}</p>
              )}
            </div>

            <div className="space-y-3">
              {section.tasks.map(task => (
                <div
                  key={task.ID}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {renderTitle ? renderTitle(task) : task.Title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due {new Date(task.DueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={statusBadgeClass(task.Status)}>
                        {taskStatusToString(task.Status)}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Owner: {task.Owner}
                      </span>
                    </div>
                  </div>
                  {task.Account && task.AccountID && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Account:{' '}
                      <Link to={`/accounts/${task.AccountID}`} className="text-primary-600 hover:underline">
                        {task.Account.Name}
                      </Link>
                    </div>
                  )}
                  {task.Lead && task.LeadID && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Lead:{' '}
                      <Link to={`/leads/${task.LeadID}`} className="text-primary-600 hover:underline">
                        {task.Lead.Name}
                      </Link>
                    </div>
                  )}
                  {task.Contact && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Contact: {task.Contact.FirstName} {task.Contact.LastName}
                    </div>
                  )}
                  {task.Description && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {task.Description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
