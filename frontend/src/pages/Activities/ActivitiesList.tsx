import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Activity } from '../../types'
import Timeline from '../../components/Timeline'

export default function ActivitiesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await api.get('/Activities?$expand=Account,Contact,Employee&$orderby=ActivityTime desc')
      return response.data
    },
  })

  const activities = (data?.items as Activity[]) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Activities</h1>
        <Link to="/activities/new" className="btn btn-primary">
          Log Activity
        </Link>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading activities...</div>
      )}

      {error && (
        <div className="text-center py-8 text-error-600 dark:text-error-400">
          Error loading activities: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <div className="card p-6">
          <Timeline
            activities={activities}
            emptyMessage="No activities recorded yet"
            renderSubject={(activity) => (
              <Link to={`/activities/${activity.ID}`} className="text-primary-600 hover:underline">
                {activity.Subject}
              </Link>
            )}
          />
        </div>
      )}
    </div>
  )
}
