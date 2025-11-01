import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import EntitySearch from '@/components/EntitySearch'
import TaskList from '@/components/TaskList'
import { getTaskBuckets, type TaskBucketFilter } from '@/components/taskBuckets'
import { Button } from '@/components/ui'
import api from '@/lib/api'
import { mergeODataQuery } from '@/lib/odataUtils'
import type { Task } from '@/types'

export default function TasksList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<TaskBucketFilter>('all')

  const overduePreset = useMemo(() => {
    const nowIso = new Date().toISOString()
    return {
      label: 'Overdue',
      filter: `Status ne 3 and DueDate lt datetimeoffset'${nowIso}'`,
    }
  }, [])

  const odataQuery = useMemo(
    () =>
      mergeODataQuery(searchQuery, {
        $expand: 'Account,Contact,Employee,Lead',
        $orderby: 'DueDate asc',
      }),
    [searchQuery],
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', odataQuery],
    queryFn: async () => {
      const response = await api.get(`/Tasks${odataQuery}`)
      return response.data
    },
  })

  const tasks = useMemo(
    () => ((data?.items as Task[]) || []),
    [data?.items],
  )
  const buckets = useMemo(() => getTaskBuckets(tasks), [tasks])

  const filterOptions: Array<{ key: TaskBucketFilter; label: string; count: number }> = useMemo(
    () => [
      { key: 'all', label: 'All', count: tasks.length },
      { key: 'overdue', label: 'Overdue', count: buckets.overdue.length },
      { key: 'dueSoon', label: 'Due Soon', count: buckets.dueSoon.length },
      { key: 'upcoming', label: 'Upcoming', count: buckets.upcoming.length },
      { key: 'completed', label: 'Completed', count: buckets.completed.length },
    ],
    [tasks.length, buckets.overdue.length, buckets.dueSoon.length, buckets.upcoming.length, buckets.completed.length],
  )

  const summaryCards = useMemo(
    () => [
      {
        key: 'overdue',
        label: 'Overdue',
        count: buckets.overdue.length,
        description: 'Tasks that are past their due date and need attention.',
        accent: 'text-error-600 dark:text-error-400',
      },
      {
        key: 'dueSoon',
        label: 'Due Soon',
        count: buckets.dueSoon.length,
        description: 'Due within the next few days—stay ahead of deadlines.',
        accent: 'text-warning-600 dark:text-warning-400',
      },
      {
        key: 'completed',
        label: 'Completed',
        count: buckets.completed.length,
        description: 'Recently closed out tasks for reference.',
        accent: 'text-success-600 dark:text-success-400',
      },
    ],
    [buckets.completed.length, buckets.dueSoon.length, buckets.overdue.length],
  )

  const handleFilterChange = (nextFilter: TaskBucketFilter) => {
    setActiveFilter(nextFilter)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
        <Link to="/tasks/new" className="btn btn-primary">
          Add Task
        </Link>
      </div>

      <EntitySearch
        searchPlaceholder="Search tasks by title, owner, or account..."
        sortOptions={[
          { label: 'Due Date (Soonest)', value: 'DueDate asc' },
          { label: 'Due Date (Latest)', value: 'DueDate desc' },
          { label: 'Created (Newest)', value: 'CreatedAt desc' },
          { label: 'Created (Oldest)', value: 'CreatedAt asc' },
        ]}
        filterOptions={[]}
        filterPresets={[overduePreset]}
        onQueryChange={setSearchQuery}
        currentPage={1}
        pageSize={100}
      />

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading tasks...</div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading tasks: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryCards.map(card => (
              <div
                key={card.key}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
              >
                <p className={`text-sm font-semibold uppercase tracking-wide ${card.accent}`}>{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{card.count}</p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.map(option => (
                <Button
                  key={option.key}
                  variant={activeFilter === option.key ? 'primary' : 'secondary'}
                  onClick={() => handleFilterChange(option.key)}
                  className="flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <span>{option.label}</span>
                  <span className="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 px-2 py-0.5 text-xs font-semibold">
                    {option.count}
                  </span>
                </Button>
              ))}
            </div>

            <TaskList
              tasks={tasks}
              filter={activeFilter}
              emptyMessage="No tasks match this view yet"
              renderTitle={(task) => (
                <Link to={`/tasks/${task.ID}`} className="text-primary-600 hover:underline">
                  {task.Title}
                </Link>
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}
