import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserNotifications } from '@/lib/services/notifications'
import NotificationList from './components/NotificationList'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Get user notifications
  const notifications = await getUserNotifications(user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with your latest activities and achievements
          </p>
        </div>

        {/* Notification List */}
        <NotificationList initialNotifications={notifications} />
      </div>
    </div>
  )
}
