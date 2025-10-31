import type { ReactNode } from 'react'
import type { Activity } from '../types'

interface TimelineProps {
  activities: Activity[]
  emptyMessage?: string
  renderSubject?: (activity: Activity) => ReactNode
}

export default function Timeline({ activities, emptyMessage = 'No activity yet', renderSubject }: TimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400 text-center py-4">{emptyMessage}</p>
    )
  }

  const sortedActivities = [...activities].sort((a, b) => (
    new Date(b.ActivityTime).getTime() - new Date(a.ActivityTime).getTime()
  ))

  return (
    <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-6 ml-4">
      {sortedActivities.map((activity) => {
        const activityDate = new Date(activity.ActivityTime)
        return (
          <li key={activity.ID} className="ml-6">
            <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 text-xs font-semibold">
              {activity.ActivityType.charAt(0).toUpperCase()}
            </span>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {renderSubject ? renderSubject(activity) : activity.Subject}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activityDate.toLocaleString()}
                  </p>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-right space-y-1">
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {activity.ActivityType}
                  </div>
                  {activity.Contact && (
                    <div>Contact: {activity.Contact.FirstName} {activity.Contact.LastName}</div>
                  )}
                  {activity.Employee && (
                    <div>Owner: {activity.Employee.FirstName} {activity.Employee.LastName}</div>
                  )}
                </div>
              </div>
              {activity.Outcome && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-success-100 dark:bg-success-900 text-success-700 dark:text-success-300 px-2 py-0.5 text-xs font-medium">
                    Outcome: {activity.Outcome}
                  </span>
                </div>
              )}
              {activity.Notes && (
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {activity.Notes}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
