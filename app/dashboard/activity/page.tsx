import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserActivityTimeline, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ICONS, type ActivityLog } from '@/lib/services/activity-logs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ActivityTimelinePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const activities = await getUserActivityTimeline(user.id, 100)

  // Group activities by date
  const groupedActivities = activities.reduce<Record<string, ActivityLog[]>>((groups, activity) => {
    const date = new Date(activity.created_at).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Activity Timeline</h1>
          <p className="text-gray-600">
            A complete history of your actions and contributions on DaanSetu
          </p>
        </div>

        {/* Timeline */}
        {activities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activity Yet</h3>
            <p className="text-gray-600 mb-6">
              Start making an impact! Donate, volunteer, or create posts to see your activity here.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/campaigns"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Campaigns
              </Link>
              <Link
                href="/volunteer/opportunities"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Find Opportunities
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    {date}
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="space-y-4">
                  {dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{ACTIVITY_TYPE_ICONS[activity.activity_type]}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                          </h3>
                          {activity.metadata && (
                            <div className="text-sm text-gray-600 mt-1">
                              {activity.metadata.title && <p>{activity.metadata.title}</p>}
                              {activity.metadata.amount && (
                                <p>Amount: ₹{activity.metadata.amount.toLocaleString('en-IN')}</p>
                              )}
                              {activity.metadata.badge_type && (
                                <p className="capitalize">{activity.metadata.badge_type.replace('_', ' ')}</p>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(activity.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        {activity.entity_id && activity.entity_type && (
                          <Link
                            href={
                              activity.entity_type === 'post'
                                ? `/community/posts/${activity.entity_id}`
                                : activity.entity_type === 'campaign'
                                ? `/campaigns/${activity.entity_id}`
                                : '#'
                            }
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
