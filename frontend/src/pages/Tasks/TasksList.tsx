import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Task } from '../../types'
import TaskList from '../../components/TaskList'

export default function TasksList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/Tasks?$expand=Account,Contact,Employee&$orderby=DueDate asc')
      return response.data
    },
  })

  const tasks = (data?.items as Task[]) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
        <Link to="/tasks/new" className="btn btn-primary">
          Add Task
        </Link>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading tasks...</div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading tasks: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <div className="card p-6">
          <TaskList
            tasks={tasks}
            emptyMessage="No tasks created yet"
            renderTitle={(task) => (
              <Link to={`/tasks/${task.ID}`} className="text-primary-600 hover:underline">
                {task.Title}
              </Link>
            )}
          />
        </div>
      )}
    </div>
  )
}
