import type { Task } from '../types'

export type TaskBucketKey = 'overdue' | 'dueSoon' | 'upcoming' | 'completed'

export type TaskBucketFilter = TaskBucketKey | 'all'

export type TaskBuckets = Record<TaskBucketKey, Task[]>

const DUE_SOON_THRESHOLD_DAYS = 3

const toStartOfDay = (date: Date): Date => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const sortByDueDate = (items: Task[]): Task[] => {
  return [...items].sort((a, b) => {
    const aDate = parseDate(a.DueDate)?.getTime() ?? Number.POSITIVE_INFINITY
    const bDate = parseDate(b.DueDate)?.getTime() ?? Number.POSITIVE_INFINITY
    return aDate - bDate
  })
}

const sortByCompletedDate = (items: Task[]): Task[] => {
  return [...items].sort((a, b) => {
    const aDate = parseDate(a.CompletedAt ?? a.UpdatedAt)?.getTime() ?? 0
    const bDate = parseDate(b.CompletedAt ?? b.UpdatedAt)?.getTime() ?? 0
    return bDate - aDate
  })
}

export const getTaskBuckets = (tasks: Task[]): TaskBuckets => {
  const buckets: TaskBuckets = {
    overdue: [],
    dueSoon: [],
    upcoming: [],
    completed: [],
  }

  const today = toStartOfDay(new Date())
  const dueSoonThreshold = new Date(today)
  dueSoonThreshold.setDate(dueSoonThreshold.getDate() + DUE_SOON_THRESHOLD_DAYS)

  tasks.forEach(task => {
    const dueDate = parseDate(task.DueDate)
    const isCompleted = task.Status === 3 || Boolean(task.CompletedAt)

    if (isCompleted) {
      buckets.completed.push(task)
      return
    }

    if (!dueDate) {
      buckets.upcoming.push(task)
      return
    }

    if (dueDate < today) {
      buckets.overdue.push(task)
      return
    }

    if (dueDate <= dueSoonThreshold) {
      buckets.dueSoon.push(task)
      return
    }

    buckets.upcoming.push(task)
  })

  return {
    overdue: sortByDueDate(buckets.overdue),
    dueSoon: sortByDueDate(buckets.dueSoon),
    upcoming: sortByDueDate(buckets.upcoming),
    completed: sortByCompletedDate(buckets.completed),
  }
}
