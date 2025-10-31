import type { ReactNode } from 'react'
import type { Task } from '../types'
import { taskStatusToString } from '../types'

interface TaskListProps {
  tasks: Task[]
  emptyMessage?: string
  renderTitle?: (task: Task) => ReactNode
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

export default function TaskList({ tasks, emptyMessage = 'No tasks assigned', renderTitle }: TaskListProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400 text-center py-4">{emptyMessage}</p>
    )
  }

  const sortedTasks = [...tasks].sort((a, b) => (
    new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime()
  ))

  return (
    <div className="space-y-3">
      {sortedTasks.map((task) => (
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
  )
}
